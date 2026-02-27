import { useState } from 'react';
import { useBooks } from '../hooks/BooksContext';
import { searchBooksLocal } from '../api/books';
import type { Book } from '../data/books';
import BookCard from '../components/BookCard';
import { useFavorites } from '../hooks/useFavorites';
import { Search, X } from 'lucide-react';

const SUGGESTIONS = [
  'enemies-to-lovers',
  'dark-romance',
  'slow-burn',
  'grumpy-sunshine',
  'fantasy-romance',
  'forbidden-love',
  'Sarah J. Maas',
  'Colleen Hoover',
  'Ana Huang',
  'Emily Henry',
];

export default function SearchPage() {
  const { books: booksDatabase } = useBooks();
  const [query, setQuery] = useState('');
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const results = query.trim()
    ? searchBooksLocal(query.trim(), booksDatabase)
    : [];

  const toggleFavorite = (book: Book) => {
    if (isFavorite(book.id)) removeFavorite(book.id);
    else addFavorite(book);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-3xl font-serif font-bold text-light mb-6">Search</h1>

      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="books, authors, tropes..."
          className="w-full pl-11 pr-10 py-3 rounded-xl bg-surface border border-border text-light placeholder-muted focus:border-cream/30 focus:outline-none transition-all text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-light"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {!query && (
        <div className="flex flex-wrap gap-2 mb-6">
          {SUGGESTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-4 py-2 rounded-full bg-transparent border border-border text-xs text-muted hover:text-light hover:border-muted transition-all"
            >
              {tag.split('-').join(' ')}
            </button>
          ))}
        </div>
      )}

      {query && results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {results.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isFavorite={isFavorite(book.id)}
              onToggleFavorite={() => toggleFavorite(book)}
            />
          ))}
        </div>
      )}

      {query && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted text-sm">nothing found</p>
          <p className="text-border text-xs mt-1">try a different search</p>
        </div>
      )}
    </div>
  );
}
