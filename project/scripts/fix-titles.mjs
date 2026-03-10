import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_BOOKS_KEY = process.env.VITE_GOOGLE_BOOKS_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function normalize(s) {
  return s.toLowerCase()
    .replace(/[«»""''\-–—,:;!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  a = normalize(a);
  b = normalize(b);
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  
  const wordsA = a.split(' ');
  const wordsB = b.split(' ');
  const common = wordsA.filter(w => wordsB.includes(w) && w.length > 2);
  return common.length / Math.max(wordsA.length, wordsB.length);
}

// Пропускаем фанфики и русские тексты
function shouldSkip(book) {
  const skipWords = ['fanfiction', 'фанфик', 'harry potter', 'pov', 
                     'deleted chapter', 'bonus', 'глава'];
  const hasRussian = /[а-яёА-ЯЁ]/.test(book.title);
  const hasSkipWord = skipWords.some(w => 
    book.title.toLowerCase().includes(w)
  );
  return hasRussian || hasSkipWord;
}

async function searchGoodreads(title, author) {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=10&key=${GOOGLE_BOOKS_KEY}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items || [];
  } catch { return null; }
}

async function searchOpenLibrary(title, author) {
  try {
    const query = encodeURIComponent(`title=${title}&author=${author}`);
    const res = await fetch(
      `https://openlibrary.org/search.json?${query}&limit=10`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.docs || [];
  } catch { return null; }
}

async function findCorrectTitle(book) {
  // Сначала ищем в Google Books
  let items = await searchGoodreads(book.title, book.author);
  
  if (items && items.length > 0) {
    for (const item of items) {
      const foundTitle = item.volumeInfo?.title || '';
      const foundAuthor = (item.volumeInfo?.authors || []).join(', ');
      const score = similarity(foundTitle, book.title);
      
      // Проверяем что автор совпадает
      const authorMatch = normalize(foundAuthor).includes(
        normalize(book.author.split(',')[0])
      );
      
      if (score >= 0.8 && authorMatch) {
        return { 
          source: 'Google Books',
          title: foundTitle,
          score 
        };
      }
    }
  }

  await sleep(500);

  // Если не нашли — ищем в Open Library
  const docs = await searchOpenLibrary(book.title, book.author);
  
  if (docs && docs.length > 0) {
    for (const doc of docs) {
      const foundTitle = doc.title || '';
      const score = similarity(foundTitle, book.title);
      
      if (score >= 0.8) {
        return {
          source: 'Open Library',
          title: foundTitle,
          score
        };
      }
    }
  }

  return null;
}

async function main() {
  console.log('🔍 Ищем и исправляем неверные названия...\n');

  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, language')
    .order('author');

  if (error) { console.error('❌ Ошибка:', error); return; }
  console.log(`📚 Всего книг: ${books.length}\n`);

  const fixed = [];
  const notFound = [];
  const skipped = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];

    // Пропускаем фанфики и русские
    if (shouldSkip(book)) {
      console.log(`[${i + 1}/${books.length}] ⏭️  Пропускаем: "${book.title}"`);
      skipped.push(book.title);
      continue;
    }

    console.log(`[${i + 1}/${books.length}] 🔍 "${book.title}" — ${book.author}`);

    const result = await findCorrectTitle(book);

    if (result && result.title !== book.title) {
      console.log(`  ✅ Исправляем:`);
      console.log(`     Было:  "${book.title}"`);
      console.log(`     Стало: "${result.title}"`);
      console.log(`     Источник: ${result.source} (совпадение: ${Math.round(result.score * 100)}%)\n`);

      // Исправляем в базе
      const { error: updateError } = await supabase
        .from('books')
        .update({ title: result.title })
        .eq('id', book.id);

      if (updateError) {
        console.log(`  ❌ Ошибка обновления: ${updateError.message}`);
      } else {
        fixed.push({
          was: book.title,
          now: result.title,
          author: book.author,
          source: result.source
        });
      }
    } else if (!result) {
      console.log(`  ⚠️  Не найдено — требует ручной проверки\n`);
      notFound.push(`"${book.title}" — ${book.author}`);
    } else {
      console.log(`  ✅ Название верное\n`);
    }

    await sleep(1000);
  }

  // Итоговый отчёт
  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Исправлено: ${fixed.length}`);
  console.log(`⚠️  Не найдено: ${notFound.length}`);
  console.log(`⏭️  Пропущено: ${skipped.length}`);

  if (fixed.length > 0) {
    console.log('\n📋 Что исправили:');
    fixed.forEach(f => {
      console.log(`\n  Автор: ${f.author}`);
      console.log(`  Было:  "${f.was}"`);
      console.log(`  Стало: "${f.now}"`);
      console.log(`  Источник: ${f.source}`);
    });
  }

  if (notFound.length > 0) {
    console.log('\n⚠️  Требуют ручной проверки:');
    notFound.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
