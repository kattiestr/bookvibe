import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/LibraryContext';
import type { ReadingStatus } from '../hooks/LibraryContext';
import { useBooks } from '../hooks/BooksContext';
import { seriesDatabase } from '../data/series';
import { BookOpen, Clock, Star } from 'lucide-react';
import BookCover from '../components/BookCover';

const accent = '#c4a07c';
const muted = '#5c5450';

type ViewMode = 'library' | 'wishlist';
type FilterKey = ReadingStatus | 'all' | 'tbr-list';

const LIBRARY_TABS: { key: FilterKey; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '📚' },
  { key: 'reading', label: 'Reading', emoji: '📖' },
  { key: 'tbr-list', label: 'TBR', emoji: '📋' },
  { key: 'want-to-read', label: 'Unread', emoji: '✨' },
  { key: 'on-hold', label: 'Paused', emoji: '⏸️' },
  { key: 'finished', label: 'Done', emoji: '🏆' },
  { key: 'read-before', label: 'Past', emoji: '📚' },
  { key: 'dnf', label: 'DNF', emoji: '💀' },
];

const collectionJokes = [
  "Almost there... your wallet isn't ready 💸",
  'So close! The bookshelf is waiting 📚',
  "Your credit card: 'not again...' 💳",
  'One does not simply stop collecting ✨',
  'The TBR pile sends its regards 📖',
];

function getCollectionJoke(owned: number, total: number): string {
  if (owned === total) return "🎉 Complete! You're a legend!";
  if (owned === total - 1) return 'Just ONE more... you can do it! 🏃‍♀️';
  if (owned >= total / 2)
    return collectionJokes[owned % collectionJokes.length];
  return 'The journey of a thousand books begins with one 🌟';
}

function getTBRBookIds(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem('tbr-lists') || '[]');
    if (saved.length === 0) return [];
    return saved[0].books.map((b: any) => b.bookId);
  } catch {
    return [];
  }
}

function getTBRInfo(): { period: string; date: string; count: number } | null {
  try {
    const saved = JSON.parse(localStorage.getItem('tbr-lists') || '[]');
    if (saved.length === 0) return null;
    const latest = saved[0];
    return {
      period: latest.period === 'week' ? 'Weekly' : 'Monthly',
      date: new Date(latest.createdAt).toLocaleDateString(),
      count: latest.books.length,
    };
  } catch {
    return null;
  }
}

