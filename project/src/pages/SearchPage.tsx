import { useState, useMemo } from 'react';
import { useBooks } from '../hooks/BooksContext';
import { searchBooksLocal } from '../api/books';
import type { Book } from '../data/books';
import BookCard from '../components/BookCard';
import { useFavorites } from '../hooks/useFavorites';
import { Search, X, SlidersHorizontal } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';
const bg2 = '#1e1a18';

const GENRES = [
  { slug: 'dark-romance',        label: '🖤 Dark Romance' },
  { slug: 'fantasy-romance',     label: '✨ Fantasy Romance' },
  { slug: 'romantasy',           label: '🐉 Romantasy' },
  { slug: 'contemporary-romance',label: '💬 Contemporary' },
  { slug: 'paranormal-romance',  label: '👻 Paranormal' },
  { slug: 'historical-romance',  label: '🕯️ Historical' },
  { slug: 'mafia-romance',       label: '🗡️ Mafia' },
  { slug: 'sports-romance',      label: '🏆 Sports' },
  { slug: 'rom-com',             label: '😂 Rom-Com' },
  { slug: 'romantic-suspense',   label: '🔍 Suspense' },
  { slug: 'new-adult',           label: '🎓 New Adult' },
  { slug: 'young-adult',         label: '🌙 Young Adult' },
];

const TROPES = [
  { slug: 'enemies-to-lovers',    label: '⚔️ Enemies to Lovers' },
  { slug: 'slow-burn',            label: '🔥 Slow Burn' },
  { slug: 'forced-proximity',     label: '🔒 Forced Proximity' },
  { slug: 'fake-dating',          label: '💍 Fake Dating' },
  { slug: 'second-chance',        label: '💔 Second Chance' },
  { slug: 'forbidden-love',       label: '🚫 Forbidden Love' },
  { slug: 'grumpy-sunshine',      label: '☀️ Grumpy x Sunshine' },
  { slug: 'only-one-bed',         label: '🛏️ Only One Bed' },
  { slug: 'love-triangle',        label: '🔺 Love Triangle' },
  { slug: 'arranged-marriage',    label: '📜 Arranged Marriage' },
  { slug: 'morally-grey',         label: '💀 Morally Grey' },
  { slug: 'possessive-hero',      label: '😈 Possessive Hero' },
  { slug: 'age-gap',              label: '⏳ Age Gap' },
  { slug: 'brother-best-friend',  label: '🤝 Brother\'s Best Friend' },
  { slug: 'fated-mates',          label: '🔮 Fated Mates' },
  { slug: 'chosen-one',           label: '⭐ Chosen One' },
  { slug: 'reverse-harem',        label: '👥 Reverse Harem' },
  { slug: 'vampire-romance',      label: '🧛 Vampires' },
  { slug: 'werewolf-romance',     label: '🐺 Werewolves' },
  { slug: 'royalty',              label: '👑 Royalty' },
  { slug: 'billionaire',          label: '💰 Billionaire' },
  { slug: 'boss-employee',        label: '🏢 Boss x Employee' },
  { slug: 'found-family',         label: '🏠 Found Family' },
  { slug: 'hurt-comfort',         label: '🩹 Hurt/Comfort' },
  { slug: 'he-falls-first',       label: '💘 He Falls First' },
  { slug: 'pining',               label: '🥺 Pining' },
  { slug: 'redemption-arc',       label: '✨ Redemption Arc' },
  { slug: 'touch-her-and-die',    label: '🔪 Touch Her and Die' },
  { slug: 'marriage-of-convenience', label: '💼 Marriage of Convenience' },
  { slug: 'bodyguard',            label: '🛡️ Bodyguard' },
];

const MOODS = [
  { slug: 'dark',         label: '🖤 Dark' },
  { slug: 'angsty',       label: '😭 Angsty' },
  { slug: 'fluffy',       label: '🌸 Fluffy' },
  { slug: 'steamy',       label: '🔥 Steamy' },
  { slug: 'emotional',    label: '💧 Emotional' },
  { slug: 'adventurous',  label: '⚔️ Adventurous' },
  { slug: 'funny',        label: '😂 Funny' },
  { slug: 'intense',      label: '⚡ Intense' },
  { slug: 'cozy',         label: '☕ Cozy' },
  { slug: 'heartbreaking',label: '💔 Heartbreaking' },
  { slug: 'empowering',   label: '💪 Empowering' },
  { slug: 'mysterious',   label: '🔮 Mysterious' },
];

type FilterSection = 'genres' | 'tropes' | 'mood' | null;

