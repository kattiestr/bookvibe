import { useState } from 'react';
import { booksDatabase } from '../api/books';
import type { Book } from '../data/books';
import BookCard from '../components/BookCard';
import { useFavorites } from '../hooks/useFavorites';

const accent = '#c4a07c';
const muted = '#5c5450';

interface Phase {
  id: string;
  name: string;
  emoji: string;
  days: string;
  description: string;
  moods: string[];
  genres: string[];
  tropes: string[];
  spiceMin: number;
  spiceMax: number;
}

const PHASES: Phase[] = [
  {
    id: 'menstrual',
    name: 'Menstrual',
    emoji: '🌙',
    days: 'Days 1–5',
    description:
      'You need comfort, warmth, and maybe a good cry. Books that feel like a hug.',
    moods: ['emotional', 'heartbreaking', 'cozy', 'fluffy'],
    genres: [
      'contemporary-romance',
      'rom-com',
      'literary-fiction',
      'young-adult',
    ],
    tropes: [
      'friends-to-lovers',
      'childhood-friends',
      'second-chance',
      'slow-burn',
      'found-family',
    ],
    spiceMin: 0,
    spiceMax: 3,
  },
  {
    id: 'follicular',
    name: 'Follicular',
    emoji: '🌱',
    days: 'Days 6–13',
    description:
      'Energy is rising! Time for fun, light reads and new adventures.',
    moods: ['funny', 'fluffy', 'adventurous', 'cozy', 'empowering'],
    genres: [
      'rom-com',
      'contemporary-romance',
      'fantasy-romance',
      'sports-romance',
    ],
    tropes: [
      'grumpy-sunshine',
      'fake-dating',
      'enemies-to-lovers',
      'he-falls-first',
      'rivals',
    ],
    spiceMin: 1,
    spiceMax: 4,
  },
  {
    id: 'ovulation',
    name: 'Ovulation',
    emoji: '🔥',
    days: 'Days 14–17',
    description:
      'Confidence is peaking. Bring on strong heroines, tension, and HEAT.',
    moods: ['steamy', 'intense', 'funny', 'empowering'],
    genres: [
      'contemporary-romance',
      'sports-romance',
      'dark-romance',
      'new-adult',
      'mafia-romance',
    ],
    tropes: [
      'enemies-to-lovers',
      'possessive-hero',
      'forced-proximity',
      'fake-dating',
      'he-falls-first',
      'only-one-bed',
    ],
    spiceMin: 3,
    spiceMax: 5,
  },
  {
    id: 'luteal',
    name: 'Luteal',
    emoji: '🖤',
    days: 'Days 18–28',
    description:
      'Everything is too much. Give me dark, angsty, morally grey chaos.',
    moods: ['dark', 'angsty', 'intense', 'mysterious', 'heartbreaking'],
    genres: [
      'dark-romance',
      'romantasy',
      'fantasy-romance',
      'mafia-romance',
      'bully-romance',
      'romantic-suspense',
      'thriller',
    ],
    tropes: [
      'morally-grey',
      'villain-romance',
      'possessive-hero',
      'revenge',
      'enemies-to-lovers',
      'forbidden-love',
      'touch-her-and-die',
    ],
    spiceMin: 2,
    spiceMax: 5,
  },
];

function getPhaseBooks(phase: Phase, allBooks: Book[]): Book[] {
  return allBooks
    .map((book) => {
      let score = 0;

      // Mood matching
      for (const mood of phase.moods) {
        if (book.mood.some((m) => m.toLowerCase() === mood)) score += 3;
      }

      // Genre matching
      for (const genre of phase.genres) {
        if (book.genres.some((g) => g === genre)) score += 2;
      }

      // Trope matching
      for (const trope of phase.tropes) {
        if (book.tropes.some((t) => t === trope)) score += 2;
      }

      // Spice range bonus
      if (book.spice >= phase.spiceMin && book.spice <= phase.spiceMax) {
        score += 2;
      }

      return { book, score };
    })
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((item) => item.book);
}

export default function CyclePage() {
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const toggle = (book: Book) => {
    isFavorite(book.id) ? removeFavorite(book.id) : addFavorite(book);
  };

  const phaseBooks = selectedPhase
    ? getPhaseBooks(selectedPhase, booksDatabase)
    : [];

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: 700,
          color: '#e2ddd5',
        }}
      >
        Cycle Mode
      </h1>
      <p
        style={{
          color: muted,
          fontSize: '13px',
          marginTop: '4px',
          marginBottom: '24px',
        }}
      >
        books matched to your body's rhythm
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {PHASES.map((phase) => {
          const isSelected = selectedPhase?.id === phase.id;
          return (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(isSelected ? null : phase)}
              style={{
                padding: '20px 16px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.3s',
                background: isSelected ? '#1e1a18' : '#1a1614',
                boxShadow: isSelected
                  ? `0 0 0 1px ${accent}, 0 4px 20px rgba(0,0,0,0.3)`
                  : '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <span style={{ fontSize: '28px' }}>{phase.emoji}</span>
              <h3
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: isSelected ? accent : '#e2ddd5',
                  marginTop: '8px',
                }}
              >
                {phase.name}
              </h3>
              <p style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>
                {phase.days}
              </p>
            </button>
          );
        })}
      </div>

      {selectedPhase && (
        <div>
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: '#1a1614',
              marginBottom: '24px',
              borderLeft: `3px solid ${accent}`,
            }}
          >
            <p
              style={{
                fontSize: '14px',
                color: '#e2ddd5',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              {selectedPhase.description}
            </p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div
              style={{
                height: '1px',
                flex: 1,
                background:
                  'linear-gradient(to right, transparent, #2a2220, transparent)',
              }}
            />
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '12px',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              your {selectedPhase.name} reads
            </h2>
            <div
              style={{
                height: '1px',
                flex: 1,
                background:
                  'linear-gradient(to right, transparent, #2a2220, transparent)',
              }}
            />
          </div>

          {phaseBooks.length > 0 ? (
            <>
              <p
                style={{ color: muted, fontSize: '12px', marginBottom: '16px' }}
              >
                {phaseBooks.length} books matched
              </p>
              <div className="grid grid-cols-3 gap-4">
                {phaseBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    isFavorite={isFavorite(book.id)}
                    onToggleFavorite={() => toggle(book)}
                  />
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: muted, textAlign: 'center', padding: '40px 0' }}>
              no matches found
            </p>
          )}
        </div>
      )}

      {!selectedPhase && (
        <p
          style={{
            color: muted,
            textAlign: 'center',
            fontSize: '13px',
            marginTop: '20px',
          }}
        >
          select your current phase ☝️
        </p>
      )}
    </div>
  );
}
