import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooks } from '../hooks/BooksContext';
import { useFavorites } from '../hooks/useFavorites';
import { useLibrary } from '../hooks/LibraryContext';
import { seriesDatabase } from '../data/series';
import { ArrowLeft, BookOpen, Camera, ShoppingCart } from 'lucide-react';
import BookCover from '../components/BookCover';
import CoverChanger from '../components/CoverChanger';
import BookArtGallery from '../components/BookArtGallery';

const accent = '#c4a07c';
const muted = '#5c5450';

export default function BookPage() {
  const { books: booksDatabase } = useBooks();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { addToLibrary, isInLibrary, library } = useLibrary();
  const [showCoverChanger, setShowCoverChanger] = useState(false);
  const [overrideSrc, setOverrideSrc] = useState<string | null>(null);

  const book = booksDatabase.find((b) => b.id === id);

  useEffect(() => {
    setOverrideSrc(null);
  }, [id]);

  if (!book) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12" style={{ textAlign: 'center' }}>
        <p style={{ color: muted }}>Book not found</p>
      </div>
    );
  }

  const coverSrc = overrideSrc ?? book.cover;

  const similar = booksDatabase.filter((b) => book.similar?.includes(b.title));
  const fav = isFavorite(book.id);
  const inLib = isInLibrary(book.id);

  const seriesBooks = book.series
    ? booksDatabase
        .filter((b) => b.series === book.series)
        .sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0))
    : [];
  const seriesInfo = book.series ? seriesDatabase[book.series] : null;
  const totalInSeries = seriesInfo?.totalBooks || seriesBooks.length;
  const ownedInSeries = seriesBooks.filter((b) => isInLibrary(b.id)).length;

  const authorBooks = booksDatabase.filter(
    (b) =>
      b.author === book.author &&
      b.id !== book.id &&
      !(book.series && b.series === book.series)
  );

  const libraryBook = library.find((b) => b.bookId === book.id);
  const isWishlist = libraryBook?.status === 'wishlist';

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
      <button
        onClick={() => navigate(-1)}
        style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '120px', flexShrink: 0 }}>
          <BookCover
            src={coverSrc}
            title={book.title}
            author={book.author}
            bookId={book.id}
            width={120}
            height={180}
            borderRadius="10px"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
          />
          <button
            onClick={() => setShowCoverChanger(true)}
            style={{
              background: 'rgba(196,168,130,0.15)',
              border: '1px solid rgba(196,168,130,0.3)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: accent,
              fontSize: '10px',
              cursor: 'pointer',
              marginTop: '8px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Camera size={10} />
            Change Cover
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '24px',
              fontWeight: 700,
              color: '#e2ddd5',
              lineHeight: 1.2,
            }}
          >
            {book.title}
          </h1>
          <p
            onClick={() => navigate(`/author/${encodeURIComponent(book.author)}`)}
            style={{
              fontSize: '13px',
              color: muted,
              marginTop: '4px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(92,84,80,0.4)',
              textUnderlineOffset: '2px',
            }}
          >
            {book.author} →
          </p>
          {book.series && (
            <p style={{ fontSize: '11px', color: accent, marginTop: '4px' }}>
              {book.series} #{book.seriesNumber}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {book.spice > 0 && (
              <span style={{ fontSize: '11px' }}>{'🌶️'.repeat(book.spice)}</span>
            )}
            {book.pages && (
              <span style={{ fontSize: '11px', color: muted }}>{book.pages} pages</span>
            )}
            {book.year && (
              <span style={{ fontSize: '11px', color: muted }}>{book.year}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (!inLib) addToLibrary(book);
                navigate(`/library/${book.id}`);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                background: inLib ? '#1e1a18' : accent,
                color: inLib ? accent : '#141010',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BookOpen size={14} />
              {inLib ? 'Open in Library' : 'Add to Library'}
            </button>

            {!inLib && (
              <button
                onClick={() =>
                  addToLibrary({ ...book, id: book.id, pages: book.pages, status: 'wishlist' })
                }
                style={{
                  padding: '10px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#1e1a18',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: muted,
                }}
              >
                <ShoppingCart size={12} /> Wishlist
              </button>
            )}

            {isWishlist && (
              <span
                style={{
                  padding: '10px 14px',
                  borderRadius: '20px',
                  background: 'rgba(196,160,124,0.1)',
                  fontSize: '11px',
                  color: accent,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                🛒 On Wishlist
              </span>
            )}

          </div>
        </div>
      </div>

      {/* Vibes */}
      {book.vibes && book.vibes.length > 0 && (
        <div
          style={{
            background: '#1a1614',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #2a2520',
          }}
        >
          <h3
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '12px',
            }}
          >
            ✨ Why You'll Love This
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {book.vibes.map((vibe, i) => (
              <p
                key={i}
                style={{
                  fontSize: '13px',
                  color: '#c4beb6',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  paddingLeft: '12px',
                  borderLeft: `2px solid ${accent}33`,
                }}
              >
                {vibe}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {book.description && (
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '8px',
            }}
          >
            About
          </h3>
          <p style={{ fontSize: '13px', color: '#a09a90', lineHeight: 1.7 }}>
            {book.description}
          </p>
        </div>
      )}

      <BookArtGallery
        bookId={book.id}
        bookTitle={book.title}
        bookAuthor={book.author}
        series={book.series}
      />

      {/* Tropes */}
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '8px',
          }}
        >
          Tropes
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {book.tropes.map((t) => (
            <span
              key={t}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: '#1e1a18',
                fontSize: '11px',
                color: '#e2ddd5',
              }}
            >
              {t.split('-').join(' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '8px',
          }}
        >
          Mood
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {book.mood.map((m) => (
            <span
              key={m}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: '#1a1614',
                fontSize: '11px',
                color: muted,
              }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Series Collection */}
      {book.series && seriesBooks.length > 0 && (
        <div
          style={{
            background: '#1a1614',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #2a2520',
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
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              📖 {book.series} Collection
            </h3>
            <span style={{ fontSize: '10px', color: muted }}>
              {ownedInSeries}/{totalInSeries} collected
            </span>
          </div>

          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: '#2a2520',
              marginBottom: '14px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(ownedInSeries / totalInSeries) * 100}%`,
                height: '100%',
                borderRadius: '3px',
                background: ownedInSeries === totalInSeries ? '#6b9e7a' : accent,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          {ownedInSeries === totalInSeries && totalInSeries > 0 && (
            <p
              style={{
                fontSize: '11px',
                color: '#6b9e7a',
                marginBottom: '10px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              🎉 Complete collection! You have them all!
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: '8px',
            }}
          >
            {Array.from({ length: totalInSeries }, (_, i) => {
              const num = i + 1;
              const seriesBook = seriesBooks.find((b) => b.seriesNumber === num);
              const owned = seriesBook && isInLibrary(seriesBook.id);
              const isCurrent = seriesBook?.id === book.id;

              if (seriesBook) {
                return (
                  <div
                    key={num}
                    onClick={() => navigate(`/book/${seriesBook.id}`)}
                    style={{ cursor: 'pointer', textAlign: 'center', opacity: owned ? 1 : 0.5 }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        border: isCurrent ? `2px solid ${accent}` : '2px solid transparent',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <BookCover
                        src={seriesBook.cover}
                        title={seriesBook.title}
                        bookId={seriesBook.id}
                        width={56}
                        height={80}
                        borderRadius="4px"
                      />
                      {owned && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: '#6b9e7a',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            color: 'white',
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '8px',
                        color: isCurrent ? accent : muted,
                        marginTop: '2px',
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      #{num}
                    </p>
                  </div>
                );
              }

              return (
                <div key={num} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '80px',
                      borderRadius: '6px',
                      border: '2px dashed #2a2520',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      background: '#141010',
                    }}
                  >
                    <span style={{ fontSize: '16px', color: '#2a2520' }}>?</span>
                  </div>
                  <p style={{ fontSize: '8px', color: '#2a2520', marginTop: '2px' }}>#{num}</p>
                </div>
              );
            })}
          </div>

          {seriesInfo && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              {seriesInfo.completed ? (
                <span style={{ fontSize: '10px', color: '#6b9e7a' }}>
                  ✅ Series complete · {totalInSeries} books
                </span>
              ) : (
                <div>
                  <span style={{ fontSize: '10px', color: '#c9a84c' }}>
                    ⏳ Ongoing series · {seriesBooks.length} of {totalInSeries || '?'} released
                  </span>
                  {seriesInfo.joke && (
                    <p
                      style={{
                        fontSize: '10px',
                        color: muted,
                        fontStyle: 'italic',
                        marginTop: '4px',
                      }}
                    >
                      {seriesInfo.joke}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* More by Author */}
      {authorBooks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '10px',
            }}
          >
            ✍️ More by {book.author}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {authorBooks.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/book/${a.id}`)}
                className="flex-shrink-0"
                style={{ width: '80px', cursor: 'pointer' }}
              >
                <BookCover
                  src={a.cover}
                  title={a.title}
                  author={a.author}
                  bookId={a.id}
                  width={80}
                  height={112}
                  borderRadius="8px"
                />
                <p style={{ fontSize: '10px', color: muted, marginTop: '4px' }} className="truncate">
                  {a.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '10px',
            }}
          >
            💡 You might also like
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {similar.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/book/${s.id}`)}
                className="flex-shrink-0"
                style={{ width: '80px', cursor: 'pointer' }}
              >
                <BookCover
                  src={s.cover}
                  title={s.title}
                  author={s.author}
                  bookId={s.id}
                  width={80}
                  height={112}
                  borderRadius="8px"
                />
                <p style={{ fontSize: '10px', color: muted, marginTop: '4px' }} className="truncate">
                  {s.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCoverChanger && (
        <CoverChanger
          bookId={book.id}
          bookTitle={book.title}
          bookAuthor={book.author}
          onChanged={(newUrl) => {
            setOverrideSrc(newUrl);
            setShowCoverChanger(false);
          }}
          onClose={() => setShowCoverChanger(false)}
        />
      )}
    </div>
  );
}