export default function SearchPage() {
  const { books: booksDatabase } = useBooks();
  const [query, setQuery] = useState('');
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const [showFilters, setShowFilters] = useState(false);
  const [openSection, setOpenSection] = useState<FilterSection>('tropes');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedTropes, setSelectedTropes] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  const totalSelected = selectedGenres.length + selectedTropes.length + selectedMoods.length;

  const toggleItem = (slug: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug]);
  };

  const clearAll = () => {
    setSelectedGenres([]);
    setSelectedTropes([]);
    setSelectedMoods([]);
  };

  const results = useMemo(() => {
    let books = booksDatabase;

    // Текстовый поиск
    if (query.trim()) {
      books = searchBooksLocal(query.trim(), books);
    }

    // Фильтр по жанрам
    if (selectedGenres.length > 0) {
      books = books.filter(b => selectedGenres.every(g => b.genres?.includes(g as any)));
    }

    // Фильтр по тропам
    if (selectedTropes.length > 0) {
      books = books.filter(b => selectedTropes.every(t => b.tropes?.includes(t as any)));
    }

    // Фильтр по настроению
    if (selectedMoods.length > 0) {
      books = books.filter(b => selectedMoods.some(m => b.mood?.includes(m as any)));
    }

    return books;
  }, [query, booksDatabase, selectedGenres, selectedTropes, selectedMoods]);

  const showResults = query.trim() || totalSelected > 0;

  const toggleFavorite = (book: Book) => {
    isFavorite(book.id) ? removeFavorite(book.id) : addFavorite(book);
  };

  const renderChips = (
    items: { slug: string; label: string }[],
    selected: string[],
    setSelected: (v: string[]) => void
  ) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px 0' }}>
      {items.map(item => {
        const active = selected.includes(item.slug);
        return (
          <button
            key={item.slug}
            onClick={() => toggleItem(item.slug, selected, setSelected)}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              border: active ? 'none' : '1px solid #2a2520',
              background: active ? accent : 'transparent',
              color: active ? '#141010' : muted,
              fontWeight: active ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  const renderSection = (
    title: string,
    key: FilterSection,
    items: { slug: string; label: string }[],
    selected: string[],
    setSelected: (v: string[]) => void
  ) => (
    <div style={{ borderBottom: '1px solid #2a2520' }}>
      <button
        onClick={() => setOpenSection(openSection === key ? null : key)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#e2ddd5',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <span>{title} {selected.length > 0 && <span style={{ color: accent, fontSize: '11px' }}>· {selected.length} selected</span>}</span>
        <span style={{ color: muted, fontSize: '11px' }}>{openSection === key ? '▲' : '▼'}</span>
      </button>
      {openSection === key && renderChips(items, selected, setSelected)}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-3xl font-serif font-bold text-light mb-6">Search</h1>

      {/* Строка поиска + кнопка фильтров */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: muted }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="books, authors, tropes..."
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-surface border border-border text-light placeholder-muted focus:border-cream/30 focus:outline-none transition-all text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted }}>
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '0 16px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            background: totalSelected > 0 ? accent : bg2,
            color: totalSelected > 0 ? '#141010' : muted,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: totalSelected > 0 ? 700 : 400,
            flexShrink: 0,
          }}
        >
          <SlidersHorizontal size={15} />
          {totalSelected > 0 ? totalSelected : 'Filter'}
        </button>
      </div>

      {/* Активные фильтры — чипы */}
      {totalSelected > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
          {[...selectedGenres, ...selectedTropes, ...selectedMoods].map(slug => {
            const all = [...GENRES, ...TROPES, ...MOODS];
            const item = all.find(i => i.slug === slug);
            return (
              <span
                key={slug}
                style={{
                  padding: '5px 10px',
                  borderRadius: '16px',
                  background: 'rgba(196,160,124,0.15)',
                  color: accent,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {item?.label || slug}
                <button
                  onClick={() => {
                    if (selectedGenres.includes(slug)) setSelectedGenres(selectedGenres.filter(s => s !== slug));
                    if (selectedTropes.includes(slug)) setSelectedTropes(selectedTropes.filter(s => s !== slug));
                    if (selectedMoods.includes(slug)) setSelectedMoods(selectedMoods.filter(s => s !== slug));
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, padding: 0, lineHeight: 1 }}
                >
                  ✕
                </button>
              </span>
            );
          })}
          <button onClick={clearAll} style={{ fontSize: '11px', color: muted, background: 'none', border: 'none', cursor: 'pointer' }}>
            clear all
          </button>
        </div>
      )}

      {/* Панель фильтров */}
      {showFilters && (
        <div style={{ background: bg2, borderRadius: '16px', padding: '0 16px', marginBottom: '20px', border: '1px solid #2a2520' }}>
          {renderSection('🎭 Genres', 'genres', GENRES, selectedGenres, setSelectedGenres)}
          {renderSection('🏷️ Tropes', 'tropes', TROPES, selectedTropes, setSelectedTropes)}
          {renderSection('💭 Mood', 'mood', MOODS, selectedMoods, setSelectedMoods)}

          <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowFilters(false)}
              style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: accent, color: '#141010', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Show {results.length} books
            </button>
          </div>
        </div>
      )}

      {/* Результаты */}
      {showResults && results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {results.map((book) => (
            <BookCard key={book.id} book={book} isFavorite={isFavorite(book.id)} onToggleFavorite={() => toggleFavorite(book)} />
          ))}
        </div>
      )}

      {showResults && results.length === 0 && (
        <div className="text-center py-20">
          <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
          <p className="text-muted text-sm">nothing found</p>
          <p className="text-border text-xs mt-1">try different filters</p>
        </div>
      )}

      {/* Подсказки когда нет поиска и нет фильтров */}
      {!showResults && !showFilters && (
        <div>
          <p style={{ fontSize: '11px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
            Popular searches
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['enemies to lovers', 'dark romance', 'slow burn', 'Sarah J. Maas', 'Colleen Hoover', 'fantasy romance', 'morally grey', 'fated mates'].map(tag => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-4 py-2 rounded-full bg-transparent border border-border text-xs text-muted hover:text-light hover:border-muted transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
