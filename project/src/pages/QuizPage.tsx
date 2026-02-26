import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksDatabase } from '../api/books';
import { useLibrary } from '../hooks/LibraryContext';
import type { Book } from '../data/books';
import { Star, RotateCcw, BookOpen, Plus, Library } from 'lucide-react';
import BookCover from '../components/BookCover';

const accent = '#c4a07c';
const muted = '#5c5450';

const TBR_JOKES = [
  "Your TBR just grew again... we're not sorry 😏",
  'Another one for the infinite pile 📚♾️',
  'Your bookshelf is crying... tears of joy 🥲',
  "You'll get to it... eventually 😅",
  'Sleep is overrated anyway 🌙📖',
  'Your wallet left the chat 💸',
  "One more won't hurt... right? 🤡",
  'TBR count: ♾️ and counting',
  'Plot twist: you added another book 📖',
  'Your Kindle storage is sweating 💦',
];

interface Question {
  id: number;
  text: string;
  options: {
    label: string;
    emoji: string;
    moods: string[];
    tropes: string[];
    genres: string[];
    spiceMin: number;
    spiceMax: number;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What's your mood right now?",
    options: [
      {
        label: 'I want to feel everything',
        emoji: '😭',
        moods: ['emotional', 'heartbreaking', 'angsty'],
        tropes: [],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Give me butterflies',
        emoji: '🦋',
        moods: ['fluffy', 'cozy', 'funny'],
        tropes: [],
        genres: [],
        spiceMin: 0,
        spiceMax: 3,
      },
      {
        label: 'I need intensity',
        emoji: '🔥',
        moods: ['intense', 'dark', 'steamy'],
        tropes: [],
        genres: [],
        spiceMin: 3,
        spiceMax: 5,
      },
      {
        label: 'Make me laugh',
        emoji: '😂',
        moods: ['funny', 'fluffy', 'cozy'],
        tropes: [],
        genres: ['rom-com'],
        spiceMin: 0,
        spiceMax: 3,
      },
    ],
  },
  {
    id: 2,
    text: 'Pick your poison:',
    options: [
      {
        label: 'Enemies to Lovers',
        emoji: '⚔️',
        moods: [],
        tropes: ['enemies-to-lovers', 'rivals'],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Friends to More',
        emoji: '💛',
        moods: [],
        tropes: ['friends-to-lovers', 'childhood-friends', 'slow-burn'],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Forbidden & Secret',
        emoji: '🚫',
        moods: [],
        tropes: ['forbidden-love', 'secret-identity', 'age-gap'],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Obsessive & Dark',
        emoji: '🖤',
        moods: [],
        tropes: [
          'possessive-hero',
          'morally-grey',
          'villain-romance',
          'touch-her-and-die',
        ],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
    ],
  },
  {
    id: 3,
    text: 'How hot do you want it?',
    options: [
      {
        label: 'Clean & sweet',
        emoji: '🌸',
        moods: [],
        tropes: [],
        genres: [],
        spiceMin: 0,
        spiceMax: 1,
      },
      {
        label: 'A little warmth',
        emoji: '🕯️',
        moods: [],
        tropes: [],
        genres: [],
        spiceMin: 2,
        spiceMax: 3,
      },
      {
        label: 'Spicy please',
        emoji: '🌶️',
        moods: [],
        tropes: [],
        genres: [],
        spiceMin: 3,
        spiceMax: 4,
      },
      {
        label: 'Burn my kindle',
        emoji: '🔥',
        moods: [],
        tropes: [],
        genres: [],
        spiceMin: 4,
        spiceMax: 5,
      },
    ],
  },
  {
    id: 4,
    text: 'What world?',
    options: [
      {
        label: 'Fantasy kingdoms & magic',
        emoji: '🏰',
        moods: [],
        tropes: [],
        genres: ['fantasy-romance', 'romantasy'],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Real world, real feelings',
        emoji: '🌃',
        moods: [],
        tropes: [],
        genres: ['contemporary-romance', 'rom-com'],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Dark & dangerous',
        emoji: '🗡️',
        moods: [],
        tropes: [],
        genres: ['dark-romance', 'mafia-romance', 'bully-romance'],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Sporty & fun',
        emoji: '🏒',
        moods: [],
        tropes: [],
        genres: ['sports-romance', 'new-adult'],
        spiceMin: 0,
        spiceMax: 5,
      },
    ],
  },
  {
    id: 5,
    text: 'Pick a vibe:',
    options: [
      {
        label: 'Crying at 3am',
        emoji: '🌙',
        moods: ['emotional', 'heartbreaking', 'angsty'],
        tropes: ['slow-burn', 'second-chance'],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Beach read with wine',
        emoji: '🍷',
        moods: ['funny', 'fluffy', 'cozy'],
        tropes: ['grumpy-sunshine', 'fake-dating'],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Cannot put it down',
        emoji: '📖',
        moods: ['intense', 'adventurous', 'mysterious'],
        tropes: [],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
      {
        label: 'Slow burn that wrecks me',
        emoji: '💔',
        moods: ['angsty', 'emotional', 'intense'],
        tropes: ['slow-burn', 'enemies-to-lovers'],
        genres: [],
        spiceMin: 0,
        spiceMax: 5,
      },
    ],
  },
];

function scoreBook(
  book: Book,
  allMoods: string[],
  allTropes: string[],
  allGenres: string[],
  spiceMin: number,
  spiceMax: number
): number {
  let score = 0;
  for (const mood of allMoods) {
    if (book.mood.some((m) => m.toLowerCase() === mood)) score += 4;
  }
  for (const trope of allTropes) {
    if (book.tropes.some((t) => t === trope)) score += 5;
  }
  for (const genre of allGenres) {
    if (book.genres.some((g) => g === genre)) score += 3;
  }
  if (book.spice >= spiceMin && book.spice <= spiceMax) {
    score += 3;
  } else {
    score -= 6;
  }
  score += Math.random() * 3;
  return score;
}

export default function QuizPage() {
  const navigate = useNavigate();
  const { library, addToLibrary } = useLibrary();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(typeof QUESTIONS)[0]['options'][0][]>(
    []
  );
  const [result, setResult] = useState<Book[] | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [tbrJoke, setTbrJoke] = useState<{ [bookId: string]: string }>({});
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set());

  const readBookIds = new Set(
    library
      .filter((b) =>
        ['finished', 'read-before', 'reading', 'dnf'].includes(b.status)
      )
      .map((b) => b.bookId)
  );

  // Check if book is in library (any status)
  const isInLibrary = (bookId: string) =>
    library.some((b) => b.bookId === bookId);

  // Get library book status
  const getLibraryStatus = (bookId: string) => {
    const lb = library.find((b) => b.bookId === bookId);
    return lb?.status;
  };

  const handleAddToTBR = (book: Book) => {
    addToLibrary({
      bookId: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      status: 'want-to-read',
      totalPages: book.pages || 0,
      currentPage: 0,
    });
    const joke = TBR_JOKES[Math.floor(Math.random() * TBR_JOKES.length)];
    setTbrJoke((prev) => ({ ...prev, [book.id]: joke }));
    setAddedBooks((prev) => new Set(prev).add(book.id));
  };

  const handleAnswer = (option: (typeof QUESTIONS)[0]['options'][0]) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setRevealing(true);

      const allMoods: string[] = [];
      const allTropes: string[] = [];
      const allGenres: string[] = [];
      let spiceMin = 0;
      let spiceMax = 5;
      let spiceSet = false;

      for (const ans of newAnswers) {
        allMoods.push(...ans.moods);
        allTropes.push(...ans.tropes);
        allGenres.push(...ans.genres);
        if (
          ans.spiceMin !== 0 ||
          ans.spiceMax !== 5 ||
          (ans.spiceMin === 0 && ans.spiceMax === 1)
        ) {
          if (!spiceSet || ans.spiceMin !== 0 || ans.spiceMax !== 5) {
            spiceMin = ans.spiceMin;
            spiceMax = ans.spiceMax;
            spiceSet = true;
          }
        }
      }

      setTimeout(() => {
        const available = booksDatabase;
        const scored = available
          .map((book) => ({
            book,
            score: scoreBook(
              book,
              allMoods,
              allTropes,
              allGenres,
              spiceMin,
              spiceMax
            ),
          }))
          .sort((a, b) => b.score - a.score);

        const top8 = scored.slice(0, 8);
        const shuffled = top8.sort(() => Math.random() - 0.5);
        const final = shuffled.slice(0, 5).map((s) => s.book);
        const best = scored[0];
        const rest = final.filter((b) => b.id !== best.book.id).slice(0, 4);

        setResult([best.book, ...rest]);
        setRevealing(false);
      }, 2000);
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
    setTbrJoke({});
    setAddedBooks(new Set());
  };

