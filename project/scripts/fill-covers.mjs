import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Строгая проверка совпадения названия ──
function titleMatch(found, expected) {
  const normalize = (s) => s.toLowerCase()
    .replace(/[«»""''\-–—,:;!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const a = normalize(found);
  const b = normalize(expected);

  // Точное совпадение или одно содержит другое
  if (a === b) return { ok: true, score: 100 };
  if (a.includes(b) || b.includes(a)) return { ok: true, score: 90 };

  // Совпадение по словам (порог повышен до 80%)
  const wordsA = a.split(' ').filter(w => w.length > 2);
  const wordsB = b.split(' ').filter(w => w.length > 2);
  if (wordsA.length === 0 || wordsB.length === 0) return { ok: false, score: 0 };
  const common = wordsA.filter(w => wordsB.includes(w));
  const score = Math.round((common.length / Math.max(wordsA.length, wordsB.length)) * 100);
  return { ok: score >= 80, score };
}

// ── Строгая проверка автора ──
function authorMatch(found, expected) {
  if (!found || !expected) return false;
  const normalize = (s) => s.toLowerCase()
    .replace(/[.,\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const a = normalize(found);
  const b = normalize(expected);
  if (a.includes(b) || b.includes(a)) return true;
  // Проверка по фамилии (последнее слово)
  const lastA = a.split(' ').pop();
  const lastB = b.split(' ').pop();
  return lastA === lastB && lastA.length > 3;
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

// ── Google Books (без langRestrict — ищем английские обложки) ──
async function tryGoogleBooks(title, author) {
  try {
    const query = encodeURIComponent(`intitle:"${title}" inauthor:"${author}"`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10&orderBy=relevance`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `Google Books: ошибка ${res.status}` };
    const data = await res.json();
    const items = data.items || [];
    if (items.length === 0) return { url: null, reason: 'Google Books: ничего не найдено' };

    for (const item of items) {
      const info = item.volumeInfo || {};
      const foundTitle = info.title || '';
      const foundAuthors = (info.authors || []).join(', ');

      const tMatch = titleMatch(foundTitle, title);
      if (!tMatch.ok) {
        console.log(`    Google Books: "${foundTitle}" — название не совпадает (${tMatch.score}%)`);
        continue;
      }

      if (!authorMatch(foundAuthors, author)) {
        console.log(`    Google Books: "${foundTitle}" — автор не совпадает ("${foundAuthors}")`);
        continue;
      }

      const images = info.imageLinks;
      if (!images) {
        console.log(`    Google Books: "${foundTitle}" ✓ — но нет обложки`);
        continue;
      }

      let url = images.extraLarge || images.large || images.medium || images.thumbnail;
      if (!url) continue;
      url = url
        .replace('http://', 'https://')
        .replace('zoom=1', 'zoom=3')
        .replace('&edge=curl', '');

      const ok = await testImageUrl(url);
      if (ok) {
        console.log(`    Google Books: "${foundTitle}" ✓ автор: "${foundAuthors}" ✓`);
        return { url, reason: null };
      }
    }
    return { url: null, reason: 'Google Books: совпадений не найдено' };
  } catch (e) {
    return { url: null, reason: `Google Books: ${e.message}` };
  }
}

// ── ЛитРес ──
async function tryLitres(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://api.litres.ru/foundation/api/arts?search=${query}&limit=10`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) return { url: null, reason: `ЛитРес: ошибка ${res.status}` };
    const data = await res.json();
    const items = data?.payload?.items || [];
    if (items.length === 0) return { url: null, reason: 'ЛитРес: ничего не найдено' };

    for (const item of items) {
      const foundTitle = item.title || '';
      const foundAuthor = (item.authors || []).map(a => a.full_name || '').join(', ');

      const tMatch = titleMatch(foundTitle, title);
      if (!tMatch.ok) {
        console.log(`    ЛитРес: "${foundTitle}" — название не совпадает (${tMatch.score}%)`);
        continue;
      }

      if (!authorMatch(foundAuthor, author)) {
        console.log(`    ЛитРес: "${foundTitle}" — автор не совпадает ("${foundAuthor}")`);
        continue;
      }

      const cover = item.cover?.url || item.coverLarge?.url;
      if (!cover) {
        console.log(`    ЛитРес: "${foundTitle}" ✓ — но нет обложки`);
        continue;
      }

      const url = cover.startsWith('http') ? cover : `https:${cover}`;
      const ok = await testImageUrl(url);
      if (ok) {
        console.log(`    ЛитРес: "${foundTitle}" ✓ автор: "${foundAuthor}" ✓`);
        return { url, reason: null };
      }
    }
    return { url: null, reason: 'ЛитРес: совпадений не найдено' };
  } catch (e) {
    return { url: null, reason: `ЛитРес: ${e.message}` };
  }
}

// ── OpenLibrary ──
async function tryOpenLibrary(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=10`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return { url: null, reason: `OpenLibrary: ошибка ${res.status}` };
    const data = await res.json();
    const docs = data.docs || [];
    if (docs.length === 0) return { url: null, reason: 'OpenLibrary: ничего не найдено' };

    for (const doc of docs) {
      const foundTitle = doc.title || '';
      const foundAuthor = (doc.author_name || []).join(', ');

      const tMatch = titleMatch(foundTitle, title);
      if (!tMatch.ok) {
        console.log(`    OpenLibrary: "${foundTitle}" — название не совпадает (${tMatch.score}%)`);
        continue;
      }

      if (!authorMatch(foundAuthor, author)) {
        console.log(`    OpenLibrary: "${foundTitle}" — автор не совпадает ("${foundAuthor}")`);
        continue;
      }

      if (!doc.cover_i) {
        console.log(`    OpenLibrary: "${foundTitle}" ✓ — но нет обложки`);
        continue;
      }

      const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      const ok = await testImageUrl(url);
      if (ok) {
        console.log(`    OpenLibrary: "${foundTitle}" ✓ автор: "${foundAuthor}" ✓`);
        return { url, reason: null };
      }
    }
    return { url: null, reason: 'OpenLibrary: совпадений не найдено' };
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

  // Загружаем ВСЕ книги без обложки (en и ru)
  const { data: allBooks, error } = await supabase
    .from('books')
    .select('id, title, author, language, series_id, series_number, cover_path')
    .or('cover_path.is.null,cover_path.eq.')
    .order('language') // 'en' идёт раньше 'ru'
    .order('series_id')
    .order('series_number');

  if (error) { console.error('❌ Ошибка:', error); return; }

  const enBooks = allBooks.filter(b => b.language === 'en');
  const ruBooks = allBooks.filter(b => b.language === 'ru');

  console.log(`📚 Английских без обложки: ${enBooks.length}`);
  console.log(`📚 Русских без обложки: ${ruBooks.length}\n`);

  // Индекс: "series_id|series_number" → cover_path
  // Заполняем уже существующими EN обложками из БД
  const { data: existingEnCovers } = await supabase
    .from('books')
    .select('series_id, series_number, cover_path')
    .eq('language', 'en')
    .not('cover_path', 'is', null)
    .neq('cover_path', '');

  const enCoverIndex = {};
  for (const b of (existingEnCovers || [])) {
    if (b.series_id && b.series_number != null) {
      enCoverIndex[`${b.series_id}|${b.series_number}`] = b.cover_path;
    }
  }

  // Индекс для standalone: "author|title_normalized" → cover_path
  const enStandaloneIndex = {};
  const { data: existingEnStandalone } = await supabase
    .from('books')
    .select('author, title, cover_path')
    .eq('language', 'en')
    .is('series_id', null)
    .not('cover_path', 'is', null)
    .neq('cover_path', '');

  for (const b of (existingEnStandalone || [])) {
    const key = `${b.author}|${b.title.toLowerCase().trim()}`;
    enStandaloneIndex[key] = b.cover_path;
  }

  let success = 0, failed = 0;
  const failedBooks = [];

  // ════════════════════════════════════════
  // 1. АНГЛИЙСКИЕ КНИГИ
  // ════════════════════════════════════════
  console.log('🇬🇧 ── Английские книги ──\n');

  for (let i = 0; i < enBooks.length; i++) {
    const book = enBooks[i];
    console.log(`[EN ${i + 1}/${enBooks.length}] "${book.title}" — ${book.author}`);

    try {
      let foundUrl = null;

      const sources = [
        { name: 'Google Books', fn: () => tryGoogleBooks(book.title, book.author) },
        { name: 'OpenLibrary',  fn: () => tryOpenLibrary(book.title, book.author) },
        { name: 'ЛитРес',      fn: () => tryLitres(book.title, book.author) },
      ];

      for (const source of sources) {
        await sleep(500);
        const result = await source.fn();
        if (result.url) {
          foundUrl = result.url;
          console.log(`  ✅ Найдено: ${source.name}`);
          break;
        } else {
          console.log(`  ⏭️  ${result.reason}`);
        }
      }

      if (!foundUrl) {
        console.log(`  ⚠️  Не найдена\n`);
        failed++;
        failedBooks.push(`[EN] ${book.title} — ${book.author}`);
        continue;
      }

      const publicUrl = await downloadAndUpload(foundUrl, book.id);
      await updateCoverPath(book.id, publicUrl);

      // Сохраняем в индекс для русских книг
      if (book.series_id && book.series_number != null) {
        enCoverIndex[`${book.series_id}|${book.series_number}`] = publicUrl;
      } else if (!book.series_id) {
        const key = `${book.author}|${book.title.toLowerCase().trim()}`;
        enStandaloneIndex[key] = publicUrl;
      }

      console.log(`  💾 Сохранено\n`);
      success++;
    } catch (err) {
      console.log(`  ❌ ${err.message}\n`);
      failed++;
      failedBooks.push(`[EN] ${book.title} — ${book.author}`);
    }

    await sleep(800);
  }

  // ════════════════════════════════════════
  // 2. РУССКИЕ КНИГИ
  // ════════════════════════════════════════
  console.log('\n🇷🇺 ── Русские книги ──\n');

  for (let i = 0; i < ruBooks.length; i++) {
    const book = ruBooks[i];
    console.log(`[RU ${i + 1}/${ruBooks.length}] "${book.title}" — ${book.author}`);

    try {
      // Ищем английскую пару по series_id + series_number
      if (book.series_id && book.series_number != null) {
        const key = `${book.series_id}|${book.series_number}`;
        if (enCoverIndex[key]) {
          await updateCoverPath(book.id, enCoverIndex[key]);
          console.log(`  🔗 Скопировано с EN версии\n`);
          success++;
          continue;
        }
      }

      // Standalone — ищем по автору и названию в EN standalone индексе
      // (для этого нужно знать английское название — его нет, поэтому ищем по API)
      console.log(`  ℹ️  EN пары нет — ищем самостоятельно...`);

      let foundUrl = null;

      const sources = [
        { name: 'ЛитРес',      fn: () => tryLitres(book.title, book.author) },
        { name: 'Google Books', fn: () => tryGoogleBooks(book.title, book.author) },
        { name: 'OpenLibrary',  fn: () => tryOpenLibrary(book.title, book.author) },
      ];

      for (const source of sources) {
        await sleep(500);
        const result = await source.fn();
        if (result.url) {
          foundUrl = result.url;
          console.log(`  ✅ Найдено: ${source.name}`);
          break;
        } else {
          console.log(`  ⏭️  ${result.reason}`);
        }
      }

      if (!foundUrl) {
        console.log(`  ⚠️  Не найдена\n`);
        failed++;
        failedBooks.push(`[RU] ${book.title} — ${book.author}`);
        continue;
      }

      const publicUrl = await downloadAndUpload(foundUrl, book.id);
      await updateCoverPath(book.id, publicUrl);
      console.log(`  💾 Сохранено\n`);
      success++;
    } catch (err) {
      console.log(`  ❌ ${err.message}\n`);
      failed++;
      failedBooks.push(`[RU] ${book.title} — ${book.author}`);
    }

    await sleep(800);
  }

  // ════════════════════════════════════════
  // ИТОГ
  // ════════════════════════════════════════
  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Успешно: ${success}`);
  console.log(`❌ Не найдено: ${failed}`);
  if (failedBooks.length > 0) {
    console.log('\n📋 Книги без обложки:');
    failedBooks.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
