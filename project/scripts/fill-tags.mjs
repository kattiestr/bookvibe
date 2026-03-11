import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
  'beautiful-prose','based-on-true-story','book-within-book','war-backdrop',
  'philosophical','no-happy-ending',
];

async function ensureTagExists(slug, type) {
  const { data: existing } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', slug)
    .eq('type', type)
    .maybeSingle();

  if (existing) return existing.id;

  const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const { data: newTag } = await supabase
    .from('tags')
    .insert({ slug, name, type })
    .select('id')
    .single();

  return newTag?.id || null;
}

async function analyzeBook(book, isSeries) {
  const prompt = `You are a book tagging expert for a romance/fiction reading app.
You have deep knowledge of published books — their plots, tropes, themes, and endings.

Book:
- Title: "${book.title}"
- Author: "${book.author}"
- Description: "${book.description || 'No description available'}"
- Is part of a series: ${isSeries ? 'YES' : 'NO — this is a standalone book'}

Return ONLY a valid JSON object with exactly these fields:

{
  "genres": [...],
  "tropes": [...],
  "mood": [...],
  "vibes": [...],
  "description": "...",
  "similar_titles": [...]
}

Rules:
- genres: 1-3 items, only from: ${VALID_GENRES.join(', ')}
- tropes: 3-8 most relevant, only from: ${VALID_TROPES.join(', ')}
- mood: 2-4 items, only from: ${VALID_MOODS.join(', ')}
- vibes: 3-5 items. These are SHORT punchy sentences in English that make a reader want to pick up this book RIGHT NOW. Write like a BookTok creator — with emotion, intrigue, no spoilers. Use emojis. NO dashes between words. Full sentences only. Examples:
  "He's her enemy. He'd burn the world for her. 🔥"
  "Slow burn so good you'll be screaming at 2am 😤"
  "Dark, possessive, and absolutely unhinged — in the best way 🖤"
  "She thought she hated him. She was so wrong. 💀"
  "If you like your heroes morally grey and obsessed, this is for you 😈"
- description: 1-2 sentences, punchy and engaging, in English, no spoilers
- similar_titles: 2-4 titles of similar well-known books

IMPORTANT — "no-happy-ending" tag:
- Add it ONLY if this is a STANDALONE book where the main character(s) die or the romance ends tragically with no resolution
- Do NOT add it if it is part of a series — the story continues in the next book
- Examples WITH this tag: "Me Before You", "The Fault in Our Stars", "Flowers for Algernon"

Return ONLY the JSON, no markdown, no explanation.`;

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(cleaned);
}

async function findBookIdByTitle(title, allBooks) {
  const normalize = s => s.toLowerCase().trim();
  return allBooks.find(b =>
    normalize(b.title).includes(normalize(title)) ||
    normalize(title).includes(normalize(b.title))
  )?.id || null;
}

