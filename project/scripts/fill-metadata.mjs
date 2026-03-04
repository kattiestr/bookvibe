import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HARDCOVER_TOKEN = process.env.HARDCOVER_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Совпадение названия ──
function titleMatch(found, expected) {
  const normalize = (s) => s.toLowerCase()
    .replace(/[«»""''\-–—,:;!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const a = normalize(found);
  const b = normalize(expected);
  if (a === b) return { ok: true, score: 100 };
  if (a.includes(b) || b.includes(a)) return { ok: true, score: 90 };
  const wordsA = a.split(' ').filter(w => w.length > 2);
  const wordsB = b.split(' ').filter(w => w.length > 2);
  if (!wordsA.length || !wordsB.length) return { ok: false, score: 0 };
  const common = wordsA.filter(w => wordsB.includes(w));
  const score = Math.round((common.length / Math.max(wordsA.length, wordsB.length)) * 100);
  return { ok: score >= 80, score };
}

// ── Совпадение автора ──
function authorMatch(found, expected) {
  if (!found || !expected) return false;
  const normalize = (s) => s.toLowerCase().replace(/[.,\-]/g, '').replace(/\s+/g, ' ').trim();
  const a = normalize(found);
  const b = normalize(expected);
  if (a.includes(b) || b.includes(a)) return true;
  const lastA = a.split(' ').pop();
  const lastB = b.split(' ').pop();
  return lastA === lastB && lastA.length > 3;
}

// ── Spice по описанию (эвристика — fallback) ──
function estimateSpice(description, title) {
  if (!description) return null;
  const text = (description + ' ' + title).toLowerCase();

  const hotKeywords = [
    'explicit', 'erotic', 'steamy', 'sensual', 'passionate', 'seductive',
    'forbidden desire', 'burning desire', 'lust', 'temptation',
    'adult content', 'mature content', 'sexually', 'intimate scenes',
    'эротика', 'страсть', 'желание', 'соблазн', 'чувственн',
  ];
  const warmKeywords = [
    'romance', 'romantic', 'love story', 'attraction', 'chemistry',
    'falling in love', 'kiss', 'relationship',
    'романтика', 'любовь', 'влюбл', 'отношения', 'поцелу',
  ];
  const darkKeywords = [
    'dark romance', 'dark fantasy', 'anti-hero', 'villain', 'obsession',
    'possessive', 'toxic', 'mafia', 'bully', 'enemies to lovers',
    'тёмный роман', 'мафия', 'одержимость',
  ];

  const hotCount  = hotKeywords.filter(k => text.includes(k)).length;
  const warmCount = warmKeywords.filter(k => text.includes(k)).length;
  const darkCount = darkKeywords.filter(k => text.includes(k)).length;

  if (hotCount >= 3)                          return 5;
  if (hotCount >= 2)                          return 4;
  if (hotCount >= 1 && darkCount >= 1)        return 4;
  if (hotCount >= 1)                          return 3;
  if (darkCount >= 2)                         return 3;
  if (darkCount >= 1 && warmCount >= 1)       return 3;
  if (warmCount >= 2)                         return 2;
  if (warmCount >= 1)                         return 1;
  return 0;
}

// ── Конвертация тегов Hardcover в spice (1-5) ──
function tagsToSpice(tags) {
  if (!tags || tags.length === 0) return null;
  const tagNames = tags.map(t => (t.tag || t.name || '').toLowerCase());

  if (tagNames.some(t => ['explicit', 'very spicy', 'erotica', '5 flames'].includes(t))) return 5;
  if (tagNames.some(t => ['spicy', 'steamy', 'hot', '4 flames', 'open door'].includes(t))) return 4;
  if (tagNames.some(t => ['some spice', 'moderate', '3 flames', 'medium heat'].includes(t))) return 3;
  if (tagNames.some(t => ['mild', 'sweet', '2 flames', 'low heat', 'closed door'].includes(t))) return 2;
  if (tagNames.some(t => ['clean', 'no spice', '1 flame', 'inspirational'].includes(t))) return 1;
  return null;
}

// ════════════════════════════════════════
// ИСТОЧНИКИ
// ════════════════════════════════════════

async function fetchGoogleBooks(title, author) {
  try {
    const query = encodeURIComponent(`intitle:"${title}" inauthor:"${author}"`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10&orderBy=relevance`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();

    for (const item of (data.items || [])) {
      const info = item.volumeInfo || {};
      if (!titleMatch(info.title || '', title).ok) continue;
      if (!authorMatch((info.authors || []).join(', '), author)) continue;

      return {
        pages:       info.pageCount || null,
        year:        info.publishedDate ? parseInt(info.publishedDate) : null,
        description: info.description || null,
        isbn:        (info.industryIdentifiers || []).find(i => i.type === 'ISBN_13')?.identifier || null,
        spice:       null,
        source:      'Google Books',
        foundTitle:  info.title,
      };
    }
    return null;
  } catch { return null; }
}

async function fetchOpenLibrary(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=10`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();

    for (const doc of (data.docs || [])) {
      if (!titleMatch(doc.title || '', title).ok) continue;
      if (!authorMatch((doc.author_name || []).join(', '), author)) continue;

      return {
        pages:       doc.number_of_pages_median || null,
        year:        doc.first_publish_year || null,
        description: null,
        isbn:        (doc.isbn || [])[0] || null,
        spice:       null,
        source:      'OpenLibrary',
        foundTitle:  doc.title,
      };
    }
    return null;
  } catch { return null; }
}

async function fetchLitres(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://api.litres.ru/foundation/api/arts?search=${query}&limit=10`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();

    for (const item of (data?.payload?.items || [])) {
      const foundAuthor = (item.authors || []).map(a => a.full_name || '').join(', ');
      if (!titleMatch(item.title || '', title).ok) continue;
      if (!authorMatch(foundAuthor, author)) continue;

      return {
        pages:       item.pages || null,
        year:        item.year || null,
        description: item.annotation || null,
        isbn:        null,
        spice:       null,
        source:      'ЛитРес',
        foundTitle:  item.title,
      };
    }
    return null;
  } catch { return null; }
}

async function fetchHardcover(title, author) {
  if (!HARDCOVER_TOKEN) return null;
  try {
    const safeTitle  = title.replace(/"/g, '\\"');

    const query = `
      query {
        books(
          where: { title: { _ilike: "%${safeTitle}%" } }
          limit: 10
        ) {
          title
          pages
          release_year
          contributions { author { name } }
          taggings { tag { tag } }
          book_series { position }
          description
        }
      }
    `;

    const res = await fetch('https://api.hardcover.app/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${HARDCOVER_TOKEN}`,
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const books = data?.data?.books || [];

    for (const book of books) {
      const foundAuthor = (book.contributions || [])
        .map(c => c.author?.name || '')
        .join(', ');

      // ✅ Исправлено: используем author, а не safeAuthor
      if (!titleMatch(book.title || '', title).ok) continue;
      if (!authorMatch(foundAuthor, author)) continue;

      const tags  = (book.taggings || []).map(t => t.tag);
      const spice = tagsToSpice(tags);

      return {
        pages:       book.pages || null,
        year:        book.release_year || null,
        description: book.description || null,
        isbn:        null,
        spice,
        source:      'Hardcover',
        foundTitle:  book.title,
      };
    }
    return null;
  } catch (e) {
    console.log(`    Hardcover error: ${e.message}`);
    return null;
  }
}

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════

async function main() {
  console.log('🚀 Заполняем метаданные книг (pages, year, spice, description)...\n');

  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, language, pages, year, spice, isbn, description')
    .or('pages.is.null,year.is.null,spice.is.null')
    .order('language')
    .order('title');

  if (error) { console.error('❌ Ошибка:', error); return; }
  console.log(`📚 Книг для обработки: ${books.length}\n`);
  if (!HARDCOVER_TOKEN) {
    console.log('⚠️  HARDCOVER_TOKEN не задан — Hardcover будет пропущен\n');
  }

  let success = 0, partial = 0, failed = 0;
  const failedBooks  = [];
  const partialBooks = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    const lang = book.language === 'ru' ? '🇷🇺' : '🇬🇧';
    console.log(`[${i + 1}/${books.length}] ${lang} "${book.title}" — ${book.author}`);

    const needPages = book.pages       == null;
    const needYear  = book.year        == null;
    const needSpice = book.spice       == null;
    const needDesc  = !book.description;

    let merged = {
      pages:       book.pages,
      year:        book.year,
      spice:       book.spice,
      description: book.description || null,
      isbn:        book.isbn,
    };

    const sources = book.language === 'ru'
      ? [
          { name: 'ЛитРес',       fn: () => fetchLitres(book.title, book.author) },
          { name: 'Hardcover',    fn: () => fetchHardcover(book.title, book.author) },
          { name: 'Google Books', fn: () => fetchGoogleBooks(book.title, book.author) },
          { name: 'OpenLibrary',  fn: () => fetchOpenLibrary(book.title, book.author) },
        ]
      : [
          { name: 'Hardcover',    fn: () => fetchHardcover(book.title, book.author) },
          { name: 'Google Books', fn: () => fetchGoogleBooks(book.title, book.author) },
          { name: 'OpenLibrary',  fn: () => fetchOpenLibrary(book.title, book.author) },
          { name: 'ЛитРес',      fn: () => fetchLitres(book.title, book.author) },
        ];

    for (const source of sources) {
      const allFilled =
        (!needPages || merged.pages != null) &&
        (!needYear  || merged.year  != null) &&
        (!needSpice || merged.spice != null) &&
        (!needDesc  || merged.description != null);
      if (allFilled) break;

      await sleep(500);
      const result = await source.fn();

      if (!result) {
        console.log(`  ⏭️  ${source.name}: не найдено`);
        continue;
      }

      console.log(`  ✅ ${source.name}: "${result.foundTitle}"`);

      if (needPages && merged.pages == null && result.pages) {
        merged.pages = result.pages;
        console.log(`     📄 Страниц: ${result.pages}`);
      }
      if (needYear && merged.year == null && result.year) {
        merged.year = result.year;
        console.log(`     📅 Год: ${result.year}`);
      }
      if (needSpice && merged.spice == null && result.spice != null) {
        merged.spice = result.spice;
        console.log(`     🌶️  Spice (${source.name}): ${result.spice}/5`);
      }
      if (needDesc && !merged.description && result.description) {
        merged.description = result.description;
        console.log(`     📝 Description: получено`);
      }
      if (!merged.isbn && result.isbn) {
        merged.isbn = result.isbn;
      }
    }

    // Если spice всё ещё не найден — пробуем по описанию
    if (needSpice && merged.spice == null && merged.description) {
      const spice = estimateSpice(merged.description, book.title);
      if (spice != null) {
        merged.spice = spice;
        console.log(`     🌶️  Spice (эвристика): ${spice}/5`);
      }
    }

    // Формируем UPDATE только изменившихся полей
    const update = {};
    if (needPages && merged.pages != null)             update.pages       = merged.pages;
    if (needYear  && merged.year  != null)             update.year        = merged.year;
    if (needSpice && merged.spice != null)             update.spice       = merged.spice;
    if (needDesc  && merged.description)               update.description = merged.description; // ✅ Исправлено
    if (!book.isbn && merged.isbn)                     update.isbn        = merged.isbn;

    if (Object.keys(update).length === 0) {
      console.log(`  ⚠️  Ничего не найдено\n`);
      failed++;
      failedBooks.push(`${book.title} — ${book.author}`);
      continue;
    }

    try {
      const { error: updateError } = await supabase
        .from('books')
        .update(update)
        .eq('id', book.id);

      if (updateError) throw new Error(updateError.message);

      const filled = Object.keys(update).join(', ');
      const isComplete =
        (!needPages || update.pages != null) &&
        (!needYear  || update.year  != null) &&
        (!needSpice || update.spice != null);

      if (isComplete) {
        console.log(`  💾 Сохранено: ${filled}\n`);
        success++;
      } else {
        console.log(`  ⚠️  Частично: ${filled}\n`);
        partial++;
        partialBooks.push(`${book.title} (${filled})`);
      }
    } catch (err) {
      console.log(`  ❌ DB ошибка: ${err.message}\n`);
      failed++;
      failedBooks.push(`${book.title} — ${book.author}`);
    }

    await sleep(800);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Полностью: ${success}`);
  console.log(`⚠️  Частично: ${partial}`);
  console.log(`❌ Не найдено: ${failed}`);

  if (partialBooks.length > 0) {
    console.log('\n📋 Частично заполненные:');
    partialBooks.forEach(b => console.log(`  - ${b}`));
  }
  if (failedBooks.length > 0) {
    console.log('\n📋 Совсем без данных:');
    failedBooks.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
