import React, { useState, useMemo, useEffect } from 'react';
import { useCovers } from '../hooks/CoverContext';

interface Props {
  src: string;
  title: string;
  author?: string;
  isbn?: string;
  bookId?: string;
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

function hashColor(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = title.charCodeAt(i) + ((h << 5) - h);
  }
  return COLORS[Math.abs(h) % COLORS.length];
}

function resolveUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/covers/${path}`;
}

export function saveCustomCover(_bookId: string, _url: string) {}

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
        height: height ?? 'auto',
        aspectRatio: height ? undefined : '2/3',
        borderRadius,
        background: hashColor(title),
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
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: '10%',
          bottom: '10%',
          width: 2,
          background: 'rgba(226,221,213,0.1)',
          borderRadius: 1,
        }}
      />
      <span style={{ fontSize: 24, marginBottom: 8, opacity: 0.5 }}>📖</span>
      <p
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 12,
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
            fontSize: 9,
            color: 'rgba(226,221,213,0.4)',
            marginTop: 6,
            fontStyle: 'italic',
          }}
        >
          {author}
        </p>
      )}
    </div>
  );
}

function extractIsbn(url: string): string | null {
  const m = url.match(/(97[89]\d{10})/);
  return m ? m[1] : null;
}

export default function BookCover({
  src,
  title,
  author,
  isbn,
  bookId,
  width = '100%',
  height,
  borderRadius = '8px',
  style = {},
  onClick,
}: Props) {
  const { getCover } = useCovers();
  const effectiveId = bookId || isbn;
  const [sourceIndex, setSourceIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const sources = useMemo(() => {
    const urls: string[] = [];
    const seen = new Set<string>();
    const add = (u: string | null | undefined) => {
      if (u && u.length > 5 && !seen.has(u)) {
        seen.add(u);
        urls.push(u);
      }
    };

    const contextCover = effectiveId ? getCover(effectiveId) : null;
    add(resolveUrl(contextCover));
    add(resolveUrl(src));

    const realIsbn = isbn && isbn.startsWith('97') ? isbn : extractIsbn(src || '');
    if (realIsbn) {
      add(`https://covers.openlibrary.org/b/isbn/${realIsbn}-L.jpg`);
      add(`https://books.google.com/books/content?vid=isbn${realIsbn}&printsec=frontcover&img=1&zoom=1&source=gbs_api`);
    }

    return urls;
  }, [effectiveId, src, isbn, getCover]);

  useEffect(() => {
    setSourceIndex(0);
    setAllFailed(false);
  }, [sources[0]]);

  const handleError = () => {
    const next = sourceIndex + 1;
    if (next < sources.length) {
      setSourceIndex(next);
    } else {
      setAllFailed(true);
    }
  };

  if (allFailed || sources.length === 0) {
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
      src={sources[sourceIndex]}
      alt={title}
      onError={handleError}
      onClick={onClick}
      style={{
        width,
        height: height ?? 'auto',
        aspectRatio: height ? undefined : '2/3',
        objectFit: 'cover',
        borderRadius,
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export { Placeholder as BookPlaceholder };