  // Smart button for a book
  const renderSmartButton = (book: Book, large: boolean = false) => {
    const inLibrary = isInLibrary(book.id);
    const status = getLibraryStatus(book.id);
    const justAdded = addedBooks.has(book.id);

    if (inLibrary && !justAdded) {
      // Book is in library — show context-aware button
      const isReading = status === 'reading';
      const isWant = status === 'want-to-read';
      const isDone = status === 'finished' || status === 'read-before';

      let label = '📖 Go to Library';
      if (isReading) label = '📖 Continue Reading';
      else if (isWant) label = '✨ In your TBR';
      else if (isDone) label = '✅ Already Read';

      return (
        <div style={{ textAlign: 'center', marginTop: large ? '16px' : '8px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/library/${book.id}`);
            }}
            style={{
              padding: large ? '12px 28px' : '8px 18px',
              borderRadius: '25px',
              border: 'none',
              cursor: 'pointer',
              fontSize: large ? '13px' : '11px',
              fontWeight: 600,
              background: isReading ? '#2ecc71' : isDone ? '#3498db' : accent,
              color: '#141010',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Library size={large ? 14 : 12} /> {label}
          </button>
          {isDone && (
            <p style={{ fontSize: '10px', color: muted, marginTop: '4px' }}>
              You've read this one! Great taste 👏
            </p>
          )}
        </div>
      );
    }

    if (justAdded) {
      // Just added to TBR — show joke
      return (
        <div style={{ textAlign: 'center', marginTop: large ? '16px' : '8px' }}>
          <div
            style={{
              padding: large ? '12px 28px' : '8px 18px',
              borderRadius: '25px',
              background: '#1e3a1e',
              color: '#2ecc71',
              fontSize: large ? '13px' : '11px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ✅ Added to TBR!
          </div>
          {tbrJoke[book.id] && (
            <p
              style={{
                fontSize: '10px',
                color: accent,
                marginTop: '6px',
                fontStyle: 'italic',
              }}
            >
              {tbrJoke[book.id]}
            </p>
          )}
        </div>
      );
    }

    // Not in library — show Add to TBR + View Book
    return (
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginTop: large ? '16px' : '8px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToTBR(book);
          }}
          style={{
            padding: large ? '12px 24px' : '8px 16px',
            borderRadius: '25px',
            border: 'none',
            cursor: 'pointer',
            fontSize: large ? '13px' : '11px',
            fontWeight: 600,
            background: accent,
            color: '#141010',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={large ? 14 : 12} /> Add to TBR
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/book/${book.id}`);
          }}
          style={{
            padding: large ? '12px 24px' : '8px 16px',
            borderRadius: '25px',
            border: `1px solid #2a2520`,
            cursor: 'pointer',
            fontSize: large ? '13px' : '11px',
            fontWeight: 600,
            background: 'transparent',
            color: muted,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <BookOpen size={large ? 14 : 12} /> View Book
        </button>
      </div>
    );
  };

  const question = QUESTIONS[step];
  const progressPercent = ((step + 1) / QUESTIONS.length) * 100;

  // Revealing
  if (revealing) {
    return (
      <div
        className="max-w-lg mx-auto px-4 pt-8 pb-28"
        style={{ textAlign: 'center' }}
      >
        <div style={{ paddingTop: '120px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              border: `3px solid ${accent}`,
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              color: '#e2ddd5',
            }}
          >
            Finding your perfect book...
          </h2>
          <p style={{ color: muted, fontSize: '13px', marginTop: '8px' }}>
            analyzing your vibes ✨
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Results
  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '28px',
            fontWeight: 700,
            color: '#e2ddd5',
            textAlign: 'center',
          }}
        >
          Your Perfect Match ✨
        </h1>
        <p
          style={{
            color: muted,
            fontSize: '13px',
            textAlign: 'center',
            marginTop: '4px',
            marginBottom: '28px',
          }}
        >
          based on your vibes
        </p>

        {/* #1 Match */}
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #1e1a18, #1a1614)',
            border: `1px solid ${accent}`,
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '10px',
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              marginBottom: '12px',
            }}
          >
            ✨ #1 match for you
          </p>

          {/* In library badge */}
          {isInLibrary(result[0].id) && (
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                background:
                  getLibraryStatus(result[0].id) === 'reading'
                    ? '#1e3a1e'
                    : '#1a2a3a',
                fontSize: '10px',
                fontWeight: 600,
                marginBottom: '10px',
                color:
                  getLibraryStatus(result[0].id) === 'reading'
                    ? '#2ecc71'
                    : '#3498db',
              }}
            >
              {getLibraryStatus(result[0].id) === 'reading'
                ? '📖 Currently Reading'
                : getLibraryStatus(result[0].id) === 'want-to-read'
                ? '✨ On your TBR'
                : getLibraryStatus(result[0].id) === 'finished' ||
                  getLibraryStatus(result[0].id) === 'read-before'
                ? '✅ Already Read'
                : '📚 In Library'}
            </div>
          )}

