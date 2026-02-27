import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getSupabase } from '../lib/supabaseClient';

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
  dateReadBefore: string | null;
  sessions: ReadingSession[];
}

interface LibraryContextType {
  library: LibraryBook[];
  loading: boolean;
  addToLibrary: (book: {
    id: string;
    title: string;
    author: string;
    cover: string;
    pages?: number;
    status?: ReadingStatus;
    series?: string;
    seriesNumber?: number;
  }) => Promise<void>;
  removeFromLibrary: (bookId: string) => Promise<void>;
  isInLibrary: (bookId: string) => boolean;
  getBook: (bookId: string) => LibraryBook | undefined;
  updateBook: (bookId: string, updates: Partial<LibraryBook>) => Promise<void>;
  addSession: (bookId: string, session: ReadingSession) => Promise<void>;
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

function toSupabase(book: LibraryBook, userId: string) {
  return {
    user_id: userId,
    book_id: book.bookId,
    title: book.title,
    author: book.author,
    cover: book.cover,
    series: book.series ?? null,
    series_number: book.seriesNumber ?? null,
    total_pages: book.totalPages,
    current_page: book.currentPage,
    status: book.status,
    format: book.format,
    language: book.language,
    rating: book.rating,
    notes: book.notes,
    vibe: book.vibe,
    date_added: book.dateAdded,
    date_started: book.dateStarted,
    date_finished: book.dateFinished,
    date_read_before: book.dateReadBefore,
    sessions: book.sessions,
  };
}

function fromSupabase(row: any): LibraryBook {
  return {
    bookId: row.book_id,
    title: row.title,
    author: row.author,
    cover: row.cover,
    series: row.series ?? undefined,
    seriesNumber: row.series_number ?? undefined,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    status: row.status,
    format: row.format,
    language: row.language,
    rating: row.rating,
    notes: row.notes,
    vibe: row.vibe,
    dateAdded: row.date_added,
    dateStarted: row.date_started,
    dateFinished: row.date_finished,
    dateReadBefore: row.date_read_before,
    sessions: row.sessions ?? [],
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Получаем пользователя и загружаем его библиотеку
  useEffect(() => {
    const supabaseResult = getSupabase();
    if (!supabaseResult.client) return;
    const client = supabaseResult.client;

    client.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setLoading(false);
        return;
      }

      client
        .from('user_library')
        .select('*')
        .eq('user_id', uid)
        .then(({ data: rows }) => {
          if (rows) setLibrary(rows.map(fromSupabase));
          setLoading(false);
        });
    });

    // Слушаем смену пользователя
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setLibrary([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      client
        .from('user_library')
        .select('*')
        .eq('user_id', uid)
        .then(({ data: rows }) => {
          if (rows) setLibrary(rows.map(fromSupabase));
          setLoading(false);
        });
    });

    return () => subscription.unsubscribe();
  }, []);

  const addToLibrary = async (book: {
    id: string;
    title: string;
    author: string;
    cover: string;
    pages?: number;
    status?: ReadingStatus;
    series?: string;
    seriesNumber?: number;
  }) => {
    if (!userId) return;
    const supabaseResult = getSupabase();
    if (!supabaseResult.client) return;

    if (library.find((b) => b.bookId === book.id)) return;

    const newBook: LibraryBook = {
      bookId: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      series: book.series,
      seriesNumber: book.seriesNumber,
      totalPages: book.pages || 300,
      currentPage: 0,
      status: book.status || 'want-to-read',
      format: 'paper',
      language: 'en',
      rating: 0,
      notes: '',
      vibe: 'default',
      dateAdded: new Date().toISOString(),
      dateStarted: null,
      dateFinished: null,
      dateReadBefore: null,
      sessions: [],
    };

    const { error } = await supabaseResult.client
      .from('user_library')
      .insert(toSupabase(newBook, userId));

    if (!error) {
      setLibrary((prev) => [...prev, newBook]);
    }
  };

  const removeFromLibrary = async (bookId: string) => {
    if (!userId) return;
    const supabaseResult = getSupabase();
    if (!supabaseResult.client) return;

    const { error } = await supabaseResult.client
      .from('user_library')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (!error) {
      setLibrary((prev) => prev.filter((b) => b.bookId !== bookId));
    }
  };

  const isInLibrary = (bookId: string) =>
    library.some((b) => b.bookId === bookId);

  const getBook = (bookId: string) =>
    library.find((b) => b.bookId === bookId);

  const updateBook = async (bookId: string, updates: Partial<LibraryBook>) => {
    if (!userId) return;
    const supabaseResult = getSupabase();
    if (!supabaseResult.client) return;

    const book = library.find((b) => b.bookId === bookId);
    if (!book) return;

    const updated = { ...book, ...updates };

    if (updates.status === 'reading' && !book.dateStarted) {
      updated.dateStarted = new Date().toISOString();
    }

    if (updates.status === 'finished' && book.status !== 'finished') {
      updated.dateFinished = new Date().toISOString();
      updated.currentPage = book.totalPages;
    }

    if (updates.status === 'read-before' && book.status !== 'read-before') {
      updated.currentPage = book.totalPages;
      if (!updated.dateReadBefore) {
        updated.dateReadBefore = null;
      }
    }

    if (updates.status) {
      const wasComplete = book.status === 'finished' || book.status === 'read-before';
      const isNoLongerComplete =
        updates.status !== 'finished' && updates.status !== 'read-before';

      if (wasComplete && isNoLongerComplete) {
        const lastSession = book.sessions[book.sessions.length - 1];
        updated.currentPage = lastSession ? lastSession.endPage : 0;
        updated.dateFinished = null;
        updated.dateReadBefore = null;
      }
    }

    const { error } = await supabaseResult.client
      .from('user_library')
      .update(toSupabase(updated, userId))
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (!error) {
      setLibrary((prev) =>
        prev.map((b) => (b.bookId === bookId ? updated : b))
      );
    }
  };

  const addSession = async (bookId: string, session: ReadingSession) => {
    if (!userId) return;
    const supabaseResult = getSupabase();
    if (!supabaseResult.client) return;

    const book = library.find((b) => b.bookId === bookId);
    if (!book) return;

    const updated: LibraryBook = {
      ...book,
      sessions: [...book.sessions, session],
      currentPage: session.endPage,
      status:
        session.endPage >= book.totalPages ? 'finished' : 'reading',
      dateStarted: book.dateStarted || new Date().toISOString(),
      dateFinished:
        session.endPage >= book.totalPages
          ? new Date().toISOString()
          : book.dateFinished,
    };

    const { error } = await supabaseResult.client
      .from('user_library')
      .update(toSupabase(updated, userId))
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (!error) {
      setLibrary((prev) =>
        prev.map((b) => (b.bookId === bookId ? updated : b))
      );
    }
  };

  const getStats = (bookId: string): Stats | null => {
    const book = library.find((b) => b.bookId === bookId);
    if (!book) return null;

    const totalSeconds = book.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalPagesRead = book.sessions.reduce((sum, s) => sum + s.pagesRead, 0);
    const totalMinutes = totalSeconds / 60;
    const totalHours = totalMinutes / 60;
    const pagesPerMinute = totalMinutes > 0 ? totalPagesRead / totalMinutes : 0;
    const pagesPerHour = totalHours > 0 ? totalPagesRead / totalHours : 0;
    const minutesPerPage = totalPagesRead > 0 ? totalMinutes / totalPagesRead : 0;
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
        loading,
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
