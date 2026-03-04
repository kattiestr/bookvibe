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

export default function HomePage() {
  const { books: booksDatabase } = useBooks();
  const { library, getStats } = useLibrary();
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [sel, setSel] = useState<string | null>(null);
  const [greeting] = useState(() => getTimeGreeting());

  // Книги со статусом reading
  const readingBooks = library.filter((b) => b.status === 'reading');

  const books = sel
    ? booksDatabase.filter((b) => {
        const cat = CATEGORIES.find((c) => c.slug === sel);
        if (!cat) return false;
        if (cat.type === 'genre') return b.genres.includes(sel as any);
        return b.tropes.includes(sel as any);
      })
    : booksDatabase;

  const toggle = (book: Book) => {
    isFavorite(book.id) ? removeFavorite(book.id) : addFavorite(book);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 36,
          fontWeight: 700,
          color: '#e2ddd5',
        }}
      >
        BookVibe
      </h1>
      <p style={{ color: muted, fontSize: 13, marginTop: 2 }}>
        find your next obsession
      </p>
      <p
        style={{
          fontSize: 13,
          color: '#8a8480',
          fontStyle: 'italic',
          marginTop: 8,
        }}
      >
        {greeting}
      </p>

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
                  {/* Обложка */}
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

                  {/* Инфо */}
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

                    {/* Прогресс бар */}
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

                    {/* Страницы */}
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
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
