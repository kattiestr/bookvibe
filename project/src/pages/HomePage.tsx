import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../hooks/BooksContext';
import { useLibrary } from '../hooks/LibraryContext';
import type { Book } from '../data/books';
import BookCard from '../components/BookCard';
import { useFavorites } from '../hooks/useFavorites';
import { getTimeGreeting } from '../components/SassyToast';

const CATEGORIES = [
  { slug: 'dark-romance',      label: '🖤 Dark Romance',      type: 'genre' },
  { slug: 'enemies-to-lovers', label: '⚔️ Enemies to Lovers', type: 'trope' },
  { slug: 'vampire-romance',   label: '🧛 Vampires',          type: 'trope' },
  { slug: 'royalty',           label: '👑 Royalty',           type: 'trope' },
  { slug: 'academy',           label: '🎓 Academy',           type: 'trope' },
  { slug: 'werewolf-romance',  label: '🐺 Shifters & Wolves', type: 'trope' },
  { slug: 'morally-grey',      label: '💀 Morally Grey',      type: 'trope' },
  { slug: 'slow-burn',         label: '🔥 Slow Burn',         type: 'trope' },
  { slug: 'mafia-romance',     label: '🗡️ Mafia',            type: 'genre' },
];

const accent = '#c4a07c';
const muted = '#5c5450';
const bg2 = '#1e1a18';

