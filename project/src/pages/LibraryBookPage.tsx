import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLibrary } from '../hooks/LibraryContext';
import Celebration from '../components/Celebration';
import DNFModal from '../components/DNFModal';
import { SassyToast, getSessionJoke } from '../components/SassyToast';
import type { BookVibe } from '../components/SassyToast';
import type {
  ReadingStatus,
  BookFormat,
  BookLanguage,
  ReadingSession,
} from '../hooks/LibraryContext';
import {
  ArrowLeft,
  Play,
  Pause,
  Star,
  Pencil,
  Check,
  Trash2,
  Camera,
} from 'lucide-react';

import { useBooks } from '../hooks/BooksContext';
import BookCover from '../components/BookCover';
import CoverChanger from '../components/CoverChanger';

const accent = '#c4a07c';
const muted = '#5c5450';

const STATUSES: { key: ReadingStatus; label: string; emoji: string }[] = [
  { key: 'want-to-read', label: 'Want', emoji: '✨' },
  { key: 'reading', label: 'Now', emoji: '📖' },
  { key: 'on-hold', label: 'Paused', emoji: '⏸️' },
  { key: 'finished', label: 'Done', emoji: '🏆' },
  { key: 'read-before', label: 'Past', emoji: '📚' },
  { key: 'dnf', label: 'DNF', emoji: '💀' },
];

const FORMATS: { key: BookFormat; label: string; emoji: string }[] = [
  { key: 'paper', label: 'Paper', emoji: '📕' },
  { key: 'ebook', label: 'E-book', emoji: '📱' },
  { key: 'audio', label: 'Audio', emoji: '🎧' },
];

const LANGUAGES: { key: BookLanguage; label: string; emoji: string }[] = [
  { key: 'en', label: 'English', emoji: '🇬🇧' },
  { key: 'ru', label: 'Русский', emoji: '🇷🇺' },
  { key: 'other', label: 'Other', emoji: '🌍' },
];

