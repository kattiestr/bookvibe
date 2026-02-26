import { useState, useEffect } from 'react';
import type { Book } from '../data/books';

const STORAGE_KEY = 'bookvibe-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (book: Book) => {
    setFavorites((prev) => {
      if (prev.find((b) => b.id === book.id)) return prev;
      return [...prev, book];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((b) => b.id !== id));
  };

  const isFavorite = (id: string) => favorites.some((b) => b.id === id);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