export default function LibraryPage() {
  const { books: booksDatabase } = useBooks();
  const navigate = useNavigate();
  const { library, getStats, updateBook } = useLibrary();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('library-scroll');
    if (saved) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(saved));
      }, 100);
    }
  }, []);

  const saveScrollAndNavigate = (path: string) => {
    sessionStorage.setItem('library-scroll', window.scrollY.toString());
    navigate(path);
  };

  const libraryBooks = library.filter((b) => b.status !== 'wishlist');
  const wishlistBooks = library.filter((b) => b.status === 'wishlist');
  const tbrBookIds = getTBRBookIds();
  const tbrInfo = getTBRInfo();

  const getFiltered = () => {
    if (filter === 'all') return libraryBooks;
    if (filter === 'tbr-list')
      return libraryBooks.filter((b) => tbrBookIds.includes(b.bookId));
    return libraryBooks.filter((b) => b.status === filter);
  };

  const filtered = getFiltered();
  const reading = libraryBooks.filter((b) => b.status === 'reading').length;
  const finished = libraryBooks.filter(
    (b) => b.status === 'finished' || b.status === 'read-before'
  ).length;

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const handleBought = (bookId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateBook(bookId, { status: 'want-to-read' });
  };

  const getDnfReason = (bookId: string): string => {
    try {
      return localStorage.getItem(`dnf-reason-${bookId}`) || '';
    } catch {
      return '';
    }
  };

  const getActualCover = (bookId: string, fallback: string) =>
    booksDatabase.find((db) => db.id === bookId)?.cover || fallback;

  const groupBooks = (books: typeof filtered) => {
    const seriesMap: Record<string, typeof filtered> = {};
    const standalone: typeof filtered = [];
    books.forEach((book) => {
      const dbBook = booksDatabase.find((b) => b.id === book.bookId);
      if (dbBook?.series) {
        if (!seriesMap[dbBook.series]) seriesMap[dbBook.series] = [];
        seriesMap[dbBook.series].push(book);
      } else {
        standalone.push(book);
      }
    });
    Object.keys(seriesMap).forEach((series) => {
      seriesMap[series].sort((a, b) => {
        const aBook = booksDatabase.find((x) => x.id === a.bookId);
        const bBook = booksDatabase.find((x) => x.id === b.bookId);
        return (aBook?.seriesNumber || 0) - (bBook?.seriesNumber || 0);
      });
    });
    return { seriesMap, standalone };
  };

  const { seriesMap, standalone } = groupBooks(filtered);

  const renderBookCard = (book: (typeof filtered)[0]) => {
    const stats = getStats(book.bookId);
    const progress = stats?.progress || 0;
    const isDnf = book.status === 'dnf';
    const dnfReason = isDnf ? getDnfReason(book.bookId) : '';

    return (
      <div
        key={book.bookId}
        onClick={() => saveScrollAndNavigate(`/library/${book.bookId}`)}
        style={{
          display: 'flex',
          gap: '14px',
          padding: '14px',
          borderRadius: '14px',
          background: '#1a1614',
          cursor: 'pointer',
          border: isDnf
            ? '1px solid rgba(107,64,64,0.3)'
            : '1px solid transparent',
        }}
      >
        <BookCover
          src={getActualCover(book.bookId, book.cover)}
          title={book.title}
          bookId={book.bookId}
          width={56}
          height={84}
          borderRadius="8px"
          style={{ flexShrink: 0, opacity: isDnf ? 0.6 : 1 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '15px',
              fontWeight: 600,
              color: '#e2ddd5',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {book.title}
          </h3>
          <p style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>
            {book.author}
          </p>
          {isDnf && dnfReason && (
            <p
              style={{
                fontSize: '10px',
                color: '#b05050',
                marginTop: '6px',
                fontStyle: 'italic',
                lineHeight: 1.4,
              }}
            >
              💀 "{dnfReason}"
            </p>
          )}
          {!isDnf && (
            <>
              <div
                style={{
                  marginTop: '8px',
                  height: '4px',
                  borderRadius: '2px',
                  background: '#2a2520',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    borderRadius: '2px',
                    background: progress === 100 ? '#6b9e7a' : accent,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '6px',
                }}
              >
                <span style={{ fontSize: '10px', color: muted }}>
                  {book.currentPage}/{book.totalPages} pages
                </span>
                <span style={{ fontSize: '10px', color: accent }}>
                  {progress}%
                </span>
                {book.rating > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: '#c9a84c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Star size={8} fill="#c9a84c" color="#c9a84c" />
                    {book.rating}/10
                  </span>
                )}
                {stats && stats.totalMinutes > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: muted,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Clock size={8} />
                    {formatTime(stats.totalMinutes)}
                  </span>
                )}
              </div>
            </>
          )}
          {tbrBookIds.includes(book.bookId) && filter !== 'tbr-list' && (
            <span
              style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '9px',
                padding: '2px 8px',
                borderRadius: '8px',
                background: 'rgba(196,160,124,0.1)',
                color: accent,
                border: `1px solid ${accent}33`,
              }}
            >
              📋 In your TBR
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderSeriesGroup = (seriesName: string, books: typeof filtered) => {
    const seriesInfo = seriesDatabase[seriesName];
    const allSeriesBooks = booksDatabase.filter((b) => b.series === seriesName);
    const totalInSeries = seriesInfo?.totalBooks || allSeriesBooks.length;
    const ownedInSeries = allSeriesBooks.filter((b) =>
      libraryBooks.some((lb) => lb.bookId === b.id)
    ).length;
    const isComplete = ownedInSeries === totalInSeries && totalInSeries > 0;
    const isExpanded = expandedSeries === seriesName;

    const topBook = books[0];
    const secondBook = books[1];
    const thirdBook = books[2];

    return (
      <div key={seriesName} style={{ marginBottom: '20px' }}>

        {/* СВЁРНУТЫЙ ВИД — стопка обложек */}
        <div
          onClick={() =>
            setExpandedSeries(isExpanded ? null : seriesName)
          }
          style={{ cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
        >
          {/* Стопка обложек */}
          <div style={{ position: 'relative', width: '95px', height: '135px', flexShrink: 0 }}>

            {/* Третья книга (самая дальняя) */}
            {thirdBook && (
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '8px',
                borderRadius: '8px',
                overflow: 'hidden',
                opacity: 0.45,
                transform: 'rotate(4deg)',
                width: '78px',
                height: '117px',
              }}>
                <BookCover
                  src={getActualCover(thirdBook.bookId, thirdBook.cover)}
                  title={thirdBook.title}
                  bookId={thirdBook.bookId}
                  width={78}
                  height={117}
                  borderRadius="8px"
                />
              </div>
            )}

            {/* Вторая книга */}
            {secondBook && (
              <div style={{
                position: 'absolute',
                left: '6px',
                top: '4px',
                borderRadius: '8px',
                overflow: 'hidden',
                opacity: 0.7,
                transform: 'rotate(2deg)',
                width: '81px',
                height: '121px',
              }}>
                <BookCover
                  src={getActualCover(secondBook.bookId, secondBook.cover)}
                  title={secondBook.title}
                  bookId={secondBook.bookId}
                  width={81}
                  height={121}
                  borderRadius="8px"
                />
              </div>
            )}

            {/* Первая книга (верхняя) */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '84px',
              height: '126px',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            }}>
              <BookCover
                src={getActualCover(topBook.bookId, topBook.cover)}
                title={topBook.title}
                bookId={topBook.bookId}
                width={84}
                height={126}
                borderRadius="8px"
              />
              {isComplete && (
                <div style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  background: '#6b9e7a',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                }}>✓</div>
              )}
            </div>

            {/* Счётчик книг */}
            {books.length > 1 && (
              <div style={{
                position: 'absolute',
                bottom: 2,
                right: 0,
                background: isComplete ? '#6b9e7a' : accent,
                borderRadius: '10px',
                padding: '2px 7px',
                fontSize: '10px',
                fontWeight: 700,
                color: '#141010',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}>
                {books.length}
              </div>
            )}
          </div>

          {/* Инфо о серии */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: '4px' }}>
            <h3 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '15px',
              fontWeight: 700,
              color: '#e2ddd5',
              marginBottom: '3px',
              lineHeight: 1.2,
            }}>
              {seriesName}
            </h3>
            <p style={{
              fontSize: '11px',
              color: muted,
              marginBottom: '10px',
            }}>
              {topBook.author}
            </p>

            {/* Прогресс бар */}
            <div style={{
              height: '4px',
              borderRadius: '2px',
              background: '#2a2520',
              overflow: 'hidden',
              marginBottom: '6px',
            }}>
              <div style={{
                width: `${(ownedInSeries / totalInSeries) * 100}%`,
                height: '100%',
                borderRadius: '2px',
                background: isComplete ? '#6b9e7a' : accent,
                transition: 'width 0.5s ease',
              }} />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <p style={{
                fontSize: '10px',
                color: isComplete ? '#6b9e7a' : muted,
                fontStyle: 'italic',
              }}>
                {getCollectionJoke(ownedInSeries, totalInSeries)}
              </p>
              <span style={{
                fontSize: '10px',
                color: isComplete ? '#6b9e7a' : accent,
                fontWeight: 600,
                flexShrink: 0,
                marginLeft: '8px',
              }}>
                {ownedInSeries}/{totalInSeries}
              </span>
            </div>

            <p style={{
              fontSize: '10px',
              color: accent,
              opacity: 0.8,
            }}>
              {isExpanded ? '▲ collapse' : '▼ see books'}
            </p>
          </div>
        </div>

        {/* РАСКРЫТЫЙ ВИД */}
        {isExpanded && (
          <div style={{
            marginTop: '14px',
            padding: '16px',
            borderRadius: '16px',
            background: '#1e1a18',
            border: isComplete
              ? '1px solid rgba(107,158,122,0.3)'
              : '1px solid #2a2520',
          }}>

            {/* Нумерация книг серии */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '14px',
                overflowX: 'auto',
              }}
              className="scrollbar-hide"
            >
              {Array.from({ length: totalInSeries }, (_, i) => {
                const num = i + 1;
                const seriesBook = allSeriesBooks.find(
                  (b) => b.seriesNumber === num
                );
                const owned =
                  seriesBook &&
                  libraryBooks.some((lb) => lb.bookId === seriesBook.id);
                const inFiltered =
                  seriesBook && books.some((b) => b.bookId === seriesBook.id);
                return (
                  <div
                    key={num}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (seriesBook && owned)
                        saveScrollAndNavigate(`/library/${seriesBook.id}`);
                      else if (seriesBook)
                        saveScrollAndNavigate(`/book/${seriesBook.id}`);
                    }}
                    style={{
                      width: '28px',
                      height: '40px',
                      borderRadius: '4px',
                      background: owned
                        ? inFiltered
                          ? accent
                          : 'rgba(107,158,122,0.3)'
                        : '#141010',
                      border: owned
                        ? '1px solid transparent'
                        : '1px dashed #2a2520',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      color: owned ? '#141010' : '#2a2520',
                      fontWeight: 700,
                      cursor: seriesBook ? 'pointer' : 'default',
                      flexShrink: 0,
                    }}
                  >
                    {num}
                  </div>
                );
              })}
            </div>

            {/* Обложки книг */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '4px',
              }}
              className="scrollbar-hide"
            >
              {books.map((book) => {
                const stats = getStats(book.bookId);
                const progress = stats?.progress || 0;
                return (
                  <div
                    key={book.bookId}
                    onClick={(e) => {
                      e.stopPropagation();
                      saveScrollAndNavigate(`/library/${book.bookId}`);
                    }}
                    style={{ flexShrink: 0, width: '85px', cursor: 'pointer' }}
                  >
                    <div style={{ position: 'relative' }}>
                      <BookCover
                        src={getActualCover(book.bookId, book.cover)}
                        title={book.title}
                        bookId={book.bookId}
                        width={85}
                        height={127}
                        borderRadius="8px"
                      />
                      {progress > 0 && progress < 100 && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          borderRadius: '0 0 8px 8px',
                          background: '#2a2520',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: accent,
                          }} />
                        </div>
                      )}
                      {progress === 100 && (
                        <div style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: '#6b9e7a',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                        }}>✓</div>
                      )}
                    </div>
                    <p style={{
                      fontSize: '10px',
                      color: '#e2ddd5',
                      marginTop: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}>
                      {book.seriesNumber ? `#${book.seriesNumber}` : book.title}
                    </p>
                    <p style={{ fontSize: '9px', color: muted, textAlign: 'center' }}>
                      {progress}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ====== TBR VIEW ======
  const renderTBRView = () => {
    if (tbrBookIds.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: '36px', marginBottom: '12px' }}>📋</p>
          <p style={{ color: '#e2ddd5', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            No TBR list yet
          </p>
          <p style={{ color: muted, fontSize: '12px', marginBottom: '16px' }}>
            Build your reading plan for the week or month!
          </p>
          <button
            onClick={() => navigate('/tbr')}
            style={{
              padding: '12px 28px',
              borderRadius: '24px',
              border: 'none',
              cursor: 'pointer',
              background: accent,
              color: '#141010',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            📚 Build TBR
          </button>
        </div>
      );
    }

    const tbrLibBooks = tbrBookIds
      .map((id) => library.find((b) => b.bookId === id))
      .filter(Boolean);
    const doneCount = tbrLibBooks.filter(
      (b) => b && (b.status === 'finished' || b.status === 'read-before')
    ).length;
    const allDone = doneCount === tbrBookIds.length && tbrBookIds.length > 0;

    const funMessages = [
      '🔥 Crushed it!',
      '👑 Legend behavior!',
      '✨ Another one bites the dust!',
      '🎯 Nailed it!',
      '💅 Main character energy!',
      '🏆 Champion reader!',
    ];

    return (
      <div>
        <div style={{
          padding: '14px 16px',
          borderRadius: '14px',
          background: 'rgba(196,160,124,0.06)',
          border: `1px solid ${accent}33`,
          marginBottom: '14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#e2ddd5' }}>
                📋 {tbrInfo?.period || 'Weekly'} TBR
              </p>
              <p style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>
                Created {tbrInfo?.date} · {tbrBookIds.length} books
              </p>
            </div>
            <button
              onClick={() => navigate('/tbr')}
              style={{
                padding: '6px 14px',
                borderRadius: '16px',
                border: 'none',
                cursor: 'pointer',
                background: '#2a2520',
                color: muted,
                fontSize: '11px',
              }}
            >
              + New TBR
            </button>
          </div>
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '10px', color: muted }}>Progress</span>
              <span style={{
                fontSize: '10px',
                color: allDone ? '#6b9e7a' : accent,
                fontWeight: 600,
              }}>
                {doneCount}/{tbrBookIds.length}
              </span>
            </div>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              background: '#2a2520',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(doneCount / tbrBookIds.length) * 100}%`,
                height: '100%',
                borderRadius: '3px',
                background: allDone ? '#6b9e7a' : accent,
                transition: 'width 0.5s',
              }} />
            </div>
            {allDone && (
              <div style={{
                textAlign: 'center',
                marginTop: '12px',
                padding: '10px',
                borderRadius: '10px',
                background: 'rgba(107,158,122,0.1)',
              }}>
                <p style={{ fontSize: '24px', marginBottom: '4px' }}>🎉</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#6b9e7a' }}>
                  TBR Complete!
                </p>
                <p style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>
                  You crushed it! Ready for a new one?
                </p>
                <button
                  onClick={() => navigate('/tbr')}
                  style={{
                    marginTop: '8px',
                    padding: '8px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#6b9e7a',
                    color: '#141010',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                >
                  📚 Build new TBR
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tbrBookIds.map((bookId, index) => {
            const libBook = library.find((b) => b.bookId === bookId);
            if (!libBook) return null;
            const isRead = libBook.status === 'finished' || libBook.status === 'read-before';
            const isReading = libBook.status === 'reading';
            const stats = getStats(bookId);
            const progress = stats?.progress || 0;

            return (
              <div
                key={bookId}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '14px',
                  alignItems: 'center',
                  background: isRead ? 'rgba(107,158,122,0.06)' : '#1a1614',
                  border: isRead
                    ? '1px solid rgba(107,158,122,0.2)'
                    : isReading
                    ? `1px solid ${accent}33`
                    : '1px solid #2a2520',
                  opacity: isRead ? 0.85 : 1,
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: isRead ? '#6b9e7a' : isReading ? accent : '#2a2520',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isRead ? '14px' : '13px',
                  fontWeight: 700,
                  color: isRead || isReading ? '#141010' : muted,
                }}>
                  {isRead ? '✓' : index + 1}
                </div>
                <div
                  onClick={() => saveScrollAndNavigate(`/library/${bookId}`)}
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                >
                  <BookCover
                    src={getActualCover(bookId, libBook.cover)}
                    title={libBook.title}
                    bookId={bookId}
                    width={44}
                    height={66}
                    borderRadius="6px"
                    style={{ filter: isRead ? 'grayscale(0.3)' : 'none' }}
                  />
                </div>
                <div
                  onClick={() => saveScrollAndNavigate(`/library/${bookId}`)}
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isRead ? '#8a8a8a' : '#e2ddd5',
                    textDecoration: isRead ? 'line-through' : 'none',
                    textDecorationColor: '#6b9e7a',
                  }}>
                    {libBook.title}
                  </p>
                  <p style={{ fontSize: '10px', color: muted, marginTop: '1px' }}>
                    {libBook.author}
                  </p>
                  {isRead && (
                    <p style={{ fontSize: '10px', color: '#6b9e7a', marginTop: '4px', fontWeight: 600 }}>
                      {funMessages[index % funMessages.length]}
                    </p>
                  )}
                  {isReading && (
                    <div style={{ marginTop: '6px' }}>
                      <div style={{
                        height: '3px',
                        borderRadius: '2px',
                        background: '#2a2520',
                        overflow: 'hidden',
                        marginBottom: '3px',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          borderRadius: '2px',
                          background: accent,
                        }} />
                      </div>
                      <p style={{ fontSize: '9px', color: accent }}>
                        📖 Reading · {progress}%
                      </p>
                    </div>
                  )}
                  {!isRead && !isReading && (
                    <p style={{ fontSize: '9px', color: '#3a3530', marginTop: '4px' }}>
                      Waiting to be read...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ====== REGULAR LIST VIEW ======
  const renderRegularList = () => {
    if (filtered.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <BookOpen size={36} color={muted} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: muted, fontSize: '14px' }}>No books here yet</p>
          <p style={{ color: '#3a3530', fontSize: '12px', marginTop: '4px' }}>
            Add books from Home or Search
          </p>
        </div>
      );
    }

    return (
      <div>
        {Object.entries(seriesMap).map(([seriesName, books]) =>
          renderSeriesGroup(seriesName, books)
        )}
        {standalone.length > 0 && (
          <div>
            {Object.keys(seriesMap).length > 0 && (
              <h3 style={{
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: accent,
                marginBottom: '10px',
                marginTop: '8px',
              }}>
                📕 Standalone Books
              </h3>
            )}
            <div className="flex flex-col gap-3">
              {standalone.map((book) => renderBookCard(book))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-28">
      <h1 style={{
        fontFamily: 'Playfair Display, serif',
        fontSize: '32px',
        fontWeight: 700,
        color: '#e2ddd5',
      }}>
        My Library
      </h1>
      <p style={{
        color: muted,
        fontSize: '13px',
        marginTop: '4px',
        marginBottom: '20px',
      }}>
        track your reading journey
      </p>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-2 mb-6" style={{ textAlign: 'center' }}>
        {[
          { label: 'Books', value: libraryBooks.length, emoji: '📚' },
          { label: 'Reading', value: reading, emoji: '📖' },
          { label: 'Done', value: finished, emoji: '🏆' },
          { label: 'Wishlist', value: wishlistBooks.length, emoji: '🛒' },
        ].map((s) => (
          <div
            key={s.label}
            onClick={() => {
              if (s.label === 'Wishlist') setViewMode('wishlist');
              else setViewMode('library');
            }}
            style={{
              padding: '12px 8px',
              borderRadius: '12px',
              background: '#1a1614',
              cursor: 'pointer',
              border:
                (s.label === 'Wishlist' && viewMode === 'wishlist') ||
                (s.label !== 'Wishlist' && viewMode === 'library')
                  ? `1px solid ${accent}33`
                  : '1px solid transparent',
            }}
          >
            <span style={{ fontSize: '18px' }}>{s.emoji}</span>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#e2ddd5', marginTop: '4px' }}>
              {s.value}
            </p>
            <p style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Вкладки My Books / Wishlist */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '16px',
        background: '#1a1614',
        borderRadius: '14px',
        padding: '4px',
      }}>
        <button
          onClick={() => setViewMode('library')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            background: viewMode === 'library' ? accent : 'transparent',
            color: viewMode === 'library' ? '#141010' : muted,
          }}
        >
          📚 My Books
        </button>
        <button
          onClick={() => setViewMode('wishlist')}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            background: viewMode === 'wishlist' ? accent : 'transparent',
            color: viewMode === 'wishlist' ? '#141010' : muted,
          }}
        >
          🛒 Wishlist
          {wishlistBooks.length > 0 && (
            <span style={{
              marginLeft: '6px',
              background: viewMode === 'wishlist' ? '#141010' : accent,
              color: viewMode === 'wishlist' ? accent : '#141010',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
            }}>
              {wishlistBooks.length}
            </span>
          )}
        </button>
      </div>

      {viewMode === 'library' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
            {LIBRARY_TABS.map((tab) => {
              const count = tab.key === 'tbr-list' ? tbrBookIds.length : 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: 'none',
                    background: filter === tab.key ? accent : '#1e1a18',
                    color: filter === tab.key ? '#141010' : muted,
                    fontWeight: filter === tab.key ? 700 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {tab.emoji} {tab.label}
                  {tab.key === 'tbr-list' && count > 0 && (
                    <span style={{
                      background: filter === tab.key ? '#141010' : accent,
                      color: filter === tab.key ? accent : '#141010',
                      borderRadius: '8px',
                      padding: '1px 5px',
                      fontSize: '9px',
                      fontWeight: 700,
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {filter === 'tbr-list' ? renderTBRView() : renderRegularList()}
        </>
      )}

      {viewMode === 'wishlist' && (
        <>
          {wishlistBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <span style={{ fontSize: '36px' }}>🛒</span>
              <p style={{ color: muted, fontSize: '14px', marginTop: '12px' }}>
                Your wishlist is empty
              </p>
              <p style={{ color: '#3a3530', fontSize: '12px', marginTop: '4px' }}>
                Add books you want to buy from any book page
              </p>
            </div>
          ) : (
            <>
              <p style={{
                fontSize: '12px',
                color: muted,
                marginBottom: '12px',
                fontStyle: 'italic',
              }}>
                {wishlistBooks.length} book{wishlistBooks.length !== 1 ? 's' : ''} waiting to be yours ✨
              </p>
              <div className="flex flex-col gap-3">
                {wishlistBooks.map((book) => (
                  <div
                    key={book.bookId}
                    onClick={() => navigate(`/book/${book.bookId}`)}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: '14px',
                      background: '#1a1614',
                      cursor: 'pointer',
                      border: '1px solid rgba(196,160,124,0.15)',
                    }}
                  >
                    <BookCover
                      src={getActualCover(book.bookId, book.cover)}
                      title={book.title}
                      bookId={book.bookId}
                      width={56}
                      height={84}
                      borderRadius="8px"
                      style={{ flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#e2ddd5',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {book.title}
                      </h3>
                      <p style={{ fontSize: '11px', color: muted, marginTop: '2px' }}>
                        {book.author}
                      </p>
                      <button
                        onClick={(e) => handleBought(book.bookId, e)}
                        style={{
                          marginTop: '10px',
                          padding: '6px 14px',
                          borderRadius: '16px',
                          border: '1px solid rgba(196,160,124,0.3)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: 'rgba(196,160,124,0.1)',
                          color: accent,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        ✨ It's mine now! Add to library
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
