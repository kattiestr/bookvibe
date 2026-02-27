import { useNavigate } from 'react-router-dom';
import type { Book } from '../data/books';
import BookCover from './BookCover';
import { useLibrary } from '../hooks/LibraryContext';
import { Star } from 'lucide-react';

interface Props {
  book: Book;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
}

const muted = '#5c5450';

export default function BookCard({ book, onClick }: Props) {
  const navigate = useNavigate();
  const { getBook } = useLibrary();
  const libraryBook = getBook(book.id);
  const rating = libraryBook?.rating || 0;

  return (
    <div
      onClick={onClick || (() => navigate(`/book/${book.id}`))}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <BookCover
        src={book.cover}
        title={book.title}
        author={book.author}
        bookId={book.id}
        borderRadius="10px"
      />

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

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
        {book.spice > 0 && (
          <p style={{ fontSize: '10px' }}>
            {'🌶️'.repeat(book.spice)}
          </p>
        )}
        {rating > 0 && (
          <span style={{
            fontSize: '10px',
            color: '#c9a84c',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            <Star size={8} fill="#c9a84c" color="#c9a84c" />
            {rating}/10
          </span>
        )}
      </div>
    </div>
  );
}
