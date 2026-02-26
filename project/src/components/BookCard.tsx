import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Book } from '../data/books';
import BookCover from './BookCover';

interface Props {
  book: Book;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const muted = '#5c5450';

export default function BookCard({
  book,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      style={{ cursor: 'pointer', position: 'relative' }}
    >
      <BookCover
        src={book.cover}
        title={book.title}
        author={book.author}
        isbn={book.id}
        borderRadius="10px"
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(20,16,16,0.7)',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Heart
          size={12}
          fill={isFavorite ? '#e74c3c' : 'none'}
          color={isFavorite ? '#e74c3c' : '#e2ddd5'}
        />
      </button>

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
