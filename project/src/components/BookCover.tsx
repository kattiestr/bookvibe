import { useState, useEffect } from 'react';

interface Props {
  src: string;
  title: string;
  author?: string;
  isbn?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const COLORS = [
  'linear-gradient(135deg, #2c1810, #4a2c20)',
  'linear-gradient(135deg, #1a2332, #2a3a4a)',
  'linear-gradient(135deg, #2a1a2e, #4a2a4e)',
  'linear-gradient(135deg, #1a2a1a, #2a4a2a)',
  'linear-gradient(135deg, #2a2a1a, #4a4a2a)',
  'linear-gradient(135deg, #1a1a2a, #2a2a4a)',
  'linear-gradient(135deg, #3a1a1a, #5a2a2a)',
  'linear-gradient(135deg, #1a2a2a, #2a4a4a)',
];

function getColor(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

// Get user-saved cover from localStorage
function getSavedCover(bookId?: string): string | null {
  if (!bookId) return null;
  try {
    const saved = localStorage.getItem('customCovers');
    if (saved) {
      const map = JSON.parse(saved);
      return map[bookId] || null;
    }
  } catch {}
  return null;
}

export function saveCustomCover(bookId: string, url: string) {
  try {
    const saved = localStorage.getItem('customCovers');
    const map = saved ? JSON.parse(saved) : {};
    map[bookId] = url;
    localStorage.setItem('customCovers', JSON.stringify(map));
  } catch {}
}

function Placeholder({
  title,
  author,
  width,
  height,
  borderRadius,
  style,
  onClick,
}: {
  title: string;
  author?: string;
  width: number | string;
  height?: number | string;
  borderRadius: string;
  style: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width,
        height: height || 'auto',
        aspectRatio: height ? undefined : '2/3',
        borderRadius,
        background: getColor(title),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 12px',
        textAlign: 'center',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '8px',
          top: '10%',
          bottom: '10%',
          width: '2px',
          background: 'rgba(226,221,213,0.1)',
          borderRadius: '1px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '8px',
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'rgba(226,221,213,0.06)',
        }}
      />
      <span style={{ fontSize: '24px', marginBottom: '8px', opacity: 0.5 }}>
        📖
      </span>
      <p
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '12px',
          fontWeight: 700,
          color: '#e2ddd5',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          padding: '0 4px',
        }}
      >
        {title}
      </p>
      {author && (
        <p
          style={{
            fontSize: '9px',
            color: 'rgba(226,221,213,0.4)',
            marginTop: '6px',
            fontStyle: 'italic',
          }}
        >
          {author}
        </p>
      )}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '15%',
          right: '15%',
          height: '1px',
          background: 'rgba(226,221,213,0.06)',
        }}
      />
    </div>
  );
}

export default function BookCover({
  src,
  title,
  author,
  isbn,
  width = '100%',
  height,
  borderRadius = '8px',
  style = {},
  onClick,
}: Props) {
  const [failed, setFailed] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  useEffect(() => {
    // Check if user saved a custom cover
    const saved = getSavedCover(isbn);
    if (saved) {
      setCurrentSrc(saved);
      setFailed(false);
    } else if (src && src.length > 5) {
      setCurrentSrc(src);
      setFailed(false);
    } else {
      setFailed(true);
    }
  }, [src, isbn]);

  const handleError = () => {
    setFailed(true);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // 1x1 pixel = no image
    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
      setFailed(true);
      return;
    }
    // Square small images = "image not available" from Google Books
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 0.85 && ratio < 1.15 && img.naturalWidth <= 250) {
      setFailed(true);
      return;
    }
  };

  if (failed || !currentSrc) {
    return (
      <Placeholder
        title={title}
        author={author}
        width={width}
        height={height}
        borderRadius={borderRadius}
        style={style}
        onClick={onClick}
      />
    );
  }

  return (
    <img
      src={currentSrc}
      alt={title}
      onError={handleError}
      onLoad={handleLoad}
      onClick={onClick}
      style={{
        width,
        height: height || 'auto',
        aspectRatio: height ? undefined : '2/3',
        objectFit: 'cover',
        borderRadius,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    />
  );
}

export { Placeholder as BookPlaceholder };
