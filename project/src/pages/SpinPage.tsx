import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/LibraryContext';
import { useBooks } from '../hooks/BooksContext';
import BookCover from '../components/BookCover';
import {
  RotateCcw,
  BookOpen,
  Star,
  Shuffle,
  Plus,
  Library,
} from 'lucide-react';

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

type Source = 'my-tbr' | 'all-new';

export default function SpinPage() {
  const { books: booksDatabase } = useBooks();
  const navigate = useNavigate();
  const { library, addToLibrary } = useLibrary();
  const [result, setResult] = useState<{
    title: string;
    author: string;
    cover: string;
    id: string;
    spice?: number;
    rating?: number;
  } | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [source, setSource] = useState<Source>('my-tbr');
  const [tbrJoke, setTbrJoke] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const tbrBooks = library.filter((b) => b.status === 'want-to-read');
  const readIds = new Set(library.map((b) => b.bookId));
  const newBooks = booksDatabase.filter((b) => !readIds.has(b.id));

  const isInLibrary = (bookId: string) =>
    library.some((b) => b.bookId === bookId);
  const getLibraryStatus = (bookId: string) => {
    const lb = library.find((b) => b.bookId === bookId);
    return lb?.status;
  };

  const getPool = (): {
    title: string;
    author: string;
    cover: string;
    id: string;
    spice?: number;
    rating?: number;
  }[] => {
    if (source === 'my-tbr') {
      return tbrBooks.map((b) => {
        const full = booksDatabase.find((fb) => fb.id === b.bookId);
        return {
          title: b.title,
          author: b.author,
          cover: b.cover,
          id: b.bookId,
          spice: full?.spice,
          rating: full?.rating,
        };
      });
    }
    return newBooks.map((b) => ({
      title: b.title,
      author: b.author,
      cover: b.cover,
      id: b.id,
      spice: b.spice,
      rating: b.rating,
    }));
  };

  const handleAddToTBR = () => {
    if (!result) return;
    const fullBook = booksDatabase.find((b) => b.id === result.id);
    addToLibrary({
      bookId: result.id,
      title: result.title,
      author: result.author,
      cover: result.cover,
      status: 'want-to-read',
      totalPages: fullBook?.pages || 0,
      currentPage: 0,
    });
    const joke = TBR_JOKES[Math.floor(Math.random() * TBR_JOKES.length)];
    setTbrJoke(joke);
    setJustAdded(true);
  };

  const spin = () => {
    const pool = getPool();
    if (pool.length === 0) return;

    setSpinning(true);
    setResult(null);
    setTbrJoke(null);
    setJustAdded(false);

    let count = 0;
    const maxFlips = 15;

    const interval = setInterval(() => {
      const random = pool[Math.floor(Math.random() * pool.length)];
      setResult(random);
      count++;
      if (count >= maxFlips) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 100 + count * 25);
  };

  const pool = getPool();
  const isEmpty = pool.length === 0;

  const renderSmartButtons = () => {
    if (!result || spinning) return null;

    const inLib = isInLibrary(result.id);
    const status = getLibraryStatus(result.id);

    if (justAdded) {
      return (
        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <div
            style={{
              padding: '10px 24px',
              borderRadius: '20px',
              background: '#1e3a1e',
              color: '#2ecc71',
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ✅ Added to TBR!
          </div>
          {tbrJoke && (
            <p
              style={{
                fontSize: '11px',
                color: accent,
                marginTop: '8px',
                fontStyle: 'italic',
              }}
            >
              {tbrJoke}
            </p>
          )}
          <button
            onClick={() => navigate(`/book/${result.id}`)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: '1px solid #2a2520',
              cursor: 'pointer',
              background: 'transparent',
              color: muted,
              fontWeight: 600,
              fontSize: '11px',
              marginTop: '8px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <BookOpen size={12} /> View Book
          </button>
        </div>
      );
    }

    if (inLib) {
      const isReading = status === 'reading';
      const isDone = status === 'finished' || status === 'read-before';
      const isWant = status === 'want-to-read';

      return (
        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              marginBottom: '10px',
              background: isReading
                ? '#1e3a1e'
                : isDone
                ? '#1a2a3a'
                : '#2a2520',
              fontSize: '10px',
              fontWeight: 600,
              color: isReading ? '#2ecc71' : isDone ? '#3498db' : accent,
            }}
          >
            {isReading
              ? '📖 Currently Reading'
              : isDone
              ? '✅ Already Read'
              : isWant
              ? '✨ On your TBR'
              : '📚 In Library'}
          </div>

          <div
            style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
          >
            <button
              onClick={() => navigate(`/library/${result.id}`)}
              style={{
                padding: '10px 24px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                background: isReading ? '#2ecc71' : accent,
                color: '#141010',
                fontWeight: 600,
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Library size={12} />
              {isReading
                ? 'Continue Reading'
                : isDone
                ? 'View in Library'
                : 'Go to Library'}
            </button>
          </div>

          {isDone && (
            <p style={{ fontSize: '10px', color: muted, marginTop: '6px' }}>
              You've read this one! Great taste 👏
            </p>
          )}
        </div>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginTop: '14px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleAddToTBR}
          style={{
            padding: '10px 24px',
            borderRadius: '20px',
            border: 'none',
            cursor: 'pointer',
            background: accent,
            color: '#141010',
            fontWeight: 600,
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={14} /> Add to TBR
        </button>
        <button
          onClick={() => navigate(`/book/${result.id}`)}
          style={{
            padding: '10px 24px',
            borderRadius: '20px',
            border: '1px solid #2a2520',
            cursor: 'pointer',
            background: 'transparent',
            color: muted,
            fontWeight: 600,
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <BookOpen size={12} /> View Book
        </button>
      </div>
    );
  };

  return (
    <div
      className="max-w-lg mx-auto px-4 pt-8 pb-28"
      style={{ textAlign: 'center' }}
    >
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: 700,
          color: '#e2ddd5',
        }}
      >
        Spin a Book
      </h1>
      <p
        style={{
          color: muted,
          fontSize: '13px',
          marginTop: '4px',
          marginBottom: '20px',
        }}
      >
        can't decide? let fate choose
      </p>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => {
            setSource('my-tbr');
            setResult(null);
            setTbrJoke(null);
            setJustAdded(false);
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '25px',
            fontSize: '12px',
            border: 'none',
            cursor: 'pointer',
            background: source === 'my-tbr' ? accent : '#1e1a18',
            color: source === 'my-tbr' ? '#141010' : muted,
            fontWeight: source === 'my-tbr' ? 700 : 400,
          }}
        >
          📚 My TBR ({tbrBooks.length})
        </button>
        <button
          onClick={() => {
            setSource('all-new');
            setResult(null);
            setTbrJoke(null);
            setJustAdded(false);
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '25px',
            fontSize: '12px',
            border: 'none',
            cursor: 'pointer',
            background: source === 'all-new' ? accent : '#1e1a18',
            color: source === 'all-new' ? '#141010' : muted,
            fontWeight: source === 'all-new' ? 700 : 400,
          }}
        >
          ✨ Discover New ({newBooks.length})
        </button>
      </div>

      <div
        style={{
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          borderRadius: '20px',
          background: '#1a1614',
          marginBottom: '24px',
          border: spinning ? `1px solid ${accent}` : '1px solid #2a2520',
        }}
      >
        {isEmpty && !result && (
          <div>
            <Shuffle
              size={40}
              color="#2a2520"
              style={{ margin: '0 auto 16px' }}
            />
            {source === 'my-tbr' ? (
              <>
                <p
                  style={{
                    color: muted,
                    fontSize: '14px',
                    marginBottom: '12px',
                  }}
                >
                  Your TBR is empty!
                </p>
                <p
                  style={{
                    color: '#3a3530',
                    fontSize: '12px',
                    marginBottom: '16px',
                  }}
                >
                  Add books from Home or Search first
                </p>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    background: accent,
                    color: '#141010',
                    fontWeight: 600,
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={14} /> Browse Books
                </button>
              </>
            ) : (
              <p style={{ color: muted, fontSize: '14px' }}>
                You've added all books! 🎉
              </p>
            )}
          </div>
        )}

        {!isEmpty && !result && !spinning && (
          <div>
            <Shuffle
              size={48}
              color="#2a2520"
              style={{ margin: '0 auto 16px' }}
            />
            <p style={{ color: muted, fontSize: '14px' }}>
              {source === 'my-tbr'
                ? `${pool.length} books in your TBR`
                : `${pool.length} new books to discover`}
            </p>
          </div>
        )}

        {result && (
          <div
            style={{
              opacity: spinning ? 0.5 : 1,
              transition: 'opacity 0.15s',
              transform: spinning ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            <BookCover
              src={result.cover}
              title={result.title}
              isbn={result.id}
              width={130}
              height={195}
              borderRadius="10px"
              style={{
                boxShadow: spinning
                  ? 'none'
                  : '0 4px 30px rgba(196,160,124,0.15)',
                margin: '0 auto 14px',
              }}
            />
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#e2ddd5',
              }}
            >
              {result.title}
            </h2>
            <p style={{ fontSize: '13px', color: muted, marginTop: '2px' }}>
              {result.author}
            </p>

            {!spinning && (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '8px',
                  }}
                >
                  {result.spice && result.spice > 0 && (
                    <span style={{ fontSize: '12px' }}>
                      {'🌶️'.repeat(result.spice)}
                    </span>
                  )}
                  {result.rating && (
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
                      {result.rating}
                    </span>
                  )}
                </div>
                {renderSmartButtons()}
              </>
            )}
          </div>
        )}
      </div>

      {!isEmpty && (
        <button
          onClick={spin}
          disabled={spinning}
          style={{
            padding: '16px 48px',
            borderRadius: '30px',
            border: 'none',
            cursor: spinning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 700,
            background: spinning ? '#2a2520' : accent,
            color: spinning ? muted : '#141010',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RotateCcw size={18} className={spinning ? 'animate-spin' : ''} />
          {spinning ? 'Spinning...' : 'SPIN!'}
        </button>
      )}
    </div>
  );
}