          <BookCover
            src={result[0].cover}
            title={result[0].title}
            isbn={result[0].id}
            width={120}
            height={180}
            borderRadius="10px"
            style={{
              boxShadow: '0 4px 30px rgba(196,160,124,0.2)',
              margin: '0 auto 14px',
            }}
          />
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: 700,
              color: '#e2ddd5',
            }}
          >
            {result[0].title}
          </h2>
          <p style={{ fontSize: '13px', color: muted, marginTop: '2px' }}>
            {result[0].author}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '8px',
            }}
          >
            {result[0].spice > 0 && (
              <span style={{ fontSize: '12px' }}>
                {'🌶️'.repeat(result[0].spice)}
              </span>
            )}
            {result[0].rating && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#c9a84c',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <Star size={10} fill="#c9a84c" color="#c9a84c" />{' '}
                {result[0].rating}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              justifyContent: 'center',
              marginTop: '10px',
            }}
          >
            {result[0].tropes.slice(0, 4).map((t) => (
              <span
                key={t}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: '#2a2520',
                  fontSize: '10px',
                  color: muted,
                }}
              >
                {t.split('-').join(' ')}
              </span>
            ))}
          </div>
          {result[0].description && (
            <p
              style={{
                fontSize: '12px',
                color: '#a09a90',
                marginTop: '10px',
                lineHeight: 1.6,
              }}
            >
              {result[0].description}
            </p>
          )}

          {/* Smart Button for #1 */}
          {renderSmartButton(result[0], true)}
        </div>

        {/* Other matches */}
        {result.length > 1 && (
          <>
            <p
              style={{
                fontSize: '11px',
                color: muted,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '12px',
              }}
            >
              also great for you
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              {result.slice(1).map((book) => (
                <div
                  key={book.id}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    background: '#1a1614',
                    border: '1px solid #2a2520',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  <BookCover
                    src={book.cover}
                    title={book.title}
                    isbn={book.id}
                    width={65}
                    height={98}
                    borderRadius="8px"
                    style={{ flexShrink: 0, cursor: 'pointer' }}
                    onClick={() => navigate(`/book/${book.id}`)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h3
                        onClick={() => navigate(`/book/${book.id}`)}
                        style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#e2ddd5',
                          cursor: 'pointer',
                        }}
                      >
                        {book.title}
                      </h3>
                      {isInLibrary(book.id) && (
                        <span
                          style={{
                            fontSize: '8px',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background:
                              getLibraryStatus(book.id) === 'reading'
                                ? '#1e3a1e'
                                : '#1a2a3a',
                            color:
                              getLibraryStatus(book.id) === 'reading'
                                ? '#2ecc71'
                                : '#3498db',
                            fontWeight: 600,
                          }}
                        >
                          {getLibraryStatus(book.id) === 'reading'
                            ? 'READING'
                            : getLibraryStatus(book.id) === 'want-to-read'
                            ? 'TBR'
                            : 'READ'}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '11px', color: muted }}>
                      {book.author}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        marginTop: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {book.tropes.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '8px',
                            background: '#252120',
                            fontSize: '9px',
                            color: muted,
                          }}
                        >
                          {t.split('-').join(' ')}
                        </span>
                      ))}
                    </div>

                    {/* Smart Button */}
                    {renderSmartButton(book)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <button
          onClick={restart}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: '0 auto',
            padding: '12px 24px',
            borderRadius: '25px',
            border: 'none',
            cursor: 'pointer',
            background: '#1e1a18',
            color: muted,
            fontSize: '13px',
          }}
        >
          <RotateCcw size={14} /> Try Again
        </button>
      </div>
    );
  }

  // Quiz Questions
  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '28px',
          fontWeight: 700,
          color: '#e2ddd5',
          textAlign: 'center',
          marginBottom: '4px',
        }}
      >
        Vibe Match
      </h1>
      <p
        style={{
          color: muted,
          fontSize: '13px',
          textAlign: 'center',
          marginBottom: '24px',
        }}
      >
        5 questions → your perfect book
      </p>

      {/* Progress */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '11px', color: muted }}>
            {step + 1} of {QUESTIONS.length}
          </span>
          <span style={{ fontSize: '11px', color: accent }}>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div
          style={{ height: '3px', borderRadius: '2px', background: '#2a2520' }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: '2px',
              background: accent,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Question */}
      <h2
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#e2ddd5',
          textAlign: 'center',
          marginBottom: '28px',
          lineHeight: 1.3,
        }}
      >
        {question.text}
      </h2>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(option)}
            style={{
              padding: '18px 20px',
              borderRadius: '14px',
              border: '1px solid #2a2520',
              cursor: 'pointer',
              background: '#1a1614',
              color: '#e2ddd5',
              fontSize: '15px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '24px' }}>{option.emoji}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
