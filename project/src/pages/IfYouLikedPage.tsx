import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksDatabase } from '../api/books';
import type { Book } from '../data/books';
import BookCover from '../components/BookCover';
import { ArrowLeft, ArrowRight, Star, BookOpen, Search } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

interface Modifier {
  id: string;
  label: string;
  emoji: string;
  description: string;
  apply: (source: Book, candidate: Book) => number;
}

const MODIFIERS: Modifier[] = [
  {
    id: 'more-spicy',
    label: 'More Spicy',
    emoji: '🌶️',
    description: 'Same vibes but hotter',
    apply: (source, candidate) => {
      let s = 0;
      if (candidate.spice > source.spice)
        s += (candidate.spice - source.spice) * 3;
      else if (candidate.spice <= source.spice) s -= 5;
      return s;
    },
  },
  {
    id: 'less-spicy',
    label: 'Less Spicy',
    emoji: '🌸',
    description: 'Same vibes but cleaner',
    apply: (source, candidate) => {
      let s = 0;
      if (candidate.spice < source.spice)
        s += (source.spice - candidate.spice) * 3;
      else if (candidate.spice >= source.spice) s -= 5;
      return s;
    },
  },
  {
    id: 'darker',
    label: 'Darker',
    emoji: '🖤',
    description: 'More twisted & intense',
    apply: (_src, c) => {
      let s = 0;
      if (c.mood.some((m) => ['dark', 'intense'].includes(m))) s += 5;
      if (
        c.genres.some((g) =>
          ['dark-romance', 'mafia-romance', 'bully-romance'].includes(g)
        )
      )
        s += 4;
      if (
        c.tropes.some((t) =>
          [
            'morally-grey',
            'villain-romance',
            'possessive-hero',
            'revenge',
          ].includes(t)
        )
      )
        s += 3;
      if (c.mood.some((m) => ['fluffy', 'cozy', 'funny'].includes(m))) s -= 4;
      return s;
    },
  },
  {
    id: 'lighter',
    label: 'Lighter & Fun',
    emoji: '☀️',
    description: 'Feel-good vibes',
    apply: (_src, c) => {
      let s = 0;
      if (c.mood.some((m) => ['funny', 'fluffy', 'cozy'].includes(m))) s += 5;
      if (c.genres.some((g) => ['rom-com', 'contemporary-romance'].includes(g)))
        s += 3;
      if (c.mood.some((m) => ['dark', 'intense', 'heartbreaking'].includes(m)))
        s -= 4;
      return s;
    },
  },
  {
    id: 'with-fantasy',
    label: 'With Fantasy',
    emoji: '🏰',
    description: 'Add magic & kingdoms',
    apply: (_src, c) => {
      let s = 0;
      if (
        c.genres.some((g) =>
          ['fantasy-romance', 'romantasy', 'paranormal-romance'].includes(g)
        )
      )
        s += 6;
      if (c.tropes.includes('magical-bond')) s += 3;
      if (
        c.genres.some((g) =>
          ['contemporary-romance', 'sports-romance', 'rom-com'].includes(g)
        )
      )
        s -= 3;
      return s;
    },
  },
  {
    id: 'contemporary',
    label: 'Real World',
    emoji: '🌃',
    description: 'Modern setting',
    apply: (_src, c) => {
      let s = 0;
      if (
        c.genres.some((g) =>
          [
            'contemporary-romance',
            'rom-com',
            'new-adult',
            'sports-romance',
          ].includes(g)
        )
      )
        s += 6;
      if (
        c.genres.some((g) =>
          ['fantasy-romance', 'romantasy', 'historical-romance'].includes(g)
        )
      )
        s -= 4;
      return s;
    },
  },
  {
    id: 'more-angsty',
    label: 'More Angsty',
    emoji: '💔',
    description: 'I want to suffer',
    apply: (_src, c) => {
      let s = 0;
      if (
        c.mood.some((m) => ['angsty', 'heartbreaking', 'emotional'].includes(m))
      )
        s += 5;
      if (
        c.tropes.some((t) =>
          [
            'slow-burn',
            'second-chance',
            'forbidden-love',
            'unrequited-love',
          ].includes(t)
        )
      )
        s += 3;
      if (c.mood.some((m) => ['fluffy', 'cozy', 'funny'].includes(m))) s -= 3;
      return s;
    },
  },
  {
    id: 'slow-burn',
    label: 'Slow Burn',
    emoji: '🕯️',
    description: 'Make me wait for it',
    apply: (_src, c) => {
      let s = 0;
      if (c.tropes.includes('slow-burn')) s += 6;
      if (c.tropes.some((t) => ['enemies-to-lovers', 'rivals'].includes(t)))
        s += 2;
      return s;
    },
  },
  {
    id: 'possessive',
    label: 'Possessive Hero',
    emoji: '😈',
    description: 'Obsessive, jealous, "mine"',
    apply: (_src, c) => {
      let s = 0;
      if (
        c.tropes.some((t) =>
          [
            'possessive-hero',
            'touch-her-and-die',
            'morally-grey',
            'villain-romance',
          ].includes(t)
        )
      )
        s += 5;
      if (c.spice >= 4) s += 2;
      return s;
    },
  },
  {
    id: 'sporty',
    label: 'Sports Romance',
    emoji: '🏒',
    description: 'Athletes & competition',
    apply: (_src, c) => {
      let s = 0;
      if (c.genres.includes('sports-romance')) s += 8;
      if (
        c.tropes.some((t) => ['grumpy-sunshine', 'he-falls-first'].includes(t))
      )
        s += 2;
      return s;
    },
  },
  {
    id: 'mafia',
    label: 'Mafia / Crime',
    emoji: '🔫',
    description: 'Dangerous men in suits',
    apply: (_src, c) => {
      let s = 0;
      if (c.genres.includes('mafia-romance')) s += 8;
      if (
        c.tropes.some((t) =>
          ['morally-grey', 'possessive-hero', 'arranged-marriage'].includes(t)
        )
      )
        s += 3;
      return s;
    },
  },
  {
    id: 'bully',
    label: 'Bully Romance',
    emoji: '👊',
    description: 'Mean but obsessed',
    apply: (_src, c) => {
      let s = 0;
      if (c.genres.includes('bully-romance')) s += 8;
      if (
        c.tropes.some((t) =>
          ['enemies-to-lovers', 'morally-grey', 'possessive-hero'].includes(t)
        )
      )
        s += 3;
      return s;
    },
  },
];

