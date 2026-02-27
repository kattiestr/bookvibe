import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '../hooks/BooksContext';
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
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [sel, setSel] = useState<string | null>(null);
  const [greeting] = useState(() => getTimeGreeting());

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

      {/* Feature buttons */}
      <div className="flex gap-2 overflow-x-auto pb-3 mt-6 mb-6 scrollbar-hide">
        {[
          {
            path: '/if-you-liked',
            emoji: '💡',
            title: 'If You Liked...',
            sub: 'smart recommendations',
          },
          {
            path: '/quiz',
            emoji: '✨',
            title: 'Vibe Match',
            sub: 'find by mood',
          },
          { path: '/spin', emoji: '🎰', title: 'Spin', sub: 'random pick' },
          {
            path: '/tbr',
            emoji: '📚',
            title: 'TBR Builder',
            sub: 'plan your reads',
          },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: '12px 18px',
              borderRadius: 14,
              border: '1px solid #2a2520',
              background: '#1a1614',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.emoji}</span>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#e2ddd5' }}>
                {item.title}
              </p>
              <p style={{ fontSize: 9, color: muted }}>{item.sub}</p>
            </div>
          </button>
        ))}
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
