import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type BookFormat = 'paper' | 'ebook' | 'audio';
export type ReadingStatus =
  | 'want-to-read'
  | 'reading'
  | 'on-hold'
  | 'finished'
  | 'read-before'
  | 'dnf'
  | 'wishlist';
export type BookLanguage = 'en' | 'ru' | 'other';

export interface ReadingSession {
  id: string;
  startTime: number;
  endTime: number;
  startPage: number;
  endPage: number;
  pagesRead: number;
  duration: number;
}

export interface LibraryBook {
  bookId: string;
  title: string;
  author: string;
  cover: string;
  series?: string;
  seriesNumber?: number;
  totalPages: number;
  currentPage: number;
  status: ReadingStatus;
  format: BookFormat;
  language: BookLanguage;
  rating: number;
  notes: string;
  vibe: string;
  dateAdded: string;
  dateStarted: string | null;
  dateFinished: string | null;
  dateReadBefore: string | null; // "2024-03" or "2023-11" — month/year when read in the past
  sessions: ReadingSession[];
}

interface LibraryContextType {
  library: LibraryBook[];
  addToLibrary: (book: {
    id: string;
    title: string;
    author: string;
    cover: string;
    pages?: number;
    status?: ReadingStatus;
    series?: string;
    seriesNumber?: number;
  }) => void;
  removeFromLibrary: (bookId: string) => void;
  isInLibrary: (bookId: string) => boolean;
  getBook: (bookId: string) => LibraryBook | undefined;
  updateBook: (bookId: string, updates: Partial<LibraryBook>) => void;
  addSession: (bookId: string, session: ReadingSession) => void;
  getStats: (bookId: string) => Stats | null;
}

export interface Stats {
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  totalPagesRead: number;
  pagesPerMinute: number;
  pagesPerHour: number;
  minutesPerPage: number;
  pagesLeft: number;
  minutesLeft: number;
  hoursLeft: number;
  progress: number;
  sessionsCount: number;
  avgSessionMinutes: number;
}

const LibraryContext = createContext<LibraryContextType | null>(null);
const STORAGE_KEY = 'bookvibe-library';

function loadLibrary(): LibraryBook[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryBook[]>(loadLibrary);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }, [library]);

  const addToLibrary = (book: {
    id: string;
    title: string;
    author: string;
    cover: string;
    pages?: number;
    status?: ReadingStatus;
    series?: string;
    seriesNumber?: number;
  }) => {
    setLibrary((prev) => {
      if (prev.find((b) => b.bookId === book.id)) return prev;
      return [
        ...prev,
        {
          bookId: book.id,
          title: book.title,
          author: book.author,
          cover: book.cover,
          series: book.series,
          seriesNumber: book.seriesNumber,
          totalPages: book.pages || 300,
          currentPage: 0,
          status: book.status || ('want-to-read' as ReadingStatus),
          format: 'paper' as BookFormat,
          language: 'en' as BookLanguage,
          rating: 0,
          notes: '',
          vibe: 'default',
          dateAdded: new Date().toISOString(),
          dateStarted: null,
          dateFinished: null,
          dateReadBefore: null,
          sessions: [],
        },
      ];
    });
  };

  const removeFromLibrary = (bookId: string) => {
    setLibrary((prev) => prev.filter((b) => b.bookId !== bookId));
  };

  const isInLibrary = (bookId: string) =>
    library.some((b) => b.bookId === bookId);

  const getBook = (bookId: string) => library.find((b) => b.bookId === bookId);

  const updateBook = (bookId: string, updates: Partial<LibraryBook>) => {
    setLibrary((prev) =>
      prev.map((b) => {
        if (b.bookId !== bookId) return b;
        const updated = { ...b, ...updates };

        if (updates.status === 'reading' && !b.dateStarted) {
          updated.dateStarted = new Date().toISOString();
        }

        if (updates.status === 'finished' && b.status !== 'finished') {
          updated.dateFinished = new Date().toISOString();
          updated.currentPage = b.totalPages;
        }

        if (updates.status === 'read-before' && b.status !== 'read-before') {
          // Don't set dateFinished to now — user will set dateReadBefore manually
          updated.currentPage = b.totalPages;
          if (!updated.dateReadBefore) {
            updated.dateReadBefore = null; // user should set this
          }
        }

        if (updates.status) {
          const wasComplete =
            b.status === 'finished' || b.status === 'read-before';
          const isNoLongerComplete =
            updates.status !== 'finished' && updates.status !== 'read-before';

          if (wasComplete && isNoLongerComplete) {
            const lastSession = b.sessions[b.sessions.length - 1];
            if (lastSession) {
              updated.currentPage = lastSession.endPage;
            } else {
              updated.currentPage = 0;
            }
            updated.dateFinished = null;
            updated.dateReadBefore = null;
          }
        }

        return updated;
      })
    );
  };

  const addSession = (bookId: string, session: ReadingSession) => {
    setLibrary((prev) =>
      prev.map((b) => {
        if (b.bookId !== bookId) return b;
        return {
          ...b,
          sessions: [...b.sessions, session],
          currentPage: session.endPage,
          status:
            session.endPage >= b.totalPages
              ? ('finished' as ReadingStatus)
              : ('reading' as ReadingStatus),
          dateStarted: b.dateStarted || new Date().toISOString(),
          dateFinished:
            session.endPage >= b.totalPages
              ? new Date().toISOString()
              : b.dateFinished,
        };
      })
    );
  };

  const getStats = (bookId: string): Stats | null => {
    const book = library.find((b) => b.bookId === bookId);
    if (!book) return null;

    const totalSeconds = book.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPagesRead = book.sessions.reduce(
      (sum, s) => sum + s.pagesRead,
      0
    );
    const totalMinutes = totalSeconds / 60;
    const totalHours = totalMinutes / 60;
    const pagesPerMinute = totalMinutes > 0 ? totalPagesRead / totalMinutes : 0;
    const pagesPerHour = totalHours > 0 ? totalPagesRead / totalHours : 0;
    const minutesPerPage =
      totalPagesRead > 0 ? totalMinutes / totalPagesRead : 0;
    const pagesLeft = book.totalPages - book.currentPage;
    const minutesLeft = minutesPerPage > 0 ? pagesLeft * minutesPerPage : 0;
    const hoursLeft = minutesLeft / 60;
    const progress =
      book.totalPages > 0
        ? Math.round((book.currentPage / book.totalPages) * 100)
        : 0;
    const avgSessionMinutes =
      book.sessions.length > 0 ? totalMinutes / book.sessions.length : 0;

    return {
      totalSeconds,
      totalMinutes: Math.round(totalMinutes),
      totalHours: Math.round(totalHours * 10) / 10,
      totalPagesRead,
      pagesPerMinute: Math.round(pagesPerMinute * 100) / 100,
      pagesPerHour: Math.round(pagesPerHour),
      minutesPerPage: Math.round(minutesPerPage * 10) / 10,
      pagesLeft,
      minutesLeft: Math.round(minutesLeft),
      hoursLeft: Math.round(hoursLeft * 10) / 10,
      progress,
      sessionsCount: book.sessions.length,
      avgSessionMinutes: Math.round(avgSessionMinutes),
    };
  };

  return (
    <LibraryContext.Provider
      value={{
        library,
        addToLibrary,
        removeFromLibrary,
        isInLibrary,
        getBook,
        updateBook,
        addSession,
        getStats,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be inside LibraryProvider');
  return ctx;
}
