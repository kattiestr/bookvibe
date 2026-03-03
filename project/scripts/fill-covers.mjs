import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Проверяет совпадение названия (минимум 70%)
function titleMatch(found, expected) {
  const normalize = (s) => s.toLowerCase().replace(/[«»""''\-–—,:;!?()]/g, '').replace(/\s+/g, ' ').trim();
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

async function tryLitres(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.litres.ru/api/5/search/?phrase=${query}&limit=3&type=art`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `ЛитРес: ошибка ${res.status}` };
    const data = await res.json();
    const items = data?.payload?.data?.arts || [];
    if (items.length === 0) return { url: null, reason: 'ЛитРес: ничего не найдено' };

    for (const item of items) {
      const foundTitle = item.title || '';
      const match = titleMatch(foundTitle, title);
      if (!match.ok) {
        continue;
      }
      const cover = item.cover || item.coverLarge;
      if (!cover) continue;
      const url = cover.startsWith('http') ? cover : `https:${cover}`;
      const ok = await testImageUrl(url);
      if (ok) return { url, reason: null };
    }
    const firstTitle = items[0]?.title || '?';
    const match = titleMatch(firstTitle, title);
    return { url: null, reason: `ЛитРес: нашёл "${firstTitle}" — не совпадает (${match.score}%)` };
  } catch (e) {
    return { url: null, reason: `ЛитРес: ${e.message}` };
  }
}

async function tryOzon(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://api.ozon.ru/composer-api.bx/page/json/v2?url=/search/?text=${query}&from_global=true`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `Озон: ошибка ${res.status}` };
    const data = await res.json();
    const items = data?.widgetStates ? Object.values(data.widgetStates) : [];
    for (const raw of items) {
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const products = parsed?.items || parsed?.products || [];
        for (const p of products) {
          const foundTitle = p.title || p.name || '';
          if (!foundTitle) continue;
          const match = titleMatch(foundTitle, title);
          if (!match.ok) continue;
          const imageUrl = p.image || p.imageUrl || p.coverImage;
          if (!imageUrl) continue;
          const ok = await testImageUrl(imageUrl);
          if (ok) return { url: imageUrl, reason: null };
        }
      } catch { continue; }
    }
    return { url: null, reason: 'Озон: не найдено совпадений' };
  } catch (e) {
    return { url: null, reason: `Озон: ${e.message}` };
  }
}

async function tryChitaiGorod(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.chitai-gorod.ru/search?phrase=${query}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `Читай-город: ошибка ${res.status}` };
    const html = await res.text();
    const titleMatch2 = html.match(/og:title[^>]*content="([^"]+)"/);
    const imageMatch = html.match(/og:image[^>]*content="([^"]+)"/);
    if (!imageMatch) return { url: null, reason: 'Читай-город: обложка не найдена' };
    const foundTitle = titleMatch2?.[1] || '';
    const match = titleMatch(foundTitle, title);
    if (!match.ok) return { url: null, reason: `Читай-город: нашёл "${foundTitle}" — не совпадает (${match.score}%)` };
    const ok = await testImageUrl(imageMatch[1]);
    if (!ok) return { url: null, reason: 'Читай-город: изображение недоступно' };
    return { url: imageMatch[1], reason: null };
  } catch (e) {
    return { url: null, reason: `Читай-город: ${e.message}` };
  }
}

async function tryLabirint(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.labirint.ru/search/${query}/?stype=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `Лабиринт: ошибка ${res.status}` };
    const html = await res.text();
    const blocks = [...html.matchAll(/class="product-cover"[\s\S]*?<img[^>]*src="([^"]+)"[^>]*alt="([^"]+)"/g)];
    if (blocks.length === 0) return { url: null, reason: 'Лабиринт: ничего не найдено' };
    for (const block of blocks) {
      const imgUrl = block[1];
      const foundTitle = block[2];
      const match = titleMatch(foundTitle, title);
      if (!match.ok) continue;
      const url = imgUrl.startsWith('http') ? imgUrl : `https://www.labirint.ru${imgUrl}`;
      const ok = await testImageUrl(url);
      if (ok) return { url, reason: null };
    }
    const firstTitle = blocks[0]?.[2] || '?';
    const match = titleMatch(firstTitle, title);
    return { url: null, reason: `Лабиринт: нашёл "${firstTitle}" — не совпадает (${match.score}%)` };
  } catch (e) {
    return { url: null, reason: `Лабиринт: ${e.message}` };
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
      const reasons = [];

      const sources = [
        { name: 'ЛитРес', fn: () => tryLitres(book.title, book.author) },
        { name: 'Озон', fn: () => tryOzon(book.title, book.author) },
        { name: 'Читай-город', fn: () => tryChitaiGorod(book.title, book.author) },
        { name: 'Лабиринт', fn: () => tryLabirint(book.title, book.author) },
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
          reasons.push(result.reason);
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
