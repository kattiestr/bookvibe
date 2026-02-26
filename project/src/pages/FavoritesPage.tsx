import { useFavorites } from '../hooks/useFavorites';
import BookCard from '../components/BookCard';
import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  const { favorites, removeFavorite, isFavorite } = useFavorites();

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1 className="text-3xl font-serif font-bold text-light mb-6">
        My Library
      </h1>

      {favorites.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={32} className="mx-auto text-border mb-4" />
          <p className="text-muted text-sm">no saved books yet</p>
          <p className="text-border text-xs mt-1">
            tap the heart on any book to save it
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {favorites.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              isFavorite={true}
              onToggleFavorite={() => removeFavorite(book.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