async function main() {
  console.log('🚀 Заполняем теги через Claude AI...\n');

  // Загружаем все книги для similar
  const { data: allBooks } = await supabase
    .from('books')
    .select('id, title');

  // Загружаем EN книги
  const { data: enBooks } = await supabase
    .from('books')
    .select('id, title, author, description, language, series_id, series_number')
    .eq('language', 'en')
    .order('title');

  // Загружаем RU книги
  const { data: ruBooks } = await supabase
    .from('books')
    .select('id, title, author, description, language, series_id, series_number')
    .eq('language', 'ru')
    .order('title');

  const enSeriesIds = new Set(enBooks.map(b => b.series_id).filter(Boolean));
  const enAuthors = new Set(enBooks.map(b => b.author.toLowerCase().trim()));

  // RU книги только русских авторов без EN пары
  const ruOnlyBooks = ruBooks.filter(b => {
    if (b.series_id && enSeriesIds.has(b.series_id)) return false;
    if (enAuthors.has(b.author.toLowerCase().trim())) return false;
    return true;
  });

  // Книги уже с тегами
  const { data: existingBookTags } = await supabase
    .from('book_tags')
    .select('book_id');
  const taggedBookIds = new Set(existingBookTags.map(bt => bt.book_id));

  const toProcess = [
    ...enBooks.filter(b => !taggedBookIds.has(b.id)),
    ...ruOnlyBooks.filter(b => !taggedBookIds.has(b.id)),
  ];

  console.log(`📚 Всего книг в БД: ${allBooks.length}`);
  console.log(`📖 Книг для обработки: ${toProcess.length}`);
  console.log(`   EN: ${enBooks.filter(b => !taggedBookIds.has(b.id)).length}`);
  console.log(`   RU (без EN пары): ${ruOnlyBooks.filter(b => !taggedBookIds.has(b.id)).length}\n`);

  let success = 0, failed = 0;
  const failedBooks = [];

  for (let i = 0; i < toProcess.length; i++) {
    const book = toProcess[i];
    const isSeries = !!book.series_id;
    const lang = book.language === 'ru' ? '🇷🇺' : '🇬🇧';
    const type = isSeries ? '📚 серия' : '📕 одиночка';

    console.log(`[${i + 1}/${toProcess.length}] ${lang} ${type} — "${book.title}" by ${book.author}`);

    try {
      await sleep(500);
      const result = await analyzeBook(book, isSeries);

      const validGenres = (result.genres || []).filter(s => VALID_GENRES.includes(s));
      const validMoods  = (result.mood   || []).filter(s => VALID_MOODS.includes(s));
      let   validTropes = (result.tropes || []).filter(s => VALID_TROPES.includes(s));
      const vibes       = (result.vibes  || []).slice(0, 5);
      const description = result.description || null;
      const similarTitles = result.similar_titles || [];

      // Защита: серия никогда не получает no-happy-ending
      if (isSeries) {
        validTropes = validTropes.filter(t => t !== 'no-happy-ending');
      }

      console.log(`  🎭 Genres: ${validGenres.join(', ')}`);
      console.log(`  🌶️  Tropes: ${validTropes.join(', ')}`);
      console.log(`  💭 Mood:   ${validMoods.join(', ')}`);
      console.log(`  ✨ Vibes:  ${vibes.length} шт.`);
      if (validTropes.includes('no-happy-ending')) {
        console.log(`  💔 Помечена как NO HAPPY ENDING`);
      }

      // Собираем все tag_id
      const allTagIds = [];

      // Genres
      for (const slug of validGenres) {
        const id = await ensureTagExists(slug, 'genre');
        if (id) allTagIds.push(id);
      }

      // Tropes
      for (const slug of validTropes) {
        const id = await ensureTagExists(slug, 'trope');
        if (id) allTagIds.push(id);
      }

      // Moods
      for (const slug of validMoods) {
        const id = await ensureTagExists(slug, 'mood');
        if (id) allTagIds.push(id);
      }

      // Vibes — slug уникальный, name — красивый текст
      for (const vibe of vibes) {
        const slug = `vibe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const { data: newTag } = await supabase
          .from('tags')
          .insert({ slug, name: vibe, type: 'vibe' })
          .select('id')
          .single();
        if (newTag) allTagIds.push(newTag.id);
        await sleep(50);
      }

      // Сохраняем book_tags
      if (allTagIds.length > 0) {
        const uniqueIds = [...new Set(allTagIds)];
        const bookTagRows = uniqueIds.map(tag_id => ({ book_id: book.id, tag_id }));
        await supabase.from('book_tags').upsert(bookTagRows, { onConflict: 'book_id,tag_id' });
      }

      // Сохраняем description
      if (description) {
        await supabase.from('books').update({ description }).eq('id', book.id);
      }

      // Сохраняем similar
      for (const similarTitle of similarTitles) {
        const similarId = await findBookIdByTitle(similarTitle, allBooks);
        if (similarId && similarId !== book.id) {
          await supabase
            .from('book_similar')
            .upsert(
              { book_id: book.id, similar_book_id: similarId },
              { onConflict: 'book_id,similar_book_id' }
            );
        }
      }

      // Копируем в RU пару если это EN книга из серии
      if (book.language === 'en' && book.series_id) {
        const ruPair = ruBooks.find(b =>
          b.series_id === book.series_id &&
          b.series_number === book.series_number
        );
        if (ruPair) {
          const uniqueIds = [...new Set(allTagIds)];
          const ruTagRows = uniqueIds.map(tag_id => ({ book_id: ruPair.id, tag_id }));
          await supabase.from('book_tags').upsert(ruTagRows, { onConflict: 'book_id,tag_id' });
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

    await sleep(1500);
  }

  console.log('═══════════════════════════════════════');
  console.log(`✅ Успешно: ${success}`);
  console.log(`❌ Ошибки:  ${failed}`);

  if (failedBooks.length > 0) {
    console.log('\n📋 Не обработаны:');
    failedBooks.forEach(b => console.log(`  - ${b}`));
  }
}

main().catch(console.error);
