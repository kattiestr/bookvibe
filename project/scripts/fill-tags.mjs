import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Все допустимые slug из твоей БД ──
const VALID_GENRES = [
  'fantasy-romance','dark-romance','contemporary-romance','romantasy',
  'paranormal-romance','historical-romance','sports-romance','romantic-suspense',
  'new-adult','young-adult','mafia-romance','bully-romance','rom-com',
  'thriller','literary-fiction','sci-fi-romance',
];

const VALID_MOODS = [
  'dark','angsty','fluffy','steamy','emotional','adventurous',
  'funny','intense','cozy','heartbreaking','empowering','mysterious',
];

const VALID_TROPES = [
  'enemies-to-lovers','friends-to-lovers','forced-proximity','fake-dating',
  'second-chance','forbidden-love','grumpy-sunshine','only-one-bed','slow-burn',
  'love-triangle','arranged-marriage','brother-best-friend','age-gap',
  'who-did-this-to-you','possessive-hero','morally-grey','touch-her-and-die',
  'villain-romance','redemption-arc','he-falls-first','she-falls-first',
  'found-family','magical-bond','rivals','bodyguard','secret-identity',
  'amnesia','revenge','childhood-friends','unrequited-love','obsessed-hero',
  'masked-man','stalker-romance','captive-romance','mafia-boss','bratty-heroine',
  'praise-kink','dominant-hero','dark-protector','anti-hero','monster-romance',
  'size-difference','billionaire','ceo-romance','royalty','power-imbalance',
  'sugar-daddy','fated-mates','vampire-romance','werewolf-romance','reverse-harem',
  'chosen-one','portal-fantasy','shifter-romance','witch-romance','priest-romance',
  'teacher-student','boss-employee','best-friends-sibling','single-parent',
  'nanny-romance','step-siblings','hurt-comfort','broken-hero',
  'sunshine-protects-grumpy','forced-marriage','marriage-of-convenience',
  'miscommunication','pining','one-that-got-away','widower-romance','road-trip',
  'coworkers-to-lovers','neighbors','bet-dare','holiday-romance','bookish-heroine',
  'opposites-attract','matchmaker','military-romance','spy-romance','detective-romance',
  'survival','heist','unreliable-narrator','plot-twist','whodunit','serial-killer',
  'locked-room','cold-case','missing-person','double-cross','gone-girl-vibes',
  'gaslight','cat-and-mouse','trapped','everyone-is-suspect','dark-secret',
  'psychological-thriller','true-crime-vibes','domestic-thriller','forensic',
  'conspiracy','last-page-twist','multiple-timelines','dual-pov-thriller',
  'revenge-thriller','perfect-life-facade','creepy-atmosphere','dystopia',
  'post-apocalyptic','time-travel','space-opera','ai-romance','alien-romance',
  'multiverse','clones','rebellion','virtual-reality','mad-scientist',
  'first-contact','coming-of-age','unreliable-memory','family-saga',
  'social-commentary','epistolary','magical-realism','tragic-ending',
  'beautiful-prose','based-on-true-story','book-within-book','war-backdrop','philosophical',
];

