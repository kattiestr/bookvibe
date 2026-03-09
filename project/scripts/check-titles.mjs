import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function normalize(s) {
  return s.toLowerCase()
    .replace(/[«»""''\-–—,:;!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleMatch(found, expected) {
  const a = normalize(found);
  const b = normalize(expected);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

async function searchGoogleBooks(title, author) {
  try {
    // Ищем по автору — все его книги
    const query = encodeURIComponent(`intitle:"${title}" inauthor:"${author}"`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&orderBy=relevance`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.items || [];
  } catch { return null; }
}

async function main() {
  console.log('🔍 Проверяем названия книг через Google Books...\n');

  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, author, language')
    .order('author');

  if (error) { console.error('❌ Ошибка:', error); return; }
  console.log(`📚 Всего книг: ${books.length}\n`);

  const problems = [];
  const notFound = [];

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`[${i + 1}/${books.length}] "${book.title}" — ${book.author}`);

    const items = await searchGoogleBooks(book.title, book.author);

    if (!items || items.length === 0) {
      console.log(`  ⚠️  Автор не найден в Google Books\n`);
      notFound.push(`"${book.title}" — ${book.author}`);
      await sleep(1000);
      continue;
    }

    // Ищем точное совпадение названия
    const exactMatch = items.find(item => 
      titleMatch(item.volumeInfo?.title || '', book.title)
    );

    if (exactMatch) {
      console.log(`  ✅ Найдено: "${exactMatch.volumeInfo.title}"\n`);
    } else {
      // Показываем что есть у этого автора
      const authorBooks = items
        .map(item => item.volumeInfo?.title)
        .filter(Boolean)
        .slice(0, 5);

      console.log(`  ❌ НЕ НАЙДЕНО! У автора есть:`);
      authorBooks.forEach(t => console.log(`     - "${t}"`));
      console.log('');

      problems.push({
        our: `"${book.title}" — ${book.author}`,
        found: authorBooks,
      });
    }

    await sleep(1000);
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`❌ Проблемные названия: ${problems.length}`);
  console.log(`⚠️  Автор не найден: ${notFound.length}`);

  if (problems.length > 0) {
    console.log('\n📋 Нужно проверить:');
    problems.forEach(p => {
      console.log(`\n  У нас: ${p.our}`);
      console.log(`  В Google Books:`);
      p.found.forEach(t => console.log(`    - "${t}"`));
    });
  }

  if (notFound.length > 0) {
    console.log('\n📋 Авторы не найдены в Google Books:');
    notFound.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
