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

export function saveCustomCover(bookId: string, url: string) {
  try {
    const raw = localStorage.getItem('customCovers');
    const map = raw ? JSON.parse(raw) : {};
    map[bookId] = url;
    localStorage.setItem('customCovers', JSON.stringify(map));
  } catch {}
}

function getLocalOverride(bookId?: string): string | null {
  if (!bookId) return null;
  try {
    const raw = localStorage.getItem('customCovers');
    if (!raw) return null;
    return JSON.parse(raw)[bookId] ?? null;
  } catch {
    return null;
  }
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
  const { getCover } = useCovers();
  const effectiveId = bookId || isbn;

  const getCoverRef = useRef(getCover);
  getCoverRef.current = getCover;

  function pick(currentSrc: string, currentId: string | undefined): string {
    // 1) src всегда главный
    if (currentSrc && currentSrc.length > 5) return currentSrc;
    
    // 2) только если src пустой — локальная подмена
    const local = getLocalOverride(bookId);
    if (local) return local;

    // 3) только если src пустой — контекст
    if (currentId) {
      const ctx = getCoverRef.current(currentId);
      if (ctx) return ctx;
    }
    return '';
  }

  const [displaySrc, setDisplaySrc] = useState(() => pick(src, effectiveId));
  const [failed, setFailed] = useState(false);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    const next = pick(src, effectiveId);
    setDisplaySrc(next);
    setFailed(false);
    prevSrcRef.current = src;
  }, [src, bookId, isbn]);

  useEffect(() => {
    if (!effectiveId) return;
    const supabaseCover = getCover(effectiveId);
    if (!supabaseCover) return;
    
    // ВАЖНО: не перетирать нормальный src "плохим" значением из контекста.
    // Если getCover вернул НЕ полный URL (нет http/storage), игнорируем.
    const looksLikeRealUrl =
      supabaseCover.startsWith('http') ||
      supabaseCover.includes('/storage/v1/object/public/covers/');

    if (!looksLikeRealUrl) return;

    setDisplaySrc(supabaseCover);
    setFailed(false);
  }, [getCover, effectiveId]);

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
