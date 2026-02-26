export type { Book, Trope, Genre, Mood } from '../data/books';
export { booksDatabase } from '../data/books';

import type { Book } from '../data/books';
import { getSupabase } from '../lib/supabaseClient';

export async function testSupabase(): Promise<{ ok: boolean; message: string }> {
  const result = getSupabase();
  if (!result.client) {
    return { ok: false, message: 'ENV missing — Supabase client not created.' };
  }
  const { error } = await result.client.from('books').select('count', { count: 'exact', head: true });
  if (!error) {
    return { ok: true, message: 'Supabase connected. Table "books" exists.' };
  }
  if (error.code === '42P01') {
    return { ok: true, message: 'Supabase connected. Table "books" does not exist yet.' };
  }
  return { ok: false, message: `Supabase error: ${error.message}` };
}

export function searchBooksLocal(query: string, books: Book[]): Book[] {
  const q = query.toLowerCase();
  return books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.tropes.some((t) => t.toLowerCase().includes(q)) ||
      b.genres.some((g) => g.toLowerCase().includes(q))
  );
}

export function getBooksByTrope(trope: string, books: Book[]): Book[] {
  return books.filter((b) => b.tropes.includes(trope as any));
}

export function getBooksByGenre(genre: string, books: Book[]): Book[] {
  return books.filter((b) => b.genres.includes(genre as any));
}

export function getBooksByMood(mood: string, books: Book[]): Book[] {
  return books.filter((b) => b.mood.includes(mood as any));
}

export function getSimilarBooks(bookId: string, books: Book[]): Book[] {
  const book = books.find((b) => b.id === bookId);
  if (!book?.similar) return [];
  return books.filter((b) => book.similar!.includes(b.title));
}
