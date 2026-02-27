import React, { useState, useEffect, useRef } from 'react';
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
  const { getCover, requestCover, version } = useCovers();
  const effectiveId = bookId || isbn;
  const requestedRef = useRef(false);

  function computeSrc(): string {
    if (effectiveId) {
      const ctx = getCover(effectiveId);
      if (ctx) return ctx;
    }
    if (src && src.length > 5) return src;
    return '';
  }

  const [displaySrc, setDisplaySrc] = useState(computeSrc);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const next = computeSrc();
    if (next && next !== displaySrc) {
      setDisplaySrc(next);
      setFailed(false);
    } else if (!next && displaySrc) {
      setDisplaySrc('');
    }
  }, [src, bookId, isbn, version]);

  useEffect(() => {
    if (requestedRef.current) return;
    if (!effectiveId || !author) return;
    if (getCover(effectiveId)) return;

    requestedRef.current = true;
    requestCover(effectiveId, title, author, src);
  }, [effectiveId]);

  if (failed || !displaySrc) {
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
      src={displaySrc}
      alt={title}
      onError={() => setFailed(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
          setFailed(true);
          return;
        }
        const ratio = img.naturalWidth / img.naturalHeight;
        if (ratio > 0.85 && ratio < 1.15 && img.naturalWidth <= 250) {
          setFailed(true);
        }
      }}
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
