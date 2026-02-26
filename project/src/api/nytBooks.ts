const NYT_KEY = 'qj7D4DgGKwYlWCX5a0LYGavAozSn4cqFR6rIaaoVxQAFR7sC';
const G_KEY = 'AIzaSyAsZUAb_woaH5Kj6aT35KM5dt7fW-Foxrg';
const G_URL = 'https://www.googleapis.com/books/v1/volumes';

export interface NYTBook {
  rank: number;
  title: string;
  author: string;
  description: string;
  cover: string;
  isbn: string;
  weeksOnList: number;
  buyLinks: { name: string; url: string }[];
  publisher: string;
  detectedGenre: string;
  sourceList: string;
  publishedDate: string;
}

export interface GenreTab {
  key: string;
  label: string;
  emoji: string;
  books: NYTBook[];
}

const CACHE_KEY = 'trending-v16';
const CACHE_TTL = 1000 * 60 * 60 * 24;

function getCache(): any | null {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('trending-') && k !== CACHE_KEY)
        localStorage.removeItem(k);
    }
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.now() - p.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return p.data;
  } catch {
    return null;
  }
}

function setCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

const GENRE_RULES: Record<string, { pos: string[]; neg: string[] }> = {
  fantasy: {
    pos: [
      'fantasy',
      'magic',
      'magical',
      'dragon',
      'fae',
      'faerie',
      'witch',
      'wizard',
      'sorcery',
      'sorcerer',
      'enchant',
      'spell',
      'elf',
      'elves',
      'prophecy',
      'mythical',
      'supernatural',
      'shapeshifter',
      'demon',
      'angel',
      'vampire',
      'werewolf',
      'shifter',
      'necromancer',
      'mage',
      'warlock',
      'immortal',
      'gods',
      'goddess',
      'curse',
      'cursed',
      'throne',
      'kingdom',
      'realm',
      'quest',
      'beast',
      'paranormal',
      'romantasy',
      'fated mate',
      'alchemy',
      'alchemist',
      'coven',
      'portal',
      'dark fantasy',
      'epic fantasy',
      'urban fantasy',
    ],
    neg: [
      'thriller',
      'mystery',
      'detective',
      'murder investigation',
      'police',
      'fbi',
      'cia',
      'courtroom',
      'legal',
      'true crime',
      'spy',
      'espionage',
      'military',
      'self-help',
      'business',
      'cookbook',
      'biography',
      'children',
      'picture book',
      'middle grade',
      'litrpg',
      'gamelit',
      'science fiction',
      'hard sci-fi',
    ],
  },
  romance: {
    pos: [
      'romance',
      'love story',
      'romantic',
      'love triangle',
      'contemporary romance',
      'romantic comedy',
      'rom-com',
      'friends to lovers',
      'enemies to lovers',
      'fake dating',
      'second chance',
      'small town romance',
      'sports romance',
      'hockey romance',
      'football romance',
      'billionaire',
      'office romance',
      'workplace romance',
      'beach read',
      'meet cute',
      'happily ever after',
      "women's fiction",
      'chick lit',
      'new adult romance',
    ],
    neg: [
      'thriller',
      'mystery',
      'detective',
      'murder',
      'police',
      'fbi',
      'serial killer',
      'crime fiction',
      'horror',
      'spy',
      'self-help',
      'business',
      'cookbook',
      'biography',
      'children',
      'picture book',
      'middle grade',
      'science fiction',
      'dystopian',
    ],
  },
  'dark-romance': {
    pos: [
      'dark romance',
      'mafia romance',
      'mafia',
      'cartel',
      'bully romance',
      'captive',
      'kidnap',
      'possessive',
      'obsession',
      'obsessed',
      'morally grey',
      'morally gray',
      'antihero',
      'anti-hero',
      'forbidden',
      'taboo',
      'stalker',
      'predator',
      'prey',
      'twisted',
      'ruthless',
      'brutal',
      'cruel',
      'dark desire',
      'motorcycle club',
      'mc romance',
      'bratva',
      'arranged marriage mafia',
      'underworld',
      'crime boss',
      'kingpin',
    ],
    neg: [
      'thriller',
      'mystery',
      'detective',
      'police procedural',
      'fbi',
      'forensic',
      'self-help',
      'business',
      'cookbook',
      'biography',
      'children',
      'picture book',
      'middle grade',
      'science fiction',
      'cozy mystery',
    ],
  },
};

function classifyText(text: string): { genre: string | null; score: number } {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [genre, rules] of Object.entries(GENRE_RULES)) {
    let posScore = 0;
    let negScore = 0;
    for (const word of rules.pos) if (lower.includes(word)) posScore++;
    for (const word of rules.neg) if (lower.includes(word)) negScore++;
    if (posScore > 0 && posScore > negScore)
      scores[genre] = posScore - negScore;
  }
  let best: string | null = null;
  let bestScore = 0;
  for (const [genre, score] of Object.entries(scores)) {
    if (score > bestScore) {
      best = genre;
      bestScore = score;
    }
  }
  return { genre: best, score: bestScore };
}

