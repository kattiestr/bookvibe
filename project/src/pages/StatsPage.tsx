import ReadingGoals from '../components/ReadingGoals';
import { useState, useMemo } from 'react';
import { useLibrary } from '../hooks/LibraryContext';
import { useStreaks } from '../hooks/useStreaks';
import { useAchievements } from '../hooks/useAchievements';
import type { ReadingSession } from '../hooks/LibraryContext';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  BookOpen,
  Clock,
  FileText,
  Trophy,
  Lock,
} from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

type Tab = 'week' | 'month' | 'year';

interface DayData {
  date: string;
  pages: number;
  minutes: number;
  sessions: number;
  booksFinished: number;
  bookTitles: string[];
}

function getAllSessions(
  library: any[]
): { session: ReadingSession; bookTitle: string; bookId: string }[] {
  const all: { session: ReadingSession; bookTitle: string; bookId: string }[] =
    [];
  for (const book of library) {
    for (const session of book.sessions) {
      all.push({ session, bookTitle: book.title, bookId: book.bookId });
    }
  }
  return all;
}

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function buildDayMap(library: any[]): Map<string, DayData> {
  const map = new Map<string, DayData>();
  const allSessions = getAllSessions(library);

  for (const { session, bookTitle } of allSessions) {
    // Skip sessions from read-before books (they have dateReadBefore set)
    const book = library.find((b: any) =>
      b.sessions.some((s: any) => s.id === session.id)
    );
    if (book?.status === 'read-before' && book?.dateReadBefore) continue;

    const key = dateKey(new Date(session.startTime));
    const existing = map.get(key) || {
      date: key,
      pages: 0,
      minutes: 0,
      sessions: 0,
      booksFinished: 0,
      bookTitles: [],
    };
    existing.pages += session.pagesRead;
    existing.minutes += Math.round(session.duration / 60);
    existing.sessions += 1;
    if (!existing.bookTitles.includes(bookTitle))
      existing.bookTitles.push(bookTitle);
    map.set(key, existing);
  }

  for (const book of library) {
    // Only count finished books (not read-before with dateReadBefore)
    if (
      book.dateFinished &&
      !(book.status === 'read-before' && book.dateReadBefore)
    ) {
      const key = dateKey(new Date(book.dateFinished));
      const existing = map.get(key) || {
        date: key,
        pages: 0,
        minutes: 0,
        sessions: 0,
        booksFinished: 0,
        bookTitles: [],
      };
      existing.booksFinished += 1;
      map.set(key, existing);
    }
  }

  return map;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getStartOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function fmtTime(mins: number): string {
  if (mins < 1) return '0m';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function StatsPage() {
  const { library } = useLibrary();
  const [tab, setTab] = useState<Tab>('month');
  const [viewDate, setViewDate] = useState(new Date());
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const dayMap = useMemo(() => buildDayMap(library), [library]);
  const streaks = useStreaks();
  const achievements = useAchievements();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const displayAchievements = showAllAchievements
    ? achievements
    : achievements.filter((a) => a.unlocked || a.progress > 0);

  const periodStats = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (tab === 'week') {
      startDate = getStartOfWeek(viewDate);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
    } else if (tab === 'month') {
      startDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      endDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    } else {
      startDate = new Date(viewDate.getFullYear(), 0, 1);
      endDate = new Date(viewDate.getFullYear(), 11, 31);
    }

    let totalPages = 0;
    let totalMinutes = 0;
    let totalSessions = 0;
    let booksFinished = 0;
    let daysRead = 0;

    const d = new Date(startDate);
    while (d <= endDate) {
      const data = dayMap.get(dateKey(d));
      if (data) {
        totalPages += data.pages;
        totalMinutes += data.minutes;
        totalSessions += data.sessions;
        booksFinished += data.booksFinished;
        daysRead++;
      }
      d.setDate(d.getDate() + 1);
    }

    return { totalPages, totalMinutes, totalSessions, booksFinished, daysRead };
  }, [tab, viewDate, dayMap]);

  const chartData = useMemo(() => {
    const bars: { label: string; pages: number; date: string }[] = [];

    if (tab === 'week') {
      const start = getStartOfWeek(viewDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = dateKey(d);
        const data = dayMap.get(key);
        bars.push({ label: WEEKDAYS[i], pages: data?.pages || 0, date: key });
      }
    } else if (tab === 'month') {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const days = getDaysInMonth(year, month);
      for (let i = 1; i <= days; i++) {
        const key = dateKey(new Date(year, month, i));
        const data = dayMap.get(key);
        bars.push({ label: i.toString(), pages: data?.pages || 0, date: key });
      }
    } else {
      for (let m = 0; m < 12; m++) {
        let pages = 0;
        const days = getDaysInMonth(viewDate.getFullYear(), m);
        for (let d = 1; d <= days; d++) {
          const key = dateKey(new Date(viewDate.getFullYear(), m, d));
          const data = dayMap.get(key);
          if (data) pages += data.pages;
        }
        bars.push({ label: MONTHS[m].slice(0, 3), pages, date: '' });
      }
    }

    return bars;
  }, [tab, viewDate, dayMap]);

  const maxPages = Math.max(...chartData.map((b) => b.pages), 1);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const startPad = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = getDaysInMonth(year, month);

    const cells: { day: number | null; data: DayData | null }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({ day: null, data: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = dateKey(new Date(year, month, d));
      cells.push({ day: d, data: dayMap.get(key) || null });
    }
    return cells;
  }, [viewDate, dayMap]);

  const navigate = (dir: number) => {
    const d = new Date(viewDate);
    if (tab === 'week') d.setDate(d.getDate() + dir * 7);
    else if (tab === 'month') d.setMonth(d.getMonth() + dir);
    else d.setFullYear(d.getFullYear() + dir);
    setViewDate(d);
  };

  const periodLabel = () => {
    if (tab === 'week') {
      const start = getStartOfWeek(viewDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()} ${MONTHS[start.getMonth()].slice(
        0,
        3
      )} — ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
    }
    if (tab === 'month')
      return `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    return `${viewDate.getFullYear()}`;
  };

  const getHeatColor = (data: DayData | null) => {
    if (!data) return '#1a1614';
    if (data.booksFinished > 0) return '#c9a84c';
    if (data.pages > 50) return accent;
    if (data.pages > 20) return 'rgba(196,160,124,0.6)';
    if (data.pages > 0) return 'rgba(196,160,124,0.3)';
    return '#1a1614';
  };

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
        Reading Stats
      </h1>
      <p
        style={{
          color: muted,
          fontSize: '13px',
          marginTop: '4px',
          marginBottom: '20px',
        }}
      >
        your reading journey visualized
      </p>

      {/* Reading Goals */}
      <ReadingGoals />

      {/* ===== READING STREAKS ===== */}
      <div
        style={{
          padding: '16px',
          borderRadius: '14px',
          background:
            streaks.currentStreak > 0 ? 'rgba(232,168,56,0.06)' : '#1a1614',
          border:
            streaks.currentStreak > 0
              ? '1px solid rgba(232,168,56,0.3)'
              : '1px solid #2a2520',
          marginBottom: '20px',
        }}
      >
        {/* Streak header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background:
                streaks.currentStreak > 0 ? 'rgba(232,168,56,0.15)' : '#2a2520',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame
              size={24}
              color={streaks.currentStreak > 0 ? '#e8a838' : muted}
              fill={streaks.currentStreak > 0 ? '#e8a838' : 'none'}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: streaks.currentStreak > 0 ? '#e8a838' : muted,
                lineHeight: 1,
              }}
            >
              {streaks.currentStreak}
            </p>
            <p style={{ fontSize: '11px', color: muted }}>
              day streak {streaks.currentStreak > 0 ? '🔥' : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#e2ddd5' }}>
              {streaks.longestStreak}
            </p>
            <p style={{ fontSize: '10px', color: muted }}>best streak</p>
          </div>
        </div>

        {/* Week activity dots */}
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
          {streaks.weekActivity.map((day, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: day.active ? '#e8a838' : '#2a2520',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '4px',
                  transition: 'all 0.3s',
                  boxShadow: day.active
                    ? '0 0 8px rgba(232,168,56,0.3)'
                    : 'none',
                }}
              >
                {day.active ? (
                  <span style={{ fontSize: '12px' }}>🔥</span>
                ) : (
                  <span style={{ fontSize: '10px', color: '#3a3530' }}>·</span>
                )}
              </div>
              <span
                style={{
                  fontSize: '8px',
                  color: day.active ? '#e8a838' : '#3a3530',
                  fontWeight: day.active ? 600 : 400,
                }}
              >
                {day.day}
              </span>
              {day.pages > 0 && (
                <p style={{ fontSize: '7px', color: muted }}>{day.pages}p</p>
              )}
            </div>
          ))}
        </div>

        {/* Motivation message */}
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          {!streaks.readToday ? (
            <p
              style={{
                fontSize: '11px',
                color: '#e8a838',
                fontStyle: 'italic',
              }}
            >
              📖 Read today to keep your streak alive!
            </p>
          ) : streaks.currentStreak >= 7 ? (
            <p
              style={{
                fontSize: '11px',
                color: '#6b9e7a',
                fontStyle: 'italic',
              }}
            >
              🔥 You're on fire! {streaks.currentStreak} days and counting!
            </p>
          ) : streaks.currentStreak >= 3 ? (
            <p
              style={{
                fontSize: '11px',
                color: '#e8a838',
                fontStyle: 'italic',
              }}
            >
              💪 Nice streak! Keep it going!
            </p>
          ) : (
            <p style={{ fontSize: '11px', color: muted, fontStyle: 'italic' }}>
              ✨ Great start! Read tomorrow to build your streak!
            </p>
          )}
        </div>
      </div>

      {/* ===== ACHIEVEMENTS ===== */}
      <div
        style={{
          padding: '16px',
          borderRadius: '14px',
          background: '#1a1614',
          border: '1px solid #2a2520',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={18} color="#c9a84c" />
            <h3
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '16px',
                fontWeight: 700,
                color: '#e2ddd5',
              }}
            >
              Achievements
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#c9a84c', fontWeight: 600 }}>
            {unlockedCount}/{achievements.length}
          </span>
        </div>

        {/* Achievement progress bar */}
        <div
          style={{
            height: '4px',
            borderRadius: '2px',
            background: '#2a2520',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: `${(unlockedCount / achievements.length) * 100}%`,
              height: '100%',
              borderRadius: '2px',
              background: '#c9a84c',
              transition: 'width 0.5s',
            }}
          />
        </div>

        {/* Achievement cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {displayAchievements.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '12px',
                background: a.unlocked ? 'rgba(201,168,76,0.08)' : '#141010',
                border: a.unlocked
                  ? '1px solid rgba(201,168,76,0.2)'
                  : '1px solid #1e1a18',
                opacity: a.unlocked ? 1 : 0.7,
              }}
            >
              {/* Emoji / Lock */}
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: a.unlocked ? 'rgba(201,168,76,0.15)' : '#1e1a18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '18px',
                }}
              >
                {a.unlocked ? a.emoji : <Lock size={14} color="#3a3530" />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: a.unlocked ? '#e2ddd5' : muted,
                    }}
                  >
                    {a.title}
                  </p>
                  {a.unlocked && (
                    <span style={{ fontSize: '10px', color: '#c9a84c' }}>
                      ✓
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>
                  {a.description}
                </p>

                {/* Progress bar */}
                {!a.unlocked && (
                  <div style={{ marginTop: '6px' }}>
                    <div
                      style={{
                        height: '3px',
                        borderRadius: '2px',
                        background: '#2a2520',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${a.progress}%`,
                          height: '100%',
                          borderRadius: '2px',
                          background: accent,
                          transition: 'width 0.5s',
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: '9px',
                        color: muted,
                        marginTop: '2px',
                      }}
                    >
                      {a.current}/{a.target}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Show all / Show less */}
        <button
          onClick={() => setShowAllAchievements(!showAllAchievements)}
          style={{
            width: '100%',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: '#1e1a18',
            color: muted,
            fontSize: '11px',
          }}
        >
          {showAllAchievements
            ? 'Show less'
            : `Show all ${achievements.length} achievements`}
        </button>
      </div>

      {/* Tab Toggle */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '4px',
          borderRadius: '14px',
          background: '#1a1614',
          marginBottom: '16px',
        }}
      >
        {(['week', 'month', 'year'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: tab === t ? 700 : 400,
              background: tab === t ? '#2a2520' : 'transparent',
              color: tab === t ? '#e2ddd5' : muted,
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Period Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: muted,
            padding: '8px',
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <p
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#e2ddd5',
          }}
        >
          {periodLabel()}
        </p>
        <button
          onClick={() => navigate(1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: muted,
            padding: '8px',
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2" style={{ marginBottom: '20px' }}>
        {[
          {
            icon: FileText,
            label: 'Pages',
            value: periodStats.totalPages,
            color: accent,
          },
          {
            icon: Clock,
            label: 'Time',
            value: fmtTime(periodStats.totalMinutes),
            color: '#8aa8d0',
          },
          {
            icon: BookOpen,
            label: 'Finished',
            value: periodStats.booksFinished,
            color: '#c9a84c',
          },
          {
            icon: Flame,
            label: 'Days',
            value: periodStats.daysRead,
            color: '#e8a838',
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: '12px 8px',
              borderRadius: '12px',
              background: '#1a1614',
              textAlign: 'center',
            }}
          >
            <s.icon
              size={16}
              color={s.color}
              style={{ margin: '0 auto 4px' }}
            />
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#e2ddd5' }}>
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

      {/* Bar Chart */}
      <div
        style={{
          padding: '16px',
          borderRadius: '14px',
          background: '#1a1614',
          marginBottom: '20px',
        }}
      >
        <p
          style={{
            fontSize: '11px',
            color: muted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '12px',
          }}
        >
          Pages per {tab === 'year' ? 'month' : 'day'}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: tab === 'month' ? '2px' : '4px',
            height: '100px',
          }}
        >
          {chartData.map((bar, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: tab === 'month' ? '8px' : '24px',
                  height:
                    bar.pages > 0
                      ? `${Math.max((bar.pages / maxPages) * 80, 4)}px`
                      : '2px',
                  borderRadius: '3px',
                  background: bar.pages > 0 ? accent : '#2a2520',
                  transition: 'height 0.3s ease',
                }}
              />
              {(tab === 'week' ||
                tab === 'year' ||
                (tab === 'month' &&
                  (parseInt(bar.label) === 1 ||
                    parseInt(bar.label) % 5 === 0))) && (
                <span style={{ fontSize: '7px', color: muted }}>
                  {bar.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Heatmap */}
      {tab === 'month' && (
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: '#1a1614',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}
          >
            Reading Calendar
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
              marginBottom: '4px',
            }}
          >
            {WEEKDAYS.map((d) => (
              <span
                key={d}
                style={{ fontSize: '8px', color: muted, textAlign: 'center' }}
              >
                {d.charAt(0)}
              </span>
            ))}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {calendarDays.map((cell, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: '4px',
                  background: cell.day
                    ? getHeatColor(cell.data)
                    : 'transparent',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                title={
                  cell.data
                    ? `${cell.data.pages}p · ${fmtTime(cell.data.minutes)}`
                    : ''
                }
              >
                {cell.day && (
                  <span
                    style={{
                      fontSize: '9px',
                      color: cell.data ? '#e2ddd5' : '#3a3530',
                      fontWeight: cell.data ? 600 : 400,
                    }}
                  >
                    {cell.day}
                  </span>
                )}
                {cell.data && cell.data.booksFinished > 0 && (
                  <span
                    style={{
                      fontSize: '7px',
                      position: 'absolute',
                      bottom: '1px',
                    }}
                  >
                    🏆
                  </span>
                )}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '8px', color: muted }}>less</span>
            {[
              '#1a1614',
              'rgba(196,160,124,0.3)',
              'rgba(196,160,124,0.6)',
              accent,
              '#c9a84c',
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: c,
                }}
              />
            ))}
            <span style={{ fontSize: '8px', color: muted }}>more</span>
            <span style={{ fontSize: '8px', marginLeft: '4px' }}>
              🏆 = finished
            </span>
          </div>
        </div>
      )}

      {/* Year heatmap */}
      {tab === 'year' && (
        <div
          style={{
            padding: '16px',
            borderRadius: '14px',
            background: '#1a1614',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '12px',
            }}
          >
            Year Overview
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '4px',
            }}
          >
            {Array.from({ length: 12 }, (_, month) => {
              const daysInMonth = getDaysInMonth(viewDate.getFullYear(), month);
              let pages = 0;
              let finished = 0;
              for (let d = 1; d <= daysInMonth; d++) {
                const key = dateKey(new Date(viewDate.getFullYear(), month, d));
                const data = dayMap.get(key);
                if (data) {
                  pages += data.pages;
                  finished += data.booksFinished;
                }
              }
              return (
                <div key={month} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      aspectRatio: '1',
                      borderRadius: '4px',
                      background:
                        pages === 0
                          ? '#2a2520'
                          : pages > 200
                          ? accent
                          : pages > 50
                          ? 'rgba(196,160,124,0.6)'
                          : 'rgba(196,160,124,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      marginBottom: '4px',
                    }}
                  >
                    {finished > 0 && (
                      <span style={{ fontSize: '10px' }}>🏆</span>
                    )}
                  </div>
                  <span style={{ fontSize: '7px', color: muted }}>
                    {MONTHS[month].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All-time summary */}
      {(() => {
        let totalPages = 0;
        let totalMinutes = 0;
        let totalBooks = library.filter(
          (b: any) => b.status === 'finished' || b.status === 'read-before'
        ).length;
        let totalSessions = 0;
        for (const [, data] of dayMap) {
          totalPages += data.pages;
          totalMinutes += data.minutes;
          totalSessions += data.sessions;
        }
        return (
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: '#1a1614',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: muted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '12px',
              }}
            >
              All Time
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Total Pages',
                  value: totalPages.toLocaleString(),
                  emoji: '📄',
                },
                {
                  label: 'Total Time',
                  value: fmtTime(totalMinutes),
                  emoji: '⏱️',
                },
                { label: 'Books Finished', value: totalBooks, emoji: '📚' },
                { label: 'Sessions', value: totalSessions, emoji: '📝' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: '#141010',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{s.emoji}</span>
                  <div>
                    <p
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: '#e2ddd5',
                      }}
                    >
                      {s.value}
                    </p>
                    <p
                      style={{
                        fontSize: '9px',
                        color: muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
