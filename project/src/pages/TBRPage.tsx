import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksDatabase } from '../data/books';
import { useLibrary } from '../hooks/LibraryContext';
import BookCover from '../components/BookCover';
import { Shuffle, Plus, X, Sparkles, ArrowLeft, Trash2 } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

type Period = 'week' | 'month';
type PickMode = 'full-random' | 'prompts' | 'manual';

interface TBRBook {
  bookId: string;
  prompt?: string;
}

interface SavedTBR {
  id: string;
  period: Period;
  books: TBRBook[];
  createdAt: number;
}

function getSavedTBRs(): SavedTBR[] {
  try {
    return JSON.parse(localStorage.getItem('tbr-lists') || '[]');
  } catch {
    return [];
  }
}

function saveTBRsToStorage(tbrs: SavedTBR[]) {
  localStorage.setItem('tbr-lists', JSON.stringify(tbrs));
}

export function getActiveTBR(): SavedTBR | null {
  const all = getSavedTBRs();
  return all.length > 0 ? all[0] : null;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const PROMPTS = [
  {
    emoji: '🐉',
    text: 'A fantasy book',
    filter: (b: any) =>
      b.tropes?.some(
        (t: string) =>
          t.includes('magic') || t.includes('fae') || t.includes('dragon')
      ) || b.mood?.includes('dark'),
  },
  {
    emoji: '💕',
    text: 'A romance',
    filter: (b: any) =>
      b.spice > 0 ||
      b.tropes?.some(
        (t: string) =>
          t.includes('love') ||
          t.includes('romance') ||
          t.includes('slow-burn') ||
          t.includes('enemies-to-lovers')
      ),
  },
  {
    emoji: '🌶️',
    text: 'Something spicy (3+)',
    filter: (b: any) => b.spice >= 3,
  },
  {
    emoji: '😊',
    text: 'Something light',
    filter: (b: any) =>
      b.mood?.includes('light') ||
      b.mood?.includes('funny') ||
      b.mood?.includes('fluffy'),
  },
  {
    emoji: '😈',
    text: 'A dark read',
    filter: (b: any) =>
      b.mood?.includes('dark') ||
      b.mood?.includes('intense') ||
      b.mood?.includes('twisted'),
  },
  { emoji: '📖', text: 'A standalone', filter: (b: any) => !b.series },
  { emoji: '📚', text: 'A series book', filter: (b: any) => !!b.series },
  {
    emoji: '🔥',
    text: 'Under 300 pages',
    filter: (b: any) => b.pages && b.pages < 300,
  },
  {
    emoji: '📕',
    text: 'Over 400 pages',
    filter: (b: any) => b.pages && b.pages > 400,
  },
  {
    emoji: '🎭',
    text: 'Enemies to lovers',
    filter: (b: any) => b.tropes?.includes('enemies-to-lovers'),
  },
  {
    emoji: '🥺',
    text: 'Friends to lovers',
    filter: (b: any) => b.tropes?.includes('friends-to-lovers'),
  },
  {
    emoji: '💔',
    text: 'Something emotional',
    filter: (b: any) =>
      b.mood?.includes('emotional') ||
      b.mood?.includes('heartbreaking') ||
      b.mood?.includes('angsty'),
  },
  { emoji: '🎲', text: 'Total wildcard!', filter: () => true },
];

export default function TBRPage() {
  const navigate = useNavigate();
  const { library } = useLibrary();
  const [period, setPeriod] = useState<Period>('week');
  const [mode, setMode] = useState<PickMode | null>(null);
  const [bookCount, setBookCount] = useState(3);
  const [currentTBR, setCurrentTBR] = useState<TBRBook[]>([]);
  const [savedTBRs, setSavedTBRs] = useState<SavedTBR[]>(() => getSavedTBRs());
  const [mixGenres, setMixGenres] = useState(true);

  const [currentPrompt, setCurrentPrompt] = useState<
    (typeof PROMPTS)[0] | null
  >(null);
  const [showPromptResult, setShowPromptResult] = useState(false);
  const [promptBook, setPromptBook] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [usedPromptIndices, setUsedPromptIndices] = useState<Set<number>>(
    new Set()
  );

  // === ELIGIBLE BOOKS ===
  // Only want-to-read and on-hold from library
  const eligibleLibraryBooks = library.filter(
    (b) => b.status === 'want-to-read' || b.status === 'on-hold'
  );

  // Books NOT YET finished that are in the LATEST saved TBR — skip those
  // (so you don't get the same unread book in a new TBR)
  // BUT if a book from old TBR is finished/read-before, it's already filtered out above
  const latestTBR = savedTBRs.length > 0 ? savedTBRs[0] : null;
  const latestTBRUnreadIds = new Set<string>();
  if (latestTBR) {
    latestTBR.books.forEach((b) => {
      const libBook = library.find((lb) => lb.bookId === b.bookId);
      // Only skip if book is still unread (not finished yet)
      if (
        libBook &&
        libBook.status !== 'finished' &&
        libBook.status !== 'read-before'
      ) {
        latestTBRUnreadIds.add(b.bookId);
      }
    });
  }

  // Series logic: only next unread book
  const getEligibleBooks = () => {
    const eligible: any[] = [];
    const seriesSeen = new Set<string>();

    for (const libBook of eligibleLibraryBooks) {
      const dbBook = booksDatabase.find((b) => b.id === libBook.bookId);
      if (!dbBook) continue;

      // Skip books still unread in latest TBR
      if (latestTBRUnreadIds.has(libBook.bookId)) continue;

      if (dbBook.series) {
        if (seriesSeen.has(dbBook.series)) continue;
        seriesSeen.add(dbBook.series);

        const seriesBooksInLib = library
          .filter((lb) => {
            const db = booksDatabase.find((b) => b.id === lb.bookId);
            return db && db.series === dbBook.series;
          })
          .map((lb) => ({
            lib: lb,
            db: booksDatabase.find((b) => b.id === lb.bookId)!,
          }))
          .sort((a, b) => (a.db.seriesNumber || 0) - (b.db.seriesNumber || 0));

        let nextBook = null;
        for (const item of seriesBooksInLib) {
          const isRead =
            item.lib.status === 'finished' ||
            item.lib.status === 'read-before' ||
            item.lib.status === 'reading';
          if (!isRead) {
            nextBook = item;
            break;
          }
        }

        if (
          nextBook &&
          (nextBook.lib.status === 'want-to-read' ||
            nextBook.lib.status === 'on-hold') &&
          !latestTBRUnreadIds.has(nextBook.db.id)
        ) {
          eligible.push({ ...nextBook.db, _libStatus: nextBook.lib.status });
        }
      } else {
        eligible.push({ ...dbBook, _libStatus: libBook.status });
      }
    }

    return eligible;
  };

  const availableBooks = getEligibleBooks();
  const alreadyPickedIds = currentTBR.map((t) => t.bookId);
  const pickableBooks = availableBooks.filter(
    (b) => !alreadyPickedIds.includes(b.id)
  );

  // Full random
  const doFullRandom = () => {
    const available = [...pickableBooks];
    if (available.length === 0) return;

    let picked: TBRBook[] = [];

    if (mixGenres) {
      const categories = [
        available.filter((b) => b.mood?.includes('dark')),
        available.filter(
          (b) => b.mood?.includes('light') || b.mood?.includes('funny')
        ),
        available.filter((b) => b.spice >= 3),
        available.filter((b) => !b.series),
        available.filter((b) => !!b.series),
      ].filter((c) => c.length > 0);

      const usedIds = new Set<string>();
      for (let i = 0; i < Math.min(bookCount, available.length); i++) {
        if (categories.length > 0) {
          const cat = categories[i % categories.length];
          const options = cat.filter((b) => !usedIds.has(b.id));
          if (options.length > 0) {
            const book = randomFrom(options);
            usedIds.add(book.id);
            picked.push({ bookId: book.id, prompt: 'Random pick' });
            continue;
          }
        }
        const options = available.filter((b) => !usedIds.has(b.id));
        if (options.length > 0) {
          const book = randomFrom(options);
          usedIds.add(book.id);
          picked.push({ bookId: book.id, prompt: 'Random pick' });
        }
      }
    } else {
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      picked = shuffled
        .slice(0, bookCount)
        .map((b) => ({ bookId: b.id, prompt: 'Random pick' }));
    }

    setCurrentTBR(picked);
  };

  const drawPrompt = () => {
    setIsDrawing(true);
    setShowPromptResult(false);

    const availableIndices = PROMPTS.map((_, i) => i).filter(
      (i) => !usedPromptIndices.has(i)
    );
    if (availableIndices.length === 0) {
      setUsedPromptIndices(new Set());
      setIsDrawing(false);
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      const idx =
        availableIndices[Math.floor(Math.random() * availableIndices.length)];
      setCurrentPrompt(PROMPTS[idx]);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalIdx =
          availableIndices[Math.floor(Math.random() * availableIndices.length)];
        const prompt = PROMPTS[finalIdx];
        setCurrentPrompt(prompt);
        setUsedPromptIndices((prev) => new Set([...prev, finalIdx]));
        const matching = pickableBooks.filter((b) => prompt.filter(b));
        setPromptBook(matching.length > 0 ? randomFrom(matching) : null);
        setIsDrawing(false);
        setShowPromptResult(true);
      }
    }, 100);
  };

  const acceptPromptBook = () => {
    if (promptBook) {
      setCurrentTBR((prev) => [
        ...prev,
        { bookId: promptBook.id, prompt: currentPrompt?.text },
      ]);
    }
    setShowPromptResult(false);
    setCurrentPrompt(null);
    setPromptBook(null);
  };

  const rerollPromptBook = () => {
    if (!currentPrompt) return;
    const matching = pickableBooks.filter(
      (b) => b.id !== promptBook?.id && currentPrompt.filter(b)
    );
    if (matching.length > 0) setPromptBook(randomFrom(matching));
  };

  const removeFromTBR = (bookId: string) => {
    setCurrentTBR((prev) => prev.filter((b) => b.bookId !== bookId));
  };

  const saveTBR = () => {
    if (currentTBR.length === 0) return;
    const newTBR: SavedTBR = {
      id: Date.now().toString(),
      period,
      books: currentTBR,
      createdAt: Date.now(),
    };
    const updated = [newTBR, ...savedTBRs];
    setSavedTBRs(updated);
    saveTBRsToStorage(updated);
    setCurrentTBR([]);
    setMode(null);
    setUsedPromptIndices(new Set());
  };

  const deleteSavedTBR = (id: string) => {
    const updated = savedTBRs.filter((t) => t.id !== id);
    setSavedTBRs(updated);
    saveTBRsToStorage(updated);
  };

  const getDbBook = (id: string) => booksDatabase.find((b) => b.id === id);

  const resetBuilder = () => {
    setCurrentTBR([]);
    setMode(null);
    setUsedPromptIndices(new Set());
    setShowPromptResult(false);
    setCurrentPrompt(null);
    setPromptBook(null);
  };

  // Total eligible (including those in saved TBRs — for display)
  const totalEligible = eligibleLibraryBooks.length;

  // Empty state — no books at all in library
  if (totalEligible === 0 && savedTBRs.length === 0) {
    return (
      <div
        className="max-w-lg mx-auto px-4 pt-8 pb-28"
        style={{ textAlign: 'center' }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            color: muted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <p style={{ fontSize: '48px', marginBottom: '12px' }}>📚</p>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#e2ddd5',
            marginBottom: '8px',
          }}
        >
          No books to pick from
        </h1>
        <p
          style={{
            fontSize: '13px',
            color: muted,
            lineHeight: 1.6,
            marginBottom: '20px',
          }}
        >
          Add books to your library with status "Want to Read" first, then come
          back to build your TBR!
        </p>
        <button
          onClick={() => navigate('/search')}
          style={{
            padding: '12px 28px',
            borderRadius: '24px',
            border: 'none',
            cursor: 'pointer',
            background: accent,
            color: '#141010',
            fontWeight: 600,
          }}
        >
          Browse Books
        </button>
      </div>
    );
  }

  // Max books user can pick
  const maxPickable = Math.max(1, availableBooks.length);

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '4px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            color: muted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            fontWeight: 700,
            color: '#e2ddd5',
          }}
        >
          📚 TBR Builder
        </h1>
      </div>
      <p
        style={{
          color: muted,
          fontSize: '13px',
          marginBottom: '20px',
          marginLeft: '32px',
        }}
      >
        {availableBooks.length} new books available
        {latestTBRUnreadIds.size > 0 && (
          <span style={{ color: accent }}>
            {' '}
            · {latestTBRUnreadIds.size} already in TBR
          </span>
        )}
      </p>

      {/* All books in TBR warning */}
      {availableBooks.length === 0 && latestTBRUnreadIds.size > 0 && (
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(196,160,124,0.06)',
            border: `1px solid ${accent}33`,
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          <p
            style={{ fontSize: '13px', color: '#e2ddd5', marginBottom: '4px' }}
          >
            📋 All your unread books are already in a TBR!
          </p>
          <p style={{ fontSize: '11px', color: muted, marginBottom: '10px' }}>
            Finish some books or add new ones to your library
          </p>
          <button
            onClick={() => navigate('/search')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              background: accent,
              color: '#141010',
              fontWeight: 600,
              fontSize: '12px',
            }}
          >
            + Add more books
          </button>
        </div>
      )}

      {/* Period */}
      {availableBooks.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { key: 'week' as Period, label: '📅 Week', sub: '2-3 books' },
              { key: 'month' as Period, label: '🗓️ Month', sub: '4-8 books' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setPeriod(p.key);
                  setBookCount(Math.min(p.key === 'week' ? 3 : 5, maxPickable));
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '14px',
                  border:
                    period === p.key
                      ? `1px solid ${accent}`
                      : '1px solid #2a2520',
                  cursor: 'pointer',
                  background:
                    period === p.key ? 'rgba(196,160,124,0.1)' : '#1a1614',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: period === p.key ? '#e2ddd5' : muted,
                  }}
                >
                  {p.label}
                </p>
                <p style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>
                  {p.sub}
                </p>
              </button>
            ))}
          </div>

          {/* Book count */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#1a1614',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#e2ddd5' }}>
              📖 How many books?
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setBookCount(Math.max(1, bookCount - 1))}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#2a2520',
                  color: '#e2ddd5',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                −
              </button>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: accent,
                  minWidth: '24px',
                  textAlign: 'center',
                }}
              >
                {bookCount}
              </span>
              <button
                onClick={() =>
                  setBookCount(
                    Math.min(Math.min(10, maxPickable), bookCount + 1)
                  )
                }
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#2a2520',
                  color: '#e2ddd5',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Mix toggle */}
          <button
            onClick={() => setMixGenres(!mixGenres)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              background: mixGenres ? 'rgba(196,160,124,0.08)' : '#1a1614',
              border: mixGenres ? `1px solid ${accent}` : '1px solid #2a2520',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '13px', color: '#e2ddd5' }}>
              🎨 Mix genres
            </span>
            <div
              style={{
                width: '40px',
                height: '22px',
                borderRadius: '11px',
                background: mixGenres ? accent : '#2a2520',
                position: 'relative',
                transition: 'background 0.3s',
              }}
            >
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: '#e2ddd5',
                  position: 'absolute',
                  top: '2px',
                  left: mixGenres ? '20px' : '2px',
                  transition: 'left 0.3s',
                }}
              />
            </div>
          </button>

          {/* Mode selection */}
          {!mode && currentTBR.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <p
                style={{
                  fontSize: '11px',
                  color: muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Choose your method
              </p>
              <button
                onClick={() => {
                  setMode('full-random');
                  doFullRandom();
                }}
                style={{
                  padding: '18px 16px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  background: accent,
                  color: '#141010',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <Shuffle size={20} />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700 }}>
                      🎲 Full Random
                    </p>
                    <p style={{ fontSize: '11px', opacity: 0.7 }}>
                      Surprise me with {bookCount} books!
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMode('prompts')}
                style={{
                  padding: '18px 16px',
                  borderRadius: '14px',
                  border: '1px solid #2a2520',
                  cursor: 'pointer',
                  background: '#1a1614',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <Sparkles size={20} color={accent} />
                  <div>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#e2ddd5',
                      }}
                    >
                      🎫 Draw Prompts
                    </p>
                    <p style={{ fontSize: '11px', color: muted }}>
                      Pull random slips — "a dark read", "a standalone"...
                    </p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setMode('manual')}
                style={{
                  padding: '18px 16px',
                  borderRadius: '14px',
                  border: '1px solid #2a2520',
                  cursor: 'pointer',
                  background: '#1a1614',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <Plus size={20} color={accent} />
                  <div>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#e2ddd5',
                      }}
                    >
                      ✍️ Pick Manually
                    </p>
                    <p style={{ fontSize: '11px', color: muted }}>
                      Choose from your shelves
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Back button */}
          {mode && currentTBR.length === 0 && (
            <button
              onClick={resetBuilder}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: muted,
                fontSize: '12px',
                marginBottom: '12px',
              }}
            >
              <ArrowLeft size={14} /> Back to methods
            </button>
          )}

          {/* Prompt mode */}
          {mode === 'prompts' && currentTBR.length < bookCount && (
            <div
              style={{
                padding: '20px',
                borderRadius: '16px',
                background: '#1a1614',
                border: '1px solid #2a2520',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <p
                style={{ fontSize: '12px', color: muted, marginBottom: '4px' }}
              >
                Book {currentTBR.length + 1} of {bookCount}
              </p>
              {!showPromptResult && !isDrawing && (
                <button
                  onClick={drawPrompt}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '24px',
                    border: 'none',
                    cursor: 'pointer',
                    background: accent,
                    color: '#141010',
                    fontSize: '14px',
                    fontWeight: 700,
                    marginTop: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  🎫 Draw a prompt!
                </button>
              )}
              {isDrawing && currentPrompt && (
                <div style={{ padding: '20px', marginTop: '12px' }}>
                  <p style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {currentPrompt.emoji}
                  </p>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#e2ddd5',
                      fontWeight: 600,
                    }}
                  >
                    {currentPrompt.text}
                  </p>
                </div>
              )}
              {showPromptResult && currentPrompt && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'rgba(196,160,124,0.08)',
                      border: `1px solid ${accent}`,
                      marginBottom: '16px',
                    }}
                  >
                    <p style={{ fontSize: '24px', marginBottom: '6px' }}>
                      {currentPrompt.emoji}
                    </p>
                    <p
                      style={{
                        fontSize: '14px',
                        color: '#e2ddd5',
                        fontWeight: 600,
                      }}
                    >
                      {currentPrompt.text}
                    </p>
                  </div>
                  {promptBook ? (
                    <div>
                      <p
                        style={{
                          fontSize: '11px',
                          color: muted,
                          marginBottom: '10px',
                        }}
                      >
                        We suggest:
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '12px',
                          background: '#141010',
                          textAlign: 'left',
                          marginBottom: '12px',
                        }}
                      >
                        <BookCover
                          src={promptBook.cover}
                          title={promptBook.title}
                          isbn={promptBook.id}
                          width={50}
                          height={75}
                          borderRadius="6px"
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: '#e2ddd5',
                            }}
                          >
                            {promptBook.title}
                          </p>
                          <p style={{ fontSize: '11px', color: muted }}>
                            {promptBook.author}
                          </p>
                          {promptBook.series && (
                            <p style={{ fontSize: '10px', color: accent }}>
                              {promptBook.series} #{promptBook.seriesNumber}
                            </p>
                          )}
                          {promptBook.spice > 0 && (
                            <span style={{ fontSize: '10px' }}>
                              {'🌶️'.repeat(promptBook.spice)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'center',
                        }}
                      >
                        <button
                          onClick={acceptPromptBook}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            background: accent,
                            color: '#141010',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          ✓ Add this!
                        </button>
                        <button
                          onClick={rerollPromptBook}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            background: '#2a2520',
                            color: '#e2ddd5',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Shuffle size={12} /> Another
                        </button>
                        <button
                          onClick={() => {
                            setShowPromptResult(false);
                            setCurrentPrompt(null);
                          }}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            background: '#2a2520',
                            color: muted,
                            fontSize: '12px',
                          }}
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '12px', color: muted }}>
                        No matching books in your library 😅
                      </p>
                      <button
                        onClick={() => {
                          setShowPromptResult(false);
                          setCurrentPrompt(null);
                        }}
                        style={{
                          marginTop: '10px',
                          padding: '10px 24px',
                          borderRadius: '20px',
                          border: 'none',
                          cursor: 'pointer',
                          background: '#2a2520',
                          color: '#e2ddd5',
                          fontSize: '12px',
                        }}
                      >
                        Draw again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Manual mode */}
          {mode === 'manual' && currentTBR.length < bookCount && (
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{ fontSize: '11px', color: muted, marginBottom: '10px' }}
              >
                Tap to add ({currentTBR.length}/{bookCount})
              </p>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {pickableBooks.map((book) => (
                  <div
                    key={book.id}
                    onClick={() =>
                      setCurrentTBR((prev) => [
                        ...prev,
                        { bookId: book.id, prompt: 'Manual pick' },
                      ])
                    }
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '12px',
                      background: '#1a1614',
                      border: '1px solid #2a2520',
                      cursor: 'pointer',
                      alignItems: 'center',
                    }}
                  >
                    <BookCover
                      src={book.cover}
                      title={book.title}
                      isbn={book.id}
                      width={40}
                      height={60}
                      borderRadius="4px"
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#e2ddd5',
                        }}
                      >
                        {book.title}
                      </p>
                      <p style={{ fontSize: '10px', color: muted }}>
                        {book.author}
                      </p>
                      {book.series && (
                        <p style={{ fontSize: '9px', color: accent }}>
                          {book.series} #{book.seriesNumber}
                        </p>
                      )}
                    </div>
                    <Plus size={16} color={accent} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current TBR */}
          {currentTBR.length > 0 && (
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: '#1a1614',
                border: `1px solid ${accent}33`,
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'Playfair Display, serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#e2ddd5',
                  }}
                >
                  {period === 'week' ? '📅' : '🗓️'} Your{' '}
                  {period === 'week' ? 'Weekly' : 'Monthly'} TBR
                </h3>
                <span style={{ fontSize: '12px', color: accent }}>
                  {currentTBR.length}/{bookCount}
                </span>
              </div>
              {currentTBR.map((item, index) => {
                const book = getDbBook(item.bookId);
                if (!book) return null;
                return (
                  <div
                    key={item.bookId}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '12px',
                      background: '#141010',
                      marginBottom: '8px',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: accent,
                        color: '#141010',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <div
                      onClick={() => navigate(`/book/${book.id}`)}
                      style={{ cursor: 'pointer', flexShrink: 0 }}
                    >
                      <BookCover
                        src={book.cover}
                        title={book.title}
                        isbn={book.id}
                        width={40}
                        height={60}
                        borderRadius="4px"
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        onClick={() => navigate(`/book/${book.id}`)}
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#e2ddd5',
                          cursor: 'pointer',
                        }}
                      >
                        {book.title}
                      </p>
                      <p style={{ fontSize: '10px', color: muted }}>
                        {book.author}
                      </p>
                      {item.prompt && (
                        <p
                          style={{
                            fontSize: '9px',
                            color: accent,
                            fontStyle: 'italic',
                            marginTop: '2px',
                          }}
                        >
                          {item.prompt}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromTBR(item.bookId)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <X size={14} color={muted} />
                    </button>
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={saveTBR}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: accent,
                    color: '#141010',
                    fontWeight: 600,
                    fontSize: '13px',
                  }}
                >
                  💾 Save TBR
                </button>
                <button
                  onClick={resetBuilder}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#2a2520',
                    color: muted,
                    fontSize: '13px',
                  }}
                >
                  Start over
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Saved TBRs */}
      {savedTBRs.length > 0 && (
        <div>
          <h3
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '16px',
              fontWeight: 700,
              color: '#e2ddd5',
              marginBottom: '12px',
            }}
          >
            📋 Saved TBRs
          </h3>
          {savedTBRs.map((tbr) => (
            <div
              key={tbr.id}
              style={{
                padding: '14px',
                borderRadius: '14px',
                background: '#1a1614',
                border: '1px solid #2a2520',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#e2ddd5',
                    }}
                  >
                    {tbr.period === 'week' ? '📅 Weekly' : '🗓️ Monthly'} TBR
                  </p>
                  <p style={{ fontSize: '10px', color: muted }}>
                    {new Date(tbr.createdAt).toLocaleDateString()} ·{' '}
                    {tbr.books.length} books
                  </p>
                </div>
                <button
                  onClick={() => deleteSavedTBR(tbr.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} color="#6b4040" />
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {tbr.books.map((item) => {
                  const book = getDbBook(item.bookId);
                  if (!book) return null;
                  return (
                    <div
                      key={item.bookId}
                      onClick={() => navigate(`/book/${book.id}`)}
                      className="flex-shrink-0"
                      style={{ width: '50px', cursor: 'pointer' }}
                    >
                      <BookCover
                        src={book.cover}
                        title={book.title}
                        isbn={book.id}
                        width={50}
                        height={72}
                        borderRadius="4px"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
