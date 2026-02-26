import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksDatabase } from '../api/books';
import type { Book } from '../data/books';
import BookCard from '../components/BookCard';
import { useFavorites } from '../hooks/useFavorites';
import { getTimeGreeting } from '../components/SassyToast';
import { getSupabase } from '../lib/supabaseClient';

const TROPES = [
  'enemies-to-lovers',
  'morally-grey',
  'forced-proximity',
  'grumpy-sunshine',
  'slow-burn',
  'possessive-hero',
  'forbidden-love',
  'fake-dating',
  'only-one-bed',
  'who-did-this-to-you',
  'touch-her-and-die',
  'hidden-identity',
  'royalty',
  'academy',
  'fae',
  'vampires',
  'dark-romance',
  'strong-fmc',
];

const accent = '#c4a07c';
const muted = '#5c5450';
const bg2 = '#1e1a18';

export default function HomePage() {
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [sel, setSel] = useState<string | null>(null);
  const [greeting] = useState(() => getTimeGreeting());
  const [supabaseStatus, setSupabaseStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [supabaseTesting, setSupabaseTesting] = useState(false);

  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseStatus(null);

    const sb = getSupabase();
    const urlPresent = !!import.meta.env.VITE_SUPABASE_URL;
    const keyPresent = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    const envLine = `URL present: ${urlPresent} | KEY present: ${keyPresent}`;

    if (!sb.client) {
      setSupabaseStatus({ ok: false, message: `${envLine}\nENV missing — client not created.` });
      setSupabaseTesting(false);
      return;
    }

    const { data, error } = await sb.client.from('books').select('id').limit(1);
    if (!error) {
      setSupabaseStatus({ ok: true, message: `${envLine}\nConnected. Table "books" exists. Rows: ${data?.length ?? 0}` });
    } else if (error.code === '42P01') {
      setSupabaseStatus({ ok: true, message: `${envLine}\nConnected. Table "books" does not exist yet — that is OK.` });
    } else {
      setSupabaseStatus({ ok: false, message: `${envLine}\nError: ${error.message}` });
    }
    setSupabaseTesting(false);
  };

  const books = sel
    ? booksDatabase.filter((b) => b.tropes.includes(sel as any))
    : booksDatabase;

  const toggle = (book: Book) => {
    isFavorite(book.id) ? removeFavorite(book.id) : addFavorite(book);
  };

  const label = (t: string) => t.split('-').join(' ');

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      {/* Supabase test — TOP of page */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleTestSupabase}
          disabled={supabaseTesting}
          style={{
            padding: '8px 20px',
            borderRadius: 10,
            border: '1px solid #2a2520',
            background: '#1a1614',
            color: accent,
            fontSize: 13,
            fontWeight: 700,
            cursor: supabaseTesting ? 'not-allowed' : 'pointer',
            opacity: supabaseTesting ? 0.6 : 1,
          }}
        >
          {supabaseTesting ? 'Testing...' : 'Test Supabase'}
        </button>
        {supabaseStatus && (
          <div
            style={{
              marginTop: 10,
              padding: '10px 14px',
              borderRadius: 10,
              background: supabaseStatus.ok ? '#1a2a1a' : '#2a1a1a',
              border: `1px solid ${supabaseStatus.ok ? '#2d5a2d' : '#5a2d2d'}`,
              color: supabaseStatus.ok ? '#7ec87e' : '#e07070',
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {supabaseStatus.message}
          </div>
        )}
      </div>

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

      {/* Trope filter */}
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
        {TROPES.map((t) => (
          <button
            key={t}
            onClick={() => setSel(sel === t ? null : t)}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: 'none',
              background: sel === t ? accent : bg2,
              color: sel === t ? '#141010' : muted,
              fontWeight: sel === t ? 700 : 400,
            }}
          >
            {label(t)}
          </button>
        ))}
      </div>

      {/* Book grid - 3 колонки */}
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
            onClick={() => navigate(`/book/${book.id}`)}
          />
        ))}
      </div>

      {books.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
          <p style={{ fontSize: 14, color: muted }}>
            No books found for this trope yet
          </p>
        </div>
      )}
    </div>
  );
}