function findRecommendations(source: Book, mods: Modifier[]): Book[] {
  return booksDatabase
    .filter((b) => b.id !== source.id)
    .map((candidate) => {
      let score = 0;

      // Base similarity
      const sharedTropes = source.tropes.filter((t) =>
        candidate.tropes.includes(t)
      );
      score += sharedTropes.length * 2;

      const sharedMoods = source.mood.filter((m) => candidate.mood.includes(m));
      score += sharedMoods.length * 1.5;

      const sharedGenres = source.genres.filter((g) =>
        candidate.genres.includes(g)
      );
      score += sharedGenres.length * 1;

      // Apply ALL selected modifiers
      for (const mod of mods) {
        score += mod.apply(source, candidate);
      }

      // Penalty for same author
      if (candidate.author === source.author) score -= 3;

      return { book: candidate, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .filter((r) => r.score > 0)
    .map((r) => r.book);
}

export default function IfYouLikedPage() {
  const navigate = useNavigate();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(true);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return booksDatabase
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [searchQuery]);

  const activeMods = MODIFIERS.filter((m) => selectedMods.has(m.id));

  const recommendations = useMemo(() => {
    if (!selectedBook || activeMods.length === 0) return [];
    return findRecommendations(selectedBook, activeMods);
  }, [selectedBook, selectedMods]);

  const toggleMod = (id: string) => {
    setSelectedMods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setSelectedBook(null);
    setSelectedMods(new Set());
    setSearchQuery('');
    setShowSearch(true);
  };

  const selectBook = (book: Book) => {
    setSelectedBook(book);
    setShowSearch(false);
    setSelectedMods(new Set());
    setSearchQuery('');
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      <button
        onClick={() => navigate(-1)}
        style={{
          color: muted,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '12px',
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
        If You Liked...
      </h1>
      <p
        style={{
          color: muted,
          fontSize: '13px',
          marginTop: '4px',
          marginBottom: '24px',
        }}
      >
        find your next obsession based on what you love
      </p>

      {/* STEP 1: Choose Book */}
      {showSearch && !selectedBook && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 18px',
              borderRadius: '14px',
              background: '#1a1614',
              border: '1px solid #2a2520',
              marginBottom: '12px',
            }}
          >
            <Search size={16} color={muted} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a book you loved..."
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#e2ddd5',
                fontSize: '15px',
              }}
              autoFocus
            />
          </div>

          {searchResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {searchResults.map((book) => (
                <button
                  key={book.id}
                  onClick={() => selectBook(book)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: '#1a1614',
                    border: '1px solid #2a2520',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <BookCover
                    src={book.cover}
                    title={book.title}
                    width={40}
                    height={60}
                    borderRadius="6px"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#e2ddd5',
                      }}
                      className="truncate"
                    >
                      {book.title}
                    </p>
                    <p style={{ fontSize: '11px', color: muted }}>
                      {book.author}
                    </p>
                  </div>
                  <ArrowRight size={14} color={muted} />
                </button>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <p
              style={{
                color: muted,
                textAlign: 'center',
                padding: '20px 0',
                fontSize: '13px',
              }}
            >
              No books found
            </p>
          )}

          {searchQuery.length < 2 && (
            <>
              <p
                style={{
                  fontSize: '11px',
                  color: muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: '10px',
                  marginTop: '16px',
                }}
              >
                or pick a popular one
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {booksDatabase
                  .filter((b) => b.rating && b.rating >= 4.0)
                  .slice(0, 10)
                  .map((book) => (
                    <div
                      key={book.id}
                      onClick={() => selectBook(book)}
                      className="flex-shrink-0"
                      style={{
                        width: '80px',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <BookCover
                        src={book.cover}
                        title={book.title}
                        author={book.author}
                        width={80}
                        height={112}
                        borderRadius="8px"
                      />
                      <p
                        style={{
                          fontSize: '9px',
                          color: muted,
                          marginTop: '4px',
                        }}
                        className="truncate"
                      >
                        {book.title}
                      </p>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 2: Selected Book + Modifiers */}
      {selectedBook && (
        <>
          {/* Selected Book */}
          <div
            style={{
              display: 'flex',
              gap: '14px',
              padding: '14px',
              borderRadius: '14px',
              background: '#1a1614',
              border: `1px solid ${accent}`,
              marginBottom: '20px',
            }}
          >
            <BookCover
              src={selectedBook.cover}
              title={selectedBook.title}
              width={56}
              height={84}
              borderRadius="8px"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '10px',
                  color: accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: '2px',
                }}
              >
                you liked
              </p>
              <h3
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#e2ddd5',
                }}
                className="truncate"
              >
                {selectedBook.title}
              </h3>
              <p style={{ fontSize: '11px', color: muted }}>
                {selectedBook.author}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {selectedBook.spice > 0 && (
                  <span style={{ fontSize: '10px' }}>
                    {'🌶️'.repeat(selectedBook.spice)}
                  </span>
                )}
                {selectedBook.rating && (
                  <span style={{ fontSize: '10px', color: '#c9a84c' }}>
                    ★ {selectedBook.rating}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={reset}
              style={{
                alignSelf: 'flex-start',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: muted,
                fontSize: '11px',
              }}
            >
              change
            </button>
          </div>

          {/* Modifiers — multi-select */}
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '18px',
              fontWeight: 600,
              color: '#e2ddd5',
              marginBottom: '4px',
            }}
          >
            But I want it...
          </h2>
          <p style={{ fontSize: '12px', color: muted, marginBottom: '16px' }}>
            select one or more ✨
          </p>
          <div
            className="grid grid-cols-2 gap-2"
            style={{ marginBottom: '20px' }}
          >
            {MODIFIERS.map((mod) => {
              const active = selectedMods.has(mod.id);
              return (
                <button
                  key={mod.id}
                  onClick={() => toggleMod(mod.id)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '12px',
                    border: active
                      ? `1px solid ${accent}`
                      : '1px solid #2a2520',
                    background: active ? 'rgba(196,160,124,0.08)' : '#1a1614',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{mod.emoji}</span>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: active ? 700 : 600,
                      color: active ? accent : '#e2ddd5',
                      marginTop: '6px',
                    }}
                  >
                    {mod.label}
                  </p>
                  <p
                    style={{ fontSize: '10px', color: muted, marginTop: '2px' }}
                  >
                    {mod.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Results */}
          {activeMods.length > 0 && (
            <>
              {/* Active filters */}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '14px',
                }}
              >
                {activeMods.map((m) => (
                  <span
                    key={m.id}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: 'rgba(196,160,124,0.12)',
                      fontSize: '11px',
                      color: accent,
                    }}
                  >
                    {m.emoji} {m.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 mb-4">
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
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: accent,
                  }}
                >
                  you'll love these
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

              {recommendations.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {recommendations.map((book, i) => (
                    <div
                      key={book.id}
                      onClick={() => navigate(`/book/${book.id}`)}
                      style={{
                        display: 'flex',
                        gap: '14px',
                        padding: '14px',
                        borderRadius: '14px',
                        background: '#1a1614',
                        cursor: 'pointer',
                        border:
                          i === 0 ? `1px solid ${accent}` : '1px solid #1e1a18',
                        position: 'relative',
                      }}
                    >
                      {i === 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-1px',
                            right: '12px',
                            padding: '2px 10px',
                            borderRadius: '0 0 8px 8px',
                            background: accent,
                            fontSize: '9px',
                            fontWeight: 700,
                            color: '#141010',
                            letterSpacing: '0.1em',
                          }}
                        >
                          BEST MATCH
                        </div>
                      )}
                      <BookCover
                        src={book.cover}
                        title={book.title}
                        width={56}
                        height={84}
                        borderRadius="8px"
                        style={{ flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontFamily: 'Playfair Display, serif',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#e2ddd5',
                          }}
                          className="truncate"
                        >
                          {book.title}
                        </h3>
                        <p style={{ fontSize: '11px', color: muted }}>
                          {book.author}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            marginTop: '4px',
                            flexWrap: 'wrap',
                          }}
                        >
                          {book.spice > 0 && (
                            <span style={{ fontSize: '10px' }}>
                              {'🌶️'.repeat(book.spice)}
                            </span>
                          )}
                          {book.rating && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#c9a84c',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px',
                              }}
                            >
                              <Star size={8} fill="#c9a84c" color="#c9a84c" />{' '}
                              {book.rating}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '3px',
                            marginTop: '6px',
                          }}
                        >
                          {book.tropes.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '8px',
                                background: selectedBook.tropes.includes(t)
                                  ? 'rgba(196,160,124,0.15)'
                                  : '#2a2520',
                                fontSize: '9px',
                                color: selectedBook.tropes.includes(t)
                                  ? accent
                                  : muted,
                              }}
                            >
                              {t.split('-').join(' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  style={{
                    color: muted,
                    textAlign: 'center',
                    padding: '40px 0',
                  }}
                >
                  No perfect match — try different modifiers!
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
