import { useState } from 'react';

interface CoverImageProps {
  src: string;
  alt: string;
  isbn?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

export default function CoverImage({
  src,
  alt,
  isbn,
  style,
  className,
  onClick,
}: CoverImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  // Auto-generate all possible cover sources
  const sources = [
    src, // Original source (what's in our database)
    isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null,
    isbn
      ? `https://books.google.com/books/content?vid=isbn${isbn}&printsec=frontcover&img=1&zoom=1&source=gbs_api`
      : null,
    isbn
      ? `https://m.media-amazon.com/images/P/${isbn}.01._SCLZZZZZZZ_SX500_.jpg`
      : null,
  ].filter(Boolean) as string[];

  // Remove duplicates
  const uniqueSources = [...new Set(sources)];

  const handleError = () => {
    const nextIndex = sourceIndex + 1;
    if (nextIndex < uniqueSources.length) {
      setSourceIndex(nextIndex);
    } else {
      setFailed(true);
    }
  };

  // All sources failed → show beautiful placeholder
  if (failed) {
    return (
      <div
        onClick={onClick}
        className={className}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #2a2520, #1e1a18)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          borderRadius: style?.borderRadius || '8px',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <span style={{ fontSize: '28px', marginBottom: '6px' }}>📚</span>
        <span
          style={{
            fontSize: '9px',
            color: '#8a8480',
            textAlign: 'center',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
          }}
        >
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={uniqueSources[sourceIndex]}
      alt={alt}
      onError={handleError}
      onClick={onClick}
      className={className}
      style={{
        ...style,
        cursor: onClick ? 'pointer' : 'default',
      }}
    />
  );
}