function getMonthlyReads(library: any[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return library
    .filter((b) => {
      // finished — смотрим на dateFinished
      if (b.status === 'finished') {
        if (!b.dateFinished) return false;
        const d = new Date(b.dateFinished);
        return d.getMonth() === month && d.getFullYear() === year;
      }
      // read-before — смотрим на dateReadBefore
      if (b.status === 'read-before') {
        if (!b.dateReadBefore) return false;
        const [y, m] = b.dateReadBefore.split('-').map(Number);
        return m - 1 === month && y === year;
      }
      return false;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
}

function getRatingLabel(rating: number): { label: string; color: string } {
  if (rating >= 8) return { label: '✅ Love it',    color: '#6b9e7a' };
  if (rating >= 5) return { label: '🤷 It was ok',  color: '#c9a84c' };
  if (rating > 0)  return { label: '❌ Not for me', color: '#b05050' };
  return { label: '— No rating', color: '#5c5450' };
}

function MonthlyReadsWidget({
  monthlyReads,
  navigate,
}: {
  monthlyReads: any[];
  navigate: (path: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const medals = ['🥇', '🥈', '🥉'];
  const visible = showAll ? monthlyReads : monthlyReads.slice(0, 3);

  return (
    <div style={{
      marginTop: 24,
      padding: '16px',
      borderRadius: '16px',
      background: bg2,
      border: '1px solid #2a2520',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <p style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: muted,
        }}>
          📚 This Month's Reads
        </p>
        <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
          {monthlyReads.length} book{monthlyReads.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map((book, i) => {
          const { label, color } = getRatingLabel(book.rating || 0);
          return (
            <div
              key={book.bookId}
              onClick={() => navigate(`/library/${book.bookId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '10px',
                background: i < 3 ? 'rgba(196,160,124,0.04)' : 'transparent',
              }}
            >
              <span style={{
                fontSize: i < 3 ? 18 : 13,
                flexShrink: 0,
                width: 32,
                textAlign: 'center',
                color: i >= 3 ? muted : undefined,
              }}>
                {i < 3 ? medals[i] : `${i + 1}.`}
              </span>
              <img
                src={book.cover}
                alt={book.title}
                style={{
                  width: 36,
                  height: 52,
                  objectFit: 'cover',
                  borderRadius: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e2ddd5',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {book.title}
                </p>
                <p style={{ fontSize: 10, color: muted }}>{book.author}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {book.rating > 0 && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#c9a84c' }}>
                    {book.rating}/10
                  </p>
                )}
                <p style={{ fontSize: 9, color, fontWeight: 600 }}>{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {monthlyReads.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '8px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: '#2a2520',
            color: muted,
            fontSize: 11,
          }}
        >
          {showAll ? '▲ Show less' : `▼ +${monthlyReads.length - 3} more books`}
        </button>
      )}
    </div>
  );
}

export default function HomePage() {
  const { books: booksDatabase } = useBooks();
  const { library, getStats } = useLibrary();
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [sel, setSel] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'ru'>('en'); // 👈 добавила
  const [greeting] = useState(() => getTimeGreeting());

  const readingBooks = library.filter((b) => b.status === 'reading');
  const monthlyReads = getMonthlyReads(library);

  // 👈 изменила фильтрацию — добавила язык
  const books = booksDatabase
    .filter((b) => b.language === lang)
    .filter((b) => {
      if (!sel) return true;
      const cat = CATEGORIES.find((c) => c.slug === sel);
      if (!cat) return false;
      if (cat.type === 'genre') return b.genres.includes(sel as any);
      return b.tropes.includes(sel as any);
    });

  const toggle = (book: Book) => {
    isFavorite(book.id) ? removeFavorite(book.id) : addFavorite(book);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: 36,
        fontWeight: 700,
        color: '#e2ddd5',
      }}>
        BookVibe
      </h1>
      <p style={{ color: muted, fontSize: 13, marginTop: 2 }}>
        find your next obsession
      </p>
      <p style={{ fontSize: 13, color: '#8a8480', fontStyle: 'italic', marginTop: 8 }}>
        {greeting}
      </p>

      {/* This Month's Reads */}
      {monthlyReads.length > 0 && (
        <MonthlyReadsWidget monthlyReads={monthlyReads} navigate={navigate} />
      )}

      {/* Continue Reading */}
      {readingBooks.length > 0 && (
        <div style={{ marginTop: 28, marginBottom: 28 }}>
          <p style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: muted,
            marginBottom: 12,
          }}>
            Continue Reading
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {readingBooks.map((book) => {
              const stats = getStats(book.bookId);
              const progress = stats?.progress ?? 0;
              const pagesLeft = stats?.pagesLeft ?? (book.totalPages - book.currentPage);

              return (
                <button
                  key={book.bookId}
                  onClick={() => navigate(`/library/${book.bookId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: bg2,
                    border: '1px solid rgba(255,255,255,0.05)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {book.cover ? (
                    <img
                      src={book.cover}
                      alt={book.title}
                      style={{
                        width: 48,
                        height: 68,
                        objectFit: 'cover',
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 48,
                      height: 68,
                      borderRadius: 6,
                      background: '#2a2520',
                      flexShrink: 0,
                    }} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#e2ddd5',
                      marginBottom: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {book.title}
                    </p>
                    <p style={{ fontSize: 12, color: muted, marginBottom: 10 }}>
                      {book.author}
                    </p>

                    <div style={{
                      height: 4,
                      borderRadius: 2,
                      background: '#2a2520',
                      marginBottom: 6,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${progress}%`,
                        borderRadius: 2,
                        background: accent,
                        transition: 'width 0.3s ease',
                      }} />
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <p style={{ fontSize: 11, color: muted }}>
                        page {book.currentPage} of {book.totalPages}
                      </p>
                      <span style={{
                        fontSize: 11,
                        color: '#4caf82',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        ▶ {pagesLeft} pages left
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Language toggle 👈 добавила */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
      }}>
        <button
          onClick={() => setLang('en')}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            cursor: 'pointer',
            border: 'none',
            background: lang === 'en' ? accent : bg2,
            color: lang === 'en' ? '#141010' : muted,
            fontWeight: lang === 'en' ? 700 : 400,
          }}
        >
          🇬🇧 EN
        </button>
        <button
          onClick={() => setLang('ru')}
          style={{
            padding: '6px 16px',
            borderRadius: 20,
            fontSize: 13,
            cursor: 'pointer',
            border: 'none',
            background: lang === 'ru' ? accent : bg2,
            color: lang === 'ru' ? '#141010' : muted,
            fontWeight: lang === 'ru' ? 700 : 400,
          }}
        >
          🇷🇺 RU
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button
          onClick={() => setSel(null)}
          style={{
            padding: '8px 20px',
            borderRadius: 20,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            border: 'none',
            background: !sel ? accent : bg2,
            color: !sel ? '#141010' : muted,
            fontWeight: !sel ? 700 : 400,
          }}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSel(sel === cat.slug ? null : cat.slug)}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: 'none',
              background: sel === cat.slug ? accent : bg2,
              color: sel === cat.slug ? '#141010' : muted,
              fontWeight: sel === cat.slug ? 700 : 400,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Book grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            isFavorite={isFavorite(book.id)}
            onToggleFavorite={() => toggle(book)}
          />
        ))}
      </div>

      {books.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 14, color: muted }}>
            No books found for this category yet
          </p>
        </div>
      )}
    </div>
  );
}
