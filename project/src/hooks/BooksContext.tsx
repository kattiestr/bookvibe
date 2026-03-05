import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../lib/supabaseClient';
import { booksDatabase as staticBooks } from '../data/books';
import type { Book } from '../data/books';

interface BooksContextValue {
  books: Book[];
  loading: boolean;
  refreshBooks: () => Promise<void>;
}

const BooksContext = createContext<BooksContextValue>({
  books: staticBooks,
  loading: false,
  refreshBooks: async () => {},
});

type BookRow = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  cover_path: string | null;
  spice: number;
  pages: number | null;
  year: number | null;
  description: string | null;
  series_number: number | null;
  language: string | null; // 👈 добавила
  series: { name: string } | null;
  book_tags: Array<{
    tags: { slug: string; type: string } | null;
  }>;
  book_similar: Array<{ similar_book_id: string }>;
};

async function fetchBooksFromSupabase(client: SupabaseClient): Promise<Book[] | null> {
  const allRows: BookRow[] = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from('books')
      .select(`
        id,
        title,
        author,
        isbn,
        cover_path,
        spice,
        pages,
        year,
        description,
        series_number,
        language,
        series ( name ),
        book_tags ( tags ( slug, type ) ),
        book_similar!book_similar_book_id_fkey ( similar_book_id )
      `)
      .order('title')
      .range(from, from + PAGE_SIZE - 1);

    if (error || !data) {
      console.error('Supabase fetch error:', error);
      return null;
    }

    allRows.push(...(data as unknown as BookRow[]));

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log('Всего книг пришло:', allRows.length);

  const idToTitle: Record<string, string> = {};
  for (const row of allRows) {
    idToTitle[row.id] = row.title;
  }

  return allRows.map((row) => {
    const tropes: string[] = [];
    const genres: string[] = [];
    const mood: string[] = [];
    const vibes: string[] = [];

    for (const bt of row.book_tags) {
      if (!bt.tags) continue;
      const { slug, type } = bt.tags;
      if (type === 'trope') tropes.push(slug);
      else if (type === 'genre') genres.push(slug);
      else if (type === 'mood') mood.push(slug);
      else if (type === 'vibe') vibes.push(slug);
    }

    const similar = row.book_similar
      .map((s) => idToTitle[s.similar_book_id])
      .filter(Boolean);

    const book: Book = {
      id: row.id,
      title: row.title,
      author: row.author,
      isbn: row.isbn,
      cover: row.cover_path && row.cover_path.length > 0
        ? row.cover_path
        : `https://covers.openlibrary.org/b/isbn/${row.isbn}-L.jpg`,
      spice: (row.spice ?? 0) as Book['spice'],
      pages: row.pages ?? undefined,
      year: row.year ?? undefined,
      description: row.description ?? undefined,
      series: row.series?.name ?? undefined,
      seriesNumber: row.series_number ?? undefined,
      language: row.language ?? 'en', // 👈 добавила
      tropes: tropes as Book['tropes'],
      genres: genres as Book['genres'],
      mood: mood as Book['mood'],
      similar: similar.length > 0 ? similar : undefined,
      vibes: vibes.length > 0 ? vibes : undefined,
    };

    return book;
  });
}

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>(staticBooks);
  const [loading, setLoading] = useState(true);

  const refreshBooks = async () => {
    const result = getSupabase();
    if (!result.client) return;
    const fetched = await fetchBooksFromSupabase(result.client);
    if (fetched) {
      setBooks(fetched);
    }
  };

  useEffect(() => {
    const result = getSupabase();
    if (!result.client) {
      setLoading(false);
      return;
    }
    const client = result.client;
    let cancelled = false;
    fetchBooksFromSupabase(client).then((fetched) => {
      if (!cancelled && fetched && fetched.length > 0) {
        setBooks(fetched);
      }
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <BooksContext.Provider value={{ books, loading, refreshBooks }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  return useContext(BooksContext);
}