async function googleLookup(
  isbn: string,
  title: string,
  author: string
): Promise<{
  genre: string | null;
  score: number;
  cover: string;
  description: string;
  categories: string[];
  publishedDate: string;
  previewLink: string;
} | null> {
  try {
    const q = isbn
      ? `isbn:${isbn}`
      : `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(
          author.split(',')[0]
        )}`;
    const res = await fetch(`${G_URL}?q=${q}&maxResults=1&key=${G_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.items?.length) return null;
    const info = data.items[0].volumeInfo;
    const cats = (info.categories || []).join(' ');
    const desc = info.description || '';
    const { genre, score } = classifyText(`${cats} ${desc}`);
    const imgs = info.imageLinks || {};
    const cover = (imgs.thumbnail || imgs.smallThumbnail || '')
      .replace('http://', 'https://')
      .replace('zoom=1', 'zoom=2');
    return {
      genre,
      score,
      cover,
      description: desc,
      categories: info.categories || [],
      publishedDate: info.publishedDate || '',
      previewLink: info.previewLink || '',
    };
  } catch {
    return null;
  }
}

async function fetchNYT(list: string): Promise<{ date: string; books: any[] }> {
  try {
    const res = await fetch(
      `https://api.nytimes.com/svc/books/v3/lists/current/${list}.json?api-key=${NYT_KEY}`
    );
    if (!res.ok) return { date: '', books: [] };
    const data = await res.json();
    return {
      date: data.results?.bestsellers_date || '',
      books: data.results?.books || [],
    };
  } catch {
    return { date: '', books: [] };
  }
}

