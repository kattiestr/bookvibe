import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Book } from '../data/books';
import BookCover from './BookCover';
import { useLibrary } from '../hooks/LibraryContext';

interface Props {
  book: Book;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const muted = '#5c5450';

export default function BookCard({ book, isFavorite, onToggleFavorite }: Props) {
  const navigate = useNavigate();
  const { library } = useLibrary();

  const libraryEntry = library.find((b) => b.bookId === book.id);
  const isRead = libraryEntry?.status === 'finished' || libraryEntry?.status === 'read-before';
  const rating = libraryEntry?.rating || 0;

  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <BookCover
        src={book.cover}
        title={book.title}
        author={book.author}
        bookId={book.id}
        borderRadius="10px"
      />

      {isRead && rating > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(20,16,16,0.7)',
            borderRadius: '10px',
            padding: '3px 6px',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Star size={9} fill="#c9a84c" color="#c9a84c" />
          <span style={{ fontSize: '10px', color: '#c9a84c', fontWeight: 700 }}>
            {rating}
          </span>
        </div>
      )}

      <p
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '12px',
          fontWeight: 600,
          color: '#e2ddd5',
          marginTop: '8px',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {book.title}
      </p>
      <p style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>
        {book.author}
      </p>
      {book.spice > 0 && (
        <p style={{ fontSize: '10px', marginTop: '2px' }}>
          {'🌶️'.repeat(book.spice)}
        </p>
      )}
    </div>
  );
}
