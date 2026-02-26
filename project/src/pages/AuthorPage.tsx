import { useParams, useNavigate } from 'react-router-dom';
import { booksDatabase } from '../data/books';
import { seriesDatabase } from '../data/series';
import BookCover from '../components/BookCover';
import { ArrowLeft } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

export default function AuthorPage() {
  const { name } = useParams();
  const navigate = useNavigate();

  const authorName = decodeURIComponent(name || '');
  const authorBooks = booksDatabase.filter((b) => b.author === authorName);

  if (authorBooks.length === 0) {
    return (
      <div
        className="max-w-lg mx-auto px-4 pt-12"
        style={{ textAlign: 'center' }}
      >
        <p style={{ color: muted }}>No books found for this author</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            color: accent,
            marginTop: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← go back
        </button>
      </div>
    );
  }

  const seriesMap: Record<string, typeof authorBooks> = {};
  const standalones: typeof authorBooks = [];

  authorBooks.forEach((book) => {
    if (book.series) {
      if (!seriesMap[book.series]) seriesMap[book.series] = [];
      seriesMap[book.series].push(book);
    } else {
      standalones.push(book);
    }
  });

  Object.values(seriesMap).forEach((books) => {
    books.sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0));
  });

  const totalBooks = authorBooks.length;
  const seriesCount = Object.keys(seriesMap).length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
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

      <div style={{ marginBottom: '24px' }}>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '24px',
            fontWeight: 700,
            color: '#e2ddd5',
            marginBottom: '4px',
          }}
        >
          ✍️ {authorName}
        </h1>
        <p style={{ fontSize: '13px', color: muted }}>
          {totalBooks} {totalBooks === 1 ? 'book' : 'books'} in our collection
          {seriesCount > 0 && ` · ${seriesCount} series`}
        </p>
      </div>

      {Object.entries(seriesMap).map(([seriesName, books]) => {
        const seriesInfo = seriesDatabase[seriesName];
        const totalInSeries = seriesInfo?.totalBooks;

        return (
          <div
            key={seriesName}
            style={{
              marginBottom: '20px',
              padding: '16px',
              borderRadius: '16px',
              background: '#1a1614',
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
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#e2ddd5',
                }}
              >
                📚 {seriesName}
              </h2>
              {totalInSeries && (
                <span style={{ fontSize: '12px', color: muted }}>
                  {books.length}/{totalInSeries} books
                </span>
              )}
            </div>

            {totalInSeries && (
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: '#2a2520',
                  overflow: 'hidden',
                  marginBottom: '14px',
                }}
              >
                <div
                  style={{
                    width: `${(books.length / totalInSeries) * 100}%`,
                    height: '100%',
                    borderRadius: '2px',
                    background:
                      books.length === totalInSeries ? '#6b9e7a' : accent,
                  }}
                />
              </div>
            )}

            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  marginBottom: '8px',
                  background: '#141010',
                  border: '1px solid #1e1a18',
                }}
              >
                <BookCover
                  src={book.cover}
                  title={book.title}
                  isbn={book.id}
                  width={50}
                  height={75}
                  borderRadius="6px"
                />
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: accent,
                        color: '#141010',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {book.seriesNumber || '?'}
                    </span>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#e2ddd5',
                        lineHeight: 1.3,
                      }}
                    >
                      {book.title}
                    </p>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '4px',
                      marginLeft: '30px',
                    }}
                  >
                    {book.pages && (
                      <span style={{ fontSize: '10px', color: muted }}>
                        {book.pages} pages
                      </span>
                    )}
                    {book.year && (
                      <span style={{ fontSize: '10px', color: muted }}>
                        · {book.year}
                      </span>
                    )}
                    {book.spice > 0 && (
                      <span style={{ fontSize: '10px', color: '#e74c3c' }}>
                        {'🌶️'.repeat(Math.min(book.spice, 5))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {totalInSeries && books.length < totalInSeries && (
              <p
                style={{
                  fontSize: '11px',
                  color: muted,
                  fontStyle: 'italic',
                  marginTop: '4px',
                  textAlign: 'center',
                }}
              >
                + {totalInSeries - books.length} more not in our collection yet
              </p>
            )}

            {seriesInfo && (
              <div style={{ marginTop: '8px', textAlign: 'center' }}>
                {seriesInfo.completed ? (
                  <span style={{ fontSize: '10px', color: '#6b9e7a' }}>
                    ✅ Series complete
                  </span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#c9a84c' }}>
                    ⏳ Ongoing series
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {standalones.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: '#1a1614',
            border: '1px solid #2a2520',
          }}
        >
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '16px',
              fontWeight: 700,
              color: '#e2ddd5',
              marginBottom: '12px',
            }}
          >
            📖 Standalones
          </h2>

          {standalones.map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/book/${book.id}`)}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '10px',
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '8px',
                background: '#141010',
                border: '1px solid #1e1a18',
              }}
            >
              <BookCover
                src={book.cover}
                title={book.title}
                isbn={book.id}
                width={50}
                height={75}
                borderRadius="6px"
              />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#e2ddd5',
                  }}
                >
                  {book.title}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {book.pages && (
                    <span style={{ fontSize: '10px', color: muted }}>
                      {book.pages} pages
                    </span>
                  )}
                  {book.year && (
                    <span style={{ fontSize: '10px', color: muted }}>
                      · {book.year}
                    </span>
                  )}
                  {book.spice > 0 && (
                    <span style={{ fontSize: '10px', color: '#e74c3c' }}>
                      {'🌶️'.repeat(Math.min(book.spice, 5))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