async function supplement(
  genre: string,
  existing: NYTBook[],
  needed: number
): Promise<NYTBook[]> {
  const searches: Record<string, string[]> = {
    fantasy: [
      'romantasy fantasy romance 2024',
      'fantasy romance fae dragon 2025',
      'fantasy romance novel bestseller 2024',
    ],
    romance: [
      'contemporary romance novel 2024 bestseller',
      'romantic comedy novel 2025',
      'small town romance novel 2024',
    ],
    'dark-romance': [
      'dark romance mafia novel 2024',
      'dark romance possessive antihero 2025',
      'dark romance bratva kidnap novel 2024',
    ],
  };

  const keys = new Set(
    existing.map((b) => b.title.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );
  const result: NYTBook[] = [];

  for (const q of searches[genre] || []) {
    if (result.length >= needed) break;
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(
        `${G_URL}?q=${encodeURIComponent(
          q
        )}&maxResults=20&printType=books&langRestrict=en&key=${G_KEY}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.items || []) {
        if (result.length >= needed) break;
        const info = item.volumeInfo;
        if (!info?.title || !info.authors) continue;

        // Must have a cover
        const imgs = info.imageLinks || {};
        const cover = (imgs.thumbnail || imgs.smallThumbnail || '')
          .replace('http://', 'https://')
          .replace('zoom=1', 'zoom=2');
        if (!cover) continue;

        const titleKey = info.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (keys.has(titleKey)) continue;
        if (info.pageCount && info.pageCount < 150) continue;

        const pubDate = info.publishedDate || '';
        if (pubDate) {
          const yr = parseInt(pubDate.substring(0, 4));
          if (!isNaN(yr) && yr < 2021) continue;
        }

        const lt = info.title.toLowerCase();
        if (
          [
            'guide',
            'handbook',
            'summary',
            'how to',
            'workbook',
            'anthology',
            'bundle',
            'box set',
            'boxset',
            'sampler',
            'coloring',
            'checklist',
            'reading list',
          ].some((w) => lt.includes(w))
        )
          continue;

        const cats = (info.categories || []).join(' ');
        const desc = info.description || '';
        const classified = classifyText(`${cats} ${desc} ${info.title}`);

        if (classified.genre !== genre) continue;
        if (classified.score < 1) continue;

        const isbn13 =
          (info.industryIdentifiers || []).find(
            (id: any) => id.type === 'ISBN_13'
          )?.identifier || '';

        keys.add(titleKey);
        result.push({
          rank: 0,
          title: info.title,
          author: (info.authors || ['Unknown']).join(', '),
          description: desc,
          cover,
          isbn: isbn13,
          weeksOnList: 0,
          buyLinks: info.previewLink
            ? [{ name: 'Google Books', url: info.previewLink }]
            : [],
          publisher: info.publisher || '',
          detectedGenre: genre,
          sourceList: 'google',
          publishedDate: pubDate,
        });
        console.log(
          `[Supp] ✅ ${genre}: ${info.title} (score: ${classified.score})`
        );
      }
    } catch {}
  }
  return result;
}

export async function getTrendingByGenre(): Promise<{
  updated: string;
  genres: GenreTab[];
  allBooks: NYTBook[];
}> {
  const cached = getCache();
  if (cached) {
    console.log('[Trending] Using cache');
    return cached;
  }

  console.log('[Trending] Fetching fresh...');
  const lists = await Promise.allSettled([
    fetchNYT('combined-fiction'),
    fetchNYT('hardcover-fiction'),
    fetchNYT('paperback-trade-fiction'),
  ]);

  let nytDate = '';
  const raw: any[] = [];
  for (const r of lists) {
    if (r.status === 'fulfilled') {
      raw.push(...r.value.books);
      if (!nytDate && r.value.date) nytDate = r.value.date;
    }
  }

  const seen = new Set<string>();
  const unique = raw.filter((b) => {
    const k = b.primary_isbn13 || b.title;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  console.log(`[Trending] NYT: ${unique.length} unique books`);

  const genreMap: Record<string, NYTBook[]> = {
    fantasy: [],
    romance: [],
    'dark-romance': [],
  };

  for (const b of unique) {
    const isbn = b.primary_isbn13 || b.primary_isbn10 || '';
    const nytClassify = classifyText(
      `${b.title} ${b.description} ${b.publisher}`
    );
    await new Promise((r) => setTimeout(r, 80));
    const google = await googleLookup(isbn, b.title, b.author);

    // Use Google genre if available, otherwise NYT classify
    const genre = google?.genre || nytClassify.genre;
    const score = google?.score ?? nytClassify.score;

    if (!genre || !genreMap[genre]) {
      console.log(`[Trending] ⏭ ${b.title} → ${genre || 'unknown'}`);
      continue;
    }

    // Use NYT cover as primary fallback if Google has no cover
    const cover = google?.cover || b.book_image || '';
    if (!cover) {
      console.log(`[Trending] ⏭ ${b.title} → no cover`);
      continue;
    }

    const desc =
      google?.description &&
      google.description.length > (b.description || '').length
        ? google.description
        : b.description || '';

    const buyLinks = (b.buy_links || []).map((l: any) => ({
      name: l.name,
      url: l.url,
    }));
    if (google?.previewLink)
      buyLinks.push({ name: 'Google Books', url: google.previewLink });

    genreMap[genre].push({
      rank: b.rank || 0,
      title: b.title,
      author: b.author,
      description: desc,
      cover,
      isbn,
      weeksOnList: b.weeks_on_list || 0,
      buyLinks,
      publisher: b.publisher || '',
      detectedGenre: genre,
      sourceList: 'nyt',
      publishedDate: google?.publishedDate || '',
    });
    console.log(`[Trending] ✅ ${b.title} → ${genre} (score: ${score})`);
  }

  // Supplement each genre to at least 6 books
  for (const genre of Object.keys(genreMap)) {
    if (genreMap[genre].length < 6) {
      console.log(
        `[Trending] ${genre}: only ${genreMap[genre].length}, supplementing...`
      );
      const extra = await supplement(
        genre,
        genreMap[genre],
        8 - genreMap[genre].length
      );
      genreMap[genre].push(...extra);
    }
  }

  const defs = [
    { key: 'fantasy', label: 'Fantasy', emoji: '🐉' },
    { key: 'romance', label: 'Romance', emoji: '💕' },
    { key: 'dark-romance', label: 'Dark Romance', emoji: '🖤' },
  ];

  const tabs: GenreTab[] = [];
  const all: NYTBook[] = [];

  for (const d of defs) {
    const books = genreMap[d.key] || [];
    books.forEach((b, i) => {
      b.rank = i + 1;
    });
    if (books.length > 0) {
      tabs.push({ ...d, books });
      all.push(...books);
    }
    console.log(`[Trending] ${d.emoji} ${d.label}: ${books.length}`);
  }

  all.sort((a, b) => {
    if (a.sourceList === 'nyt' && b.sourceList !== 'nyt') return -1;
    if (a.sourceList !== 'nyt' && b.sourceList === 'nyt') return 1;
    return (b.weeksOnList || 0) - (a.weeksOnList || 0);
  });
  all.forEach((b, i) => {
    b.rank = i + 1;
  });

  tabs.unshift({ key: 'all', label: 'All', emoji: '🔥', books: all });

  let updated = '';
  if (nytDate) {
    const [y, m, d] = nytDate.split('-').map(Number);
    updated = new Date(y, m - 1, d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (!updated)
    updated = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const result = { updated, genres: tabs, allBooks: all };
  console.log(`[Trending] DONE! ${all.length} total`);
  setCache(result);
  return result;
}

export async function getTrendingBooks() {
  const { genres } = await getTrendingByGenre();
  return genres.map((g) => ({
    listName: g.key,
    displayName: g.label,
    updated: '',
    books: g.books,
  }));
}
