import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Читаем .env вручную
const env = readFileSync('.env', 'utf8');
const getEnv = (key) => {
  const line = env.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
const PROXY_URL = `${SUPABASE_URL}/functions/v1/proxy-image`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function tryOpenLibrary(isbn) {
  if (!isbn) return null;
  const clean = isbn.replace(/[-\s]/g, '');
  const url = `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`;
  const ok = await testImageUrl(url);
  return ok ? url : null;
}

async function tryGoogleBooks(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=3&printType=books`
    );
    if (!res.ok) return null;
    const data = await res.json();
    for (const item of data.items || []) {
      const images = item.volumeInfo?.imageLinks;
      if (!images) continue;
      let url = images.extraLarge || images.large || images.medium || images.thumbnail;
      if (!url) continue;
      url = url.replace('http://', 'https://').replace('zoom=1', 'zoom=3').replace('&edge=curl', '');
      const ok = await testImageUrl(url);
      if (ok) return url;
    }
    return null;
  } catch { return null; }
}

async function tryLitres(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://api.litres.ru/foundation/api/arts?search=${query}&limit=5`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const items = data?.payload?.data || [];
    for (const item of items) {
      const url = `https://cdn.litres.ru/pub/c/cover_415/${item.id}.jpg`;
      const ok = await testImageUrl(url);
      if (ok) return url;
    }
    return null;
  } catch { return null; }
}

async function testImageUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const type = res.headers.get('content-type') || '';
    const length = parseInt(res.headers.get('content-length') || '0');
    return type.startsWith('image/') && length > 5000;
  } catch { return false; }
}

async function downloadAndUpload(imageUrl, bookId) {
  const proxyRes = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: imageUrl }),
  });
  if (!proxyRes.ok) throw new Error(`Proxy error: ${proxyRes.status}`);
  const blob = await proxyRes.blob();
  if (blob.size < 5000) throw new Error(`Слишком маленькая: ${blob.size} байт`);
  const fileName = `books/${bookId}.jpg`;
  const { error } = await supabase.storage.from('covers').upload(fileName, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw new Error(`Storage error: ${error.message}`);
  const { data } = supabase.storage.from('covers').getPublicUrl(fileName);
  return data.publicUrl;
}

async function updateCoverPath(bookId, coverPath) {
  const { error } = await supabase.from('books').update({ cover_path: coverPath }).eq('id', bookId);
  if (error) throw new Error(`DB error: ${error.message}`);
}

async function main() {
  console.log('🚀 Запускаем заполнение обложек...\n');

  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, isbn, language')
    .or('cover_path.is.null,cover_path.eq.')
    .order('title');

  if (error) { console.error('❌ Ошибка:', error); return; }
  console.log(`📚 Книг без обложки: ${books.length}\n`);

  let success = 0, failed = 0;
  const failedBooks = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`[${i + 1}/${books.length}] "${book.title}" — ${book.author}`);

    try {
      let foundUrl = null, source = '';

      foundUrl = await tryOpenLibrary(book.isbn);
      if (foundUrl) source = 'OpenLibrary';

      if (!foundUrl) {
        await sleep(300);
        foundUrl = await tryGoogleBooks(book.title, book.author);
        if (foundUrl) source = 'Google Books';
      }

      if (!foundUrl) {
        await sleep(300);
        foundUrl = await tryLitres(book.title, book.author);
        if (foundUrl) source = 'ЛитРес';
      }

      if (!foundUrl) {
        console.log(`  ⚠️  Не найдена\n`);
        failed++;
        failedBooks.push(`${book.title} — ${book.author}`);
        continue;
      }

      console.log(`  ✅ ${source}`);
      const publicUrl = await downloadAndUpload(foundUrl, book.id);
      await updateCoverPath(book.id, publicUrl);
      console.log(`  💾 Сохранено\n`);
      success++;

    } catch (err) {
      console.log(`  ❌ ${err.message}\n`);
      failed++;
      failedBooks.push(`${book.title} — ${book.author}`);
    }

    await sleep(800);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Успешно: ${success}`);
  console.log(`❌ Не найдено: ${failed}`);
  if (failedBooks.length > 0) {
    console.log('\n📋 Вручную:');
    failedBooks.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
