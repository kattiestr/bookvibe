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

type CatalogBookRow = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  cover_url: string | null;
  spice: number;
  pages: number | null;
  year: number | null;
  description: string | null;
  rating: number | null;
  series_id: string | null;
  series_number: number | null;
  catalog_series: { name: string } | null;
  catalog_book_tags: Array<{
    catalog_tags: { slug: string; type: string } | null;
  }>;
  catalog_book_similar: Array<{ similar_book_id: string }>;
  catalog_book_vibes: Array<{ vibe_text: string; sort_order: number }>;
};

async function fetchBooksFromSupabase(client: SupabaseClient): Promise<Book[] | null> {
  const { data, error } = await client
    .from('catalog_books')
    .select(`
      id,
      title,
      author,
      isbn,
      cover_url,
      spice,
      pages,
      year,
      description,
      rating,
      series_id,
      series_number,
      catalog_series ( name ),
      catalog_book_tags ( catalog_tags ( slug, type ) ),
      catalog_book_similar ( similar_book_id ),
      catalog_book_vibes ( vibe_text, sort_order )
    `)
    .order('id');

  if (error || !data) return null;

  const rows = data as unknown as CatalogBookRow[];

  const idToTitle: Record<string, string> = {};
  for (const row of rows) {
    idToTitle[row.id] = row.title;
  }

  return rows.map((row) => {
    const tropes: string[] = [];
    const genres: string[] = [];
    const mood: string[] = [];

    for (const bt of row.catalog_book_tags) {
      if (!bt.catalog_tags) continue;
      const { slug, type } = bt.catalog_tags;
      if (type === 'trope') tropes.push(slug);
      else if (type === 'genre') genres.push(slug);
      else if (type === 'mood') mood.push(slug);
    }

    const similar = row.catalog_book_similar
      .map((s) => idToTitle[s.similar_book_id])
      .filter(Boolean);

    const vibes = row.catalog_book_vibes
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((v) => v.vibe_text);

    const book: Book = {
      id: row.id,
      title: row.title,
      author: row.author,
      isbn: row.isbn,
      cover: row.cover_url && row.cover_url.length > 0
        ? row.cover_url
        : `https://covers.openlibrary.org/b/isbn/${row.isbn}-L.jpg`,
      spice: (row.spice ?? 0) as Book['spice'],
      pages: row.pages ?? undefined,
      year: row.year ?? undefined,
      description: row.description ?? undefined,
      rating: row.rating ?? undefined,
      series: row.catalog_series?.name ?? undefined,
      seriesNumber: row.series_number ?? undefined,
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
    if (fetched && fetched.length > 0) {
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