// ── Запрос к Claude ──
async function analyzeBook(book) {
  const prompt = `You are a book tagging expert for a romance/fiction reading app.

Analyze this book and return ONLY a valid JSON object, no explanation.

Book:
- Title: "${book.title}"
- Author: "${book.author}"
- Description: "${book.description || 'No description available'}"
- Language: ${book.language}

Return JSON with exactly these fields:

{
  "genres": [...],     // 1-3 items from: ${VALID_GENRES.join(', ')}
  "tropes": [...],     // 3-8 most relevant from: ${VALID_TROPES.join(', ')}
  "mood": [...],       // 2-4 items from: ${VALID_MOODS.join(', ')}
  "vibes": [...],      // 3-5 short punchy strings in the style of BookTok — fun, atmospheric, emotional. Like: "He's her enemy. He'd burn the world for her. 🔥" or "Slow burn that will have you screaming at 2am 😤"
  "description": "...", // 1-2 sentence engaging description in English. Keep it short and punchy.
  "similar_titles": [...] // 2-4 titles of similar books (just the title, no author)
}

IMPORTANT:
- Only use slugs from the lists provided, no custom values for genres/tropes/mood
- Vibes should feel like BookTok captions — short, emotional, fun, use emojis
- If book is in Russian, still return everything in English
- Return ONLY the JSON, no markdown, no explanation`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();

  // Убираем markdown если вдруг вернул
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

// ── Получить tag_id по slug ──
async function getTagIds(slugs, allTags) {
  return slugs
    .map(slug => allTags.find(t => t.slug === slug)?.id)
    .filter(Boolean);
}

// ── Найти book_id по названию ──
async function findBookIdByTitle(title, allBooks) {
  const normalize = s => s.toLowerCase().trim();
  const found = allBooks.find(b =>
    normalize(b.title).includes(normalize(title)) ||
    normalize(title).includes(normalize(b.title))
  );
  return found?.id || null;
}

// ════════════════════════════════════════
// MAIN
// ════════════════════════════════════════

async function main() {
  console.log('🚀 Заполняем теги, тропы, mood, vibes через Claude AI...\n');

  // Загружаем все теги из БД
  const { data: allTags, error: tagsError } = await supabase
    .from('tags')
    .select('id, slug, type');
  if (tagsError) { console.error('❌ Ошибка загрузки тегов:', tagsError); return; }
  console.log(`🏷️  Загружено тегов: ${allTags.length}`);

  // Загружаем все книги (для similar)
  const { data: allBooks, error: booksError } = await supabase
    .from('books')
    .select('id, title, language');
  if (booksError) { console.error('❌ Ошибка загрузки книг:', booksError); return; }
  console.log(`📚 Всего книг в БД: ${allBooks.length}`);

  // Книги для обработки:
  // - EN книги (основные)
  // - RU книги у которых НЕТ EN пары (русские авторы)
  // Логика: берём EN книги + RU книги без series_id совпадения с EN

  // Сначала берём все EN книги у которых нет тегов
  const { data: enBooks } = await supabase
    .from('books')
    .select('id, title, author, description, language, series_id, series_number')
    .eq('language', 'en')
    .order('title');

  // RU книги без EN пары — те у которых series_id не встречается среди EN книг
  const enSeriesIds = new Set(enBooks.map(b => b.series_id).filter(Boolean));
  const { data: ruBooks } = await supabase
    .from('books')
    .select('id, title, author, description, language, series_id, series_number')
    .eq('language', 'ru')
    .order('title');

  const ruOnlyBooks = ruBooks.filter(b => {
    if (!b.series_id) return true; // нет серии — точно нет EN пары
    return !enSeriesIds.has(b.series_id); // серия не встречается в EN
  });

  // Проверяем какие книги уже имеют теги
  const { data: existingBookTags } = await supabase
    .from('book_tags')
    .select('book_id');
  const taggedBookIds = new Set(existingBookTags.map(bt => bt.book_id));

  const toProcess = [
    ...enBooks.filter(b => !taggedBookIds.has(b.id)),
    ...ruOnlyBooks.filter(b => !taggedBookIds.has(b.id)),
  ];

  console.log(`\n📖 Книг для обработки: ${toProcess.length}`);
  console.log(`   (${enBooks.filter(b => !taggedBookIds.has(b.id)).length} EN + ${ruOnlyBooks.filter(b => !taggedBookIds.has(b.id)).length} RU без EN пары)\n`);

  let success = 0, failed = 0;
  const failedBooks = [];

  for (let i = 0; i < toProcess.length; i++) {
    const book = toProcess[i];
    const lang = book.language === 'ru' ? '🇷🇺' : '🇬🇧';
    console.log(`[${i + 1}/${toProcess.length}] ${lang} "${book.title}" — ${book.author}`);

    try {
      await sleep(500);
      const result = await analyzeBook(book);

      // Валидируем результат
      const validGenres = (result.genres || []).filter(s => VALID_GENRES.includes(s));
      const validTropes = (result.tropes || []).filter(s => VALID_TROPES.includes(s));
      const validMoods  = (result.mood   || []).filter(s => VALID_MOODS.includes(s));
      const vibes       = (result.vibes  || []).slice(0, 5);
      const description = result.description || null;
      const similarTitles = result.similar_titles || [];

      console.log(`  🎭 Genres: ${validGenres.join(', ')}`);
      console.log(`  🌶️  Tropes: ${validTropes.slice(0, 4).join(', ')}...`);
      console.log(`  💭 Mood:   ${validMoods.join(', ')}`);

      // ── Получаем ID тегов ──
      const genreIds = await getTagIds(validGenres, allTags);
      const tropeIds = await getTagIds(validTropes, allTags);
      const moodIds  = await getTagIds(validMoods,  allTags);

      // Vibes — ищем в таблице tags с type='vibe' или создаём новые
      const vibeIds = [];
      for (const vibe of vibes) {
        const slug = vibe
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 80);

        let existing = allTags.find(t => t.slug === slug && t.type === 'vibe');
        if (!existing) {
          const { data: newTag } = await supabase
            .from('tags')
            .insert({ slug, name: vibe, type: 'vibe' })
            .select()
            .single();
          if (newTag) {
            allTags.push(newTag); // добавляем в локальный кэш
            existing = newTag;
          }
        }
        if (existing) vibeIds.push(existing.id);
      }

      const allTagIds = [...new Set([...genreIds, ...tropeIds, ...moodIds, ...vibeIds])];

      // ── Сохраняем book_tags для EN книги ──
      if (allTagIds.length > 0) {
        const bookTagRows = allTagIds.map(tag_id => ({ book_id: book.id, tag_id }));
        await supabase.from('book_tags').upsert(bookTagRows, { onConflict: 'book_id,tag_id' });
      }

      // ── Сохраняем description ──
      if (description) {
        await supabase.from('books').update({ description }).eq('id', book.id);
      }

      // ── Сохраняем similar (book_similar) ──
      for (const similarTitle of similarTitles) {
        const similarId = await findBookIdByTitle(similarTitle, allBooks);
        if (similarId && similarId !== book.id) {
          await supabase
            .from('book_similar')
            .upsert({ book_id: book.id, similar_book_id: similarId }, {
              onConflict: 'book_id,similar_book_id'
            });
        }
      }

      // ── Копируем теги в RU пару (если это EN книга с серией) ──
      if (book.language === 'en' && book.series_id) {
        const ruPair = ruBooks.find(b =>
          b.series_id === book.series_id &&
          b.series_number === book.series_number
        );
        if (ruPair) {
          if (allTagIds.length > 0) {
            const ruTagRows = allTagIds.map(tag_id => ({ book_id: ruPair.id, tag_id }));
            await supabase.from('book_tags').upsert(ruTagRows, { onConflict: 'book_id,tag_id' });
          }
          if (description) {
            await supabase.from('books').update({ description }).eq('id', ruPair.id);
          }
          console.log(`  🔗 Скопировано в RU пару: "${ruPair.title}"`);
        }
      }

      console.log(`  ✅ Сохранено (${allTagIds.length} тегов)\n`);
      success++;

    } catch (err) {
      console.log(`  ❌ Ошибка: ${err.message}\n`);
      failed++;
      failedBooks.push(`${book.title} — ${book.author}`);
    }

    // Пауза между запросами чтобы не превысить rate limit
    await sleep(1500);
  }

  // ── Итог ──
  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Успешно: ${success}`);
  console.log(`❌ Ошибки:  ${failed}`);

  if (failedBooks.length > 0) {
    console.log('\n📋 Не обработаны:');
    failedBooks.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
