import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function titleMatch(found, expected) {
  const normalize = (s) => s.toLowerCase()
    .replace(/[«»""''\-–—,:;!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const a = normalize(found);
  const b = normalize(expected);
  if (a.includes(b) || b.includes(a)) return { ok: true, score: 100 };
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  const common = wordsA.filter(w => w.length > 2 && wordsB.includes(w));
  const score = Math.round((common.length / Math.max(wordsA.length, wordsB.length)) * 100);
  return { ok: score >= 70, score };
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

async function tryGoogleBooks(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=5&langRestrict=ru`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `Google Books: ошибка ${res.status}` };
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return { url: null, reason: 'Google Books: ничего не найдено' };

    for (const item of items) {
      const foundTitle = item.volumeInfo?.title || '';
      const match = titleMatch(foundTitle, title);
      if (!match.ok) {
        console.log(`    Google Books: нашёл "${foundTitle}" — не совпадает (${match.score}%)`);
        continue;
      }
      const images = item.volumeInfo?.imageLinks;
      if (!images) {
        console.log(`    Google Books: "${foundTitle}" совпадает, но нет обложки`);
        continue;
      }
      let url = images.extraLarge || images.large || images.medium || images.thumbnail;
      if (!url) continue;
      url = url
        .replace('http://', 'https://')
        .replace('zoom=1', 'zoom=3')
        .replace('&edge=curl', '');
      const ok = await testImageUrl(url);
      if (ok) return { url, reason: null };
    }
    return { url: null, reason: 'Google Books: совпадений с нужным названием не найдено' };
  } catch (e) {
    return { url: null, reason: `Google Books: ${e.message}` };
  }
}

async function tryLitres(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://api.litres.ru/foundation/api/arts?search=${query}&limit=5`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) return { url: null, reason: `ЛитРес: ошибка ${res.status}` };
    const data = await res.json();
    const items = data?.payload?.items || [];
    if (items.length === 0) return { url: null, reason: 'ЛитРес: ничего не найдено' };

    for (const item of items) {
      const foundTitle = item.title || '';
      const match = titleMatch(foundTitle, title);
      if (!match.ok) {
        console.log(`    ЛитРес: нашёл "${foundTitle}" — не совпадает (${match.score}%)`);
        continue;
      }
      const cover = item.cover?.url || item.coverLarge?.url;
      if (!cover) {
        console.log(`    ЛитРес: "${foundTitle}" совпадает, но нет обложки`);
        continue;
      }
      const url = cover.startsWith('http') ? cover : `https:${cover}`;
      const ok = await testImageUrl(url);
      if (ok) return { url, reason: null };
    }
    return { url: null, reason: 'ЛитРес: совпадений с нужным названием не найдено' };
  } catch (e) {
    return { url: null, reason: `ЛитРес: ${e.message}` };
  }
}

async function tryOpenLibrary(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=5&language=rus`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `OpenLibrary: ошибка ${res.status}` };
    const data = await res.json();
    const docs = data.docs || [];
    if (docs.length === 0) return { url: null, reason: 'OpenLibrary: ничего не найдено' };

    for (const doc of docs) {
      const foundTitle = doc.title || '';
      const match = titleMatch(foundTitle, title);
      if (!match.ok) {
        console.log(`    OpenLibrary: нашёл "${foundTitle}" — не совпадает (${match.score}%)`);
        continue;
      }
      if (!doc.cover_i) {
        console.log(`    OpenLibrary: "${foundTitle}" совпадает, но нет обложки`);
        continue;
      }
      const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      const ok = await testImageUrl(url);
      if (ok) return { url, reason: null };
    }
    return { url: null, reason: 'OpenLibrary: совпадений с нужным названием не найдено' };
  } catch (e) {
    return { url: null, reason: `OpenLibrary: ${e.message}` };
  }
}

async function downloadAndUpload(imageUrl, bookId) {
  const res = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  const blob = await res.blob();
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
      let foundUrl = null;

      const sources = [
        { name: 'Google Books', fn: () => tryGoogleBooks(book.title, book.author) },
        { name: 'ЛитРес', fn: () => tryLitres(book.title, book.author) },
        { name: 'OpenLibrary', fn: () => tryOpenLibrary(book.title, book.author) },
      ];

      for (const source of sources) {
        await sleep(500);
        const result = await source.fn();
        if (result.url) {
          foundUrl = result.url;
          console.log(`  ✅ ${source.name}`);
          break;
        } else {
          console.log(`  ⏭️  ${result.reason}`);
        }
      }

      if (!foundUrl) {
        console.log(`  ⚠️  Не найдена ни на одном сайте\n`);
        failed++;
        failedBooks.push(`${book.title} — ${book.author}`);
        continue;
      }

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
    console.log('\n📋 Книги без обложки:');
    failedBooks.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
