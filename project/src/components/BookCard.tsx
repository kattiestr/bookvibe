import { useNavigate } from 'react-router-dom';
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