export default function LibraryBookPage() {
  const { books: booksDatabase } = useBooks();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBook, updateBook, addSession, getStats, removeFromLibrary } =
    useLibrary();

  const book = getBook(id || '');
  const stats = getStats(id || '');
  const dbBook = booksDatabase.find((b) => b.id === (id || ''));

  // Cover changer
  const [showCoverChanger, setShowCoverChanger] = useState(false);
  const [coverKey, setCoverKey] = useState(0);

  // Timer
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [sessionStartPage, setSessionStartPage] = useState(0);
  const [showEndSession, setShowEndSession] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [endPageInput, setEndPageInput] = useState('');
  const startTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Editing
  const [editingPages, setEditingPages] = useState(false);
  const [totalPagesInput, setTotalPagesInput] = useState('');
  const [editingCurrentPage, setEditingCurrentPage] = useState(false);
  const [currentPageInput, setCurrentPageInput] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [showDNFModal, setShowDNFModal] = useState(false);
  const [dnfReason, setDnfReason] = useState(
    () => localStorage.getItem(`dnf-reason-${id}`) || ''
  );
  const [toast, setToast] = useState<{ message: string; emoji: string } | null>(
    null
  );

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  if (!book) {
    return (
      <div
        className="max-w-lg mx-auto px-4 pt-12"
        style={{ textAlign: 'center' }}
      >
        <p style={{ color: muted }}>Book not found in library</p>
        <button
          onClick={() => navigate('/library')}
          style={{
            color: accent,
            marginTop: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          ← back to library
        </button>
      </div>
    );
  }

  const progress = stats?.progress || 0;
  const description = dbBook?.description;
  const vibes = dbBook?.vibes || [];

  const startTimer = () => {
    setSessionStartPage(book.currentPage);
    startTimeRef.current = Date.now();
    setSeconds(0);
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setShowEndSession(true);
    setEndPageInput('');
  };

  const saveSession = () => {
    const endPage = parseInt(endPageInput);
    if (
      isNaN(endPage) ||
      endPage <= sessionStartPage ||
      endPage > book.totalPages
    )
      return;
    const session: ReadingSession = {
      id: Date.now().toString(),
      startTime: startTimeRef.current,
      endTime: Date.now(),
      startPage: sessionStartPage,
      endPage,
      pagesRead: endPage - sessionStartPage,
      duration: seconds,
    };
    addSession(book.bookId, session);
    setShowEndSession(false);
    setSeconds(0);

    if (endPage >= book.totalPages) {
      setTimeout(() => setShowCelebration(true), 300);
    } else {
      const pagesRead = endPage - sessionStartPage;
      const vibe = ((book as any).vibe || 'default') as BookVibe;
      const joke = getSessionJoke(pagesRead, vibe);
      const emojis = ['📖', '🔥', '✨', '💪', '😏', '🐛', '👀'];
      setTimeout(() => {
        setToast({
          message: joke,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        });
      }, 500);
    }
  };

  const saveTotalPages = () => {
    const val = parseInt(totalPagesInput);
    if (!isNaN(val) && val > 0) updateBook(book.bookId, { totalPages: val });
    setEditingPages(false);
  };

  const saveCurrentPage = () => {
    const val = parseInt(currentPageInput);
    if (!isNaN(val) && val >= 0 && val <= book.totalPages) {
      updateBook(book.bookId, {
        currentPage: val,
        status:
          val >= book.totalPages
            ? 'finished'
            : val > 0
            ? 'reading'
            : book.status,
        dateStarted:
          val > 0
            ? book.dateStarted || new Date().toISOString()
            : book.dateStarted,
        dateFinished: val >= book.totalPages ? new Date().toISOString() : null,
      });
    }
    setEditingCurrentPage(false);
  };

  const fmt = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fmtTime = (mins: number) => {
    if (mins < 1) return '< 1m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const langLabel =
    LANGUAGES.find((l) => l.key === book.language)?.emoji || '🌍';

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
      <button
        onClick={() => navigate('/library')}
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

      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flexShrink: 0 }}>
          <BookCover
            key={coverKey}
            src={dbBook?.cover || book.cover}
            title={book.title}
            isbn={book.bookId}
            width={90}
            height={135}
            borderRadius="10px"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          />
          <button
            onClick={() => setShowCoverChanger(true)}
            style={{
              background: 'rgba(196,168,130,0.15)',
              border: '1px solid rgba(196,168,130,0.3)',
              borderRadius: '8px',
              padding: '4px 8px',
              color: accent,
              fontSize: '9px',
              cursor: 'pointer',
              marginTop: '6px',
              width: '90px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
            }}
          >
            <Camera size={9} />
            Change Cover
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#e2ddd5',
              lineHeight: 1.2,
            }}
          >
            {book.title}
          </h1>
          <p
            onClick={() =>
              navigate(`/author/${encodeURIComponent(book.author)}`)
            }
            style={{
              fontSize: '13px',
              color: muted,
              marginTop: '2px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(92,84,80,0.4)',
              textUnderlineOffset: '2px',
            }}
          >
            {book.author} →
          </p>

          {/* Pages */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '8px',
            }}
          >
            {!editingCurrentPage ? (
              <button
                onClick={() => {
                  setEditingCurrentPage(true);
                  setCurrentPageInput(book.currentPage.toString());
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span
                  style={{ fontSize: '14px', color: accent, fontWeight: 600 }}
                >
                  {book.currentPage}
                </span>
                <Pencil size={10} color={muted} />
              </button>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <input
                  type="number"
                  value={currentPageInput}
                  onChange={(e) => setCurrentPageInput(e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${accent}`,
                    background: '#141010',
                    color: '#e2ddd5',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && saveCurrentPage()}
                  autoFocus
                />
                <button
                  onClick={saveCurrentPage}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={14} color={accent} />
                </button>
              </div>
            )}
            <span style={{ fontSize: '14px', color: muted }}>/</span>
            {!editingPages ? (
              <button
                onClick={() => {
                  setEditingPages(true);
                  setTotalPagesInput(book.totalPages.toString());
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '14px', color: muted }}>
                  {book.totalPages} pages
                </span>
                <Pencil size={10} color={muted} />
              </button>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <input
                  type="number"
                  value={totalPagesInput}
                  onChange={(e) => setTotalPagesInput(e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: `1px solid ${accent}`,
                    background: '#141010',
                    color: '#e2ddd5',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && saveTotalPages()}
                  autoFocus
                />
                <button
                  onClick={saveTotalPages}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={14} color={accent} />
                </button>
              </div>
            )}
          </div>

          {/* Progress */}
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                height: '6px',
                borderRadius: '3px',
                background: '#2a2520',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: '3px',
                  background: progress === 100 ? '#6b9e7a' : accent,
                  transition: 'width 0.5s',
                }}
              />
            </div>
            <p
              style={{
                fontSize: '11px',
                color: accent,
                marginTop: '4px',
                fontWeight: 600,
              }}
            >
              {progress}%
            </p>
          </div>

          {/* Rating */}
          <button
            onClick={() => setShowRating(!showRating)}
            style={{
              marginTop: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Star
              size={14}
              fill={book.rating > 0 ? '#c9a84c' : 'none'}
              color={book.rating > 0 ? '#c9a84c' : muted}
            />
            <span
              style={{
                fontSize: '13px',
                color: book.rating > 0 ? '#c9a84c' : muted,
              }}
            >
              {book.rating > 0 ? `${book.rating}/10` : 'Rate'}
            </span>
          </button>
        </div>
      </div>

      {/* Rating Picker */}
      {showRating && (
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#1a1614',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => {
                  updateBook(book.bookId, { rating: n });
                  setShowRating(false);
                }}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: book.rating === n ? '#c9a84c' : '#2a2520',
                  color: book.rating === n ? '#141010' : muted,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        {STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              if (s.key === 'dnf') {
                setShowDNFModal(true);
              } else {
                const isFinishing =
                  s.key === 'finished' || s.key === 'read-before';
                const wasNotFinished =
                  book.status !== 'finished' && book.status !== 'read-before';
                updateBook(book.bookId, {
                  status: s.key,
                  dateFinished: s.key === 'finished' ? new Date().toISOString() : null,
                });
                if (isFinishing && wasNotFinished)
                  setTimeout(() => setShowCelebration(true), 300);
              }
            }}
            style={{
              padding: '7px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              border: 'none',
              cursor: 'pointer',
              background:
                book.status === s.key
                  ? s.key === 'dnf'
                    ? '#6b4040'
                    : accent
                  : '#1e1a18',
              color:
                book.status === s.key
                  ? s.key === 'dnf'
                    ? '#fff'
                    : '#141010'
                  : muted,
              fontWeight: book.status === s.key ? 700 : 400,
            }}
          >
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      {/* Read Before date */}
      {book.status === 'read-before' && (
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#1a1614',
            border: '1px solid #2a2520',
            marginBottom: '14px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: accent,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            📅 When did you read this?
          </p>
          <p style={{ fontSize: '10px', color: muted, marginBottom: '10px' }}>
            This won't count in your current reading stats
          </p>
          <input
            type="month"
            value={book.dateReadBefore || ''}
            onChange={(e) =>
              updateBook(book.bookId, { dateReadBefore: e.target.value })
            }
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: `1px solid ${accent}`,
              background: '#141010',
              color: '#e2ddd5',
              fontSize: '14px',
              outline: 'none',
              width: '100%',
            }}
          />
          {book.dateReadBefore && (
            <p style={{ fontSize: '11px', color: '#6b9e7a', marginTop: '8px' }}>
              ✓ Marked as read in{' '}
              {new Date(book.dateReadBefore + '-01').toLocaleDateString('en', {
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* DNF Reason */}
      {book.status === 'dnf' && (
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: '#1a1614',
            border: '1px solid rgba(107,64,64,0.3)',
            marginBottom: '14px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: '#b05050',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            💀 Why you DNF'd this
          </p>
          <textarea
            value={dnfReason}
            onChange={(e) => {
              setDnfReason(e.target.value);
              localStorage.setItem(`dnf-reason-${book.bookId}`, e.target.value);
            }}
            placeholder="Boring plot, annoying characters, too slow..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #2a2520',
              background: '#141010',
              color: '#e2ddd5',
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
              minHeight: '60px',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />
          <p
            style={{
              fontSize: '9px',
              color: muted,
              marginTop: '6px',
              fontStyle: 'italic',
            }}
          >
            Future you will thank you for remembering why 😏
          </p>
        </div>
      )}

      {/* Why You'll Love This */}
      {vibes.length > 0 && (
        <div
          style={{
            background: '#1a1614',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '14px',
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
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          >
            {vibes.map((vibe, i) => (
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

      {/* About */}
      {description && (
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: '#1a1614',
            marginBottom: '14px',
            border: '1px solid #2a2520',
          }}
        >
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
          <p style={{ fontSize: '13px', color: '#b0a89e', lineHeight: 1.7 }}>
            {description}
          </p>
        </div>
      )}

      {/* Format & Language */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        {FORMATS.map((f) => (
          <button
            key={f.key}
            onClick={() => updateBook(book.bookId, { format: f.key })}
            style={{
              padding: '7px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              border: 'none',
              cursor: 'pointer',
              background: book.format === f.key ? '#2a2520' : '#1a1614',
              color: book.format === f.key ? '#e2ddd5' : muted,
            }}
          >
            {f.emoji} {f.label}
          </button>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        {LANGUAGES.map((l) => (
          <button
            key={l.key}
            onClick={() => updateBook(book.bookId, { language: l.key })}
            style={{
              padding: '7px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              border: 'none',
              cursor: 'pointer',
              background: book.language === l.key ? '#2a2520' : '#1a1614',
              color: book.language === l.key ? '#e2ddd5' : muted,
            }}
          >
            {l.emoji} {l.label}
          </button>
        ))}
      </div>

      {/* TIMER */}
      <div
        style={{
          padding: '24px',
          borderRadius: '16px',
          background: '#1a1614',
          textAlign: 'center',
          marginBottom: '16px',
          border: isRunning ? `1px solid ${accent}` : '1px solid #2a2520',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            color: muted,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '8px',
          }}
        >
          reading timer {langLabel}
        </p>
        <p
          style={{
            fontFamily: 'monospace',
            fontSize: '48px',
            fontWeight: 700,
            color: isRunning ? accent : '#e2ddd5',
            lineHeight: 1,
            marginBottom: '16px',
          }}
        >
          {fmt(seconds)}
        </p>

        {!isRunning && !showEndSession && (
          <button
            onClick={startTimer}
            style={{
              padding: '14px 40px',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              background: accent,
              color: '#141010',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Play size={16} fill="#141010" /> Start Reading
          </button>
        )}

        {isRunning && (
          <button
            onClick={stopTimer}
            style={{
              padding: '14px 40px',
              borderRadius: '30px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              background: '#e74c3c',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Pause size={16} /> Stop
          </button>
        )}

        {showEndSession && (
          <div style={{ marginTop: '12px' }}>
            <p
              style={{
                fontSize: '13px',
                color: '#e2ddd5',
                marginBottom: '4px',
              }}
            >
              What page did you stop at?
            </p>
            <p style={{ fontSize: '11px', color: muted, marginBottom: '12px' }}>
              Started at page {sessionStartPage} · Read for {fmt(seconds)}
            </p>
            <input
              type="number"
              value={endPageInput}
              onChange={(e) => setEndPageInput(e.target.value)}
              placeholder={`${sessionStartPage + 1}–${book.totalPages}`}
              style={{
                width: '140px',
                padding: '10px 16px',
                borderRadius: '10px',
                border: '1px solid #3a3530',
                background: '#141010',
                color: '#e2ddd5',
                fontSize: '18px',
                textAlign: 'center',
                outline: 'none',
                marginBottom: '12px',
              }}
            />
            <div
              style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}
            >
              <button
                onClick={saveSession}
                style={{
                  padding: '10px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: accent,
                  color: '#141010',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                Save Session
              </button>
              <button
                onClick={() => {
                  setShowEndSession(false);
                  setSeconds(0);
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#2a2520',
                  color: muted,
                  fontSize: '13px',
                }}
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STATS */}
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '16px',
            color: '#e2ddd5',
            marginBottom: '12px',
          }}
        >
          Reading Stats
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: 'Total Time',
              value:
                stats && stats.totalMinutes > 0
                  ? fmtTime(stats.totalMinutes)
                  : '—',
              emoji: '⏱️',
            },
            {
              label: 'Pages/Hour',
              value: stats && stats.pagesPerHour > 0 ? stats.pagesPerHour : '—',
              emoji: '📄',
            },
            {
              label: 'Min/Page',
              value:
                stats && stats.minutesPerPage > 0
                  ? `${stats.minutesPerPage}m`
                  : '—',
              emoji: '⚡',
            },
            {
              label: 'Sessions',
              value: stats?.sessionsCount || 0,
              emoji: '📝',
            },
            {
              label: 'Pages Left',
              value: stats?.pagesLeft ?? book.totalPages - book.currentPage,
              emoji: '📖',
            },
            {
              label: 'Est. Left',
              value:
                stats && stats.hoursLeft > 0 ? `~${stats.hoursLeft}h` : '—',
              emoji: '🕐',
            },
            {
              label: 'Pages Read',
              value: stats?.totalPagesRead || 0,
              emoji: '✅',
            },
            {
              label: 'Avg Session',
              value:
                stats && stats.avgSessionMinutes > 0
                  ? fmtTime(stats.avgSessionMinutes)
                  : '—',
              emoji: '📊',
            },
            {
              label: 'Pages/Min',
              value:
                stats && stats.pagesPerMinute > 0 ? stats.pagesPerMinute : '—',
              emoji: '🚀',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: '#1a1614',
                textAlign: 'center',
                border: '1px solid #1e1a18',
              }}
            >
              <span style={{ fontSize: '14px' }}>{s.emoji}</span>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: s.value === '—' ? '#3a3530' : '#e2ddd5',
                  marginTop: '2px',
                }}
              >
                {s.value}
              </p>
              <p
                style={{
                  fontSize: '8px',
                  color: muted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '16px',
            color: '#e2ddd5',
            marginBottom: '8px',
          }}
        >
          Notes
        </h3>
        <textarea
          value={book.notes}
          onChange={(e) => updateBook(book.bookId, { notes: e.target.value })}
          placeholder="Your thoughts..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#1a1614',
            border: '1px solid #2a2520',
            color: '#e2ddd5',
            fontSize: '13px',
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Sessions */}
      {book.sessions.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <h3
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '16px',
              color: '#e2ddd5',
              marginBottom: '8px',
            }}
          >
            Sessions ({book.sessions.length})
          </h3>
          {book.sessions
            .slice()
            .reverse()
            .map((session) => {
              const speed =
                session.duration > 0
                  ? (session.pagesRead / (session.duration / 60)).toFixed(1)
                  : '0';
              return (
                <div
                  key={session.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#1a1614',
                    marginBottom: '6px',
                    border: '1px solid #1e1a18',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '13px', color: '#e2ddd5' }}>
                      p.{session.startPage} → p.{session.endPage}
                    </p>
                    <p style={{ fontSize: '10px', color: muted }}>
                      {new Date(session.startTime).toLocaleDateString()} ·{' '}
                      {new Date(session.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontSize: '13px',
                        color: accent,
                        fontWeight: 600,
                      }}
                    >
                      {session.pagesRead} pages
                    </p>
                    <p style={{ fontSize: '10px', color: muted }}>
                      {fmt(session.duration)} · {speed} p/min
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Delete */}
      <button
        onClick={() => {
          removeFromLibrary(book.bookId);
          navigate('/library');
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          margin: '20px auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#6b4040',
          fontSize: '12px',
        }}
      >
        <Trash2 size={12} /> Remove from Library
      </button>

      {toast && (
        <SassyToast
          message={toast.message}
          emoji={toast.emoji}
          onClose={() => setToast(null)}
        />
      )}
      {showCelebration && (
        <Celebration
          bookTitle={book.title}
          onClose={() => setShowCelebration(false)}
        />
      )}
      {showDNFModal && (
        <DNFModal
          bookTitle={book.title}
          bookId={book.bookId}
          onConfirm={(reason) => {
            updateBook(book.bookId, { status: 'dnf' });
            if (reason) setDnfReason(reason);
            setShowDNFModal(false);
          }}
          onCancel={() => setShowDNFModal(false)}
        />
      )}

      {/* Cover Changer Modal */}
      {showCoverChanger && (
        <CoverChanger
          bookId={book.bookId}
          bookTitle={book.title}
          bookAuthor={book.author}
          onChanged={() => {
            setShowCoverChanger(false);
            setCoverKey((k) => k + 1);
          }}
          onClose={() => setShowCoverChanger(false)}
        />
      )}
    </div>
  );
}
