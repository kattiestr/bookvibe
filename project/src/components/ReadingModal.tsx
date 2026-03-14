import { useEffect, useRef } from 'react';
import { Play, Pause, X } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

interface ReadingModalProps {
  isRunning: boolean;
  isPaused: boolean;
  seconds: number;
  showEndSession: boolean;
  sessionStartPage: number;
  endPageInput: string;
  totalPages: number;
  coverSrc?: string;
  bookTitle: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onEndPageChange: (val: string) => void;
}

export default function ReadingModal({
  isRunning,
  isPaused,
  seconds,
  showEndSession,
  sessionStartPage,
  endPageInput,
  totalPages,
  coverSrc,
  bookTitle,
  onPause,
  onResume,
  onStop,
  onSave,
  onDiscard,
  onEndPageChange,
}: ReadingModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showEndSession && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showEndSession]);

  const fmt = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Фон — обложка книги размытая */}
      {coverSrc ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${coverSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px) brightness(0.5)',
            transform: 'scale(1.1)',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0e0b0a',
          }}
        />
      )}

      {/* Тёмный оверлей поверх фона */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(10,8,7,0.6)',
        }}
      />

      {/* Контент */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
        }}
      >
        {/* Название книги */}
        <p
          style={{
            fontSize: '12px',
            color: 'rgba(196,160,124,0.7)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginBottom: '8px',
            textAlign: 'center',
          }}
        >
          reading session
        </p>
        <p
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '20px',
            color: '#e2ddd5',
            textAlign: 'center',
            marginBottom: '48px',
            maxWidth: '300px',
            lineHeight: 1.3,
          }}
        >
          {bookTitle}
        </p>

        {/* Таймер */}
        {!showEndSession && (
          <>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '72px',
                fontWeight: 700,
                color: isRunning ? accent : isPaused ? '#8aa8d0' : '#e2ddd5',
                lineHeight: 1,
                marginBottom: '16px',
                opacity: isPaused ? 0.6 : 1,
                letterSpacing: '-2px',
              }}
            >
              {fmt(seconds)}
            </div>

            {isPaused && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#8aa8d0',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '32px',
                }}
              >
                ⏸ paused
              </p>
            )}

            {!isPaused && (
              <div style={{ marginBottom: '32px', height: '24px' }} />
            )}

            {/* Кнопки управления */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {isRunning && (
                <button
                  onClick={onPause}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '40px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    background: 'rgba(255,255,255,0.1)',
                    color: '#e2ddd5',
                    backdropFilter: 'blur(8px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Pause size={18} /> Pause
                </button>
              )}

              {isPaused && (
                <button
                  onClick={onResume}
                  style={{
                    padding: '16px 32px',
                    borderRadius: '40px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    background: accent,
                    color: '#141010',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Play size={18} fill="#141010" /> Resume
                </button>
              )}

              <button
                onClick={onStop}
                style={{
                  padding: '16px 32px',
                  borderRadius: '40px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: 600,
                  background: 'rgba(231,76,60,0.85)',
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                End Session
              </button>
            </div>

            {/* Подсказка */}
            <p
              style={{
                fontSize: '11px',
                color: 'rgba(92,84,80,0.6)',
                marginTop: '32px',
                textAlign: 'center',
              }}
            >
              finish or end session to close
            </p>
          </>
        )}

        {/* Экран сохранения сессии */}
        {showEndSession && (
          <div
            style={{
              background: 'rgba(26,22,20,0.9)',
              backdropFilter: 'blur(16px)',
              borderRadius: '20px',
              padding: '32px',
              textAlign: 'center',
              border: '1px solid rgba(196,160,124,0.2)',
              width: '100%',
              maxWidth: '320px',
            }}
          >
            <p
              style={{
                fontSize: '18px',
                color: '#e2ddd5',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              Session done! 📖
            </p>
            <p style={{ fontSize: '13px', color: muted, marginBottom: '4px' }}>
              Read for {fmt(seconds)}
            </p>
            <p
              style={{
                fontSize: '12px',
                color: muted,
                marginBottom: '24px',
              }}
            >
              Started at page {sessionStartPage}
            </p>

            <p
              style={{
                fontSize: '13px',
                color: '#e2ddd5',
                marginBottom: '12px',
              }}
            >
              What page did you stop at?
            </p>

            <input
              ref={inputRef}
              type="number"
              value={endPageInput}
              onChange={(e) => onEndPageChange(e.target.value)}
              placeholder={`${sessionStartPage + 1}–${totalPages}`}
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
              style={{
                width: '160px',
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1px solid ${accent}55`,
                background: '#141010',
                color: '#e2ddd5',
                fontSize: '24px',
                textAlign: 'center',
                outline: 'none',
                marginBottom: '20px',
                display: 'block',
                margin: '0 auto 20px',
              }}
            />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={onSave}
                style={{
                  padding: '12px 28px',
                  borderRadius: '24px',
                  border: 'none',
                  cursor: 'pointer',
                  background: accent,
                  color: '#141010',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                Save
              </button>
              <button
                onClick={onDiscard}
                style={{
                  padding: '12px 20px',
                  borderRadius: '24px',
                  border: 'none',
                  cursor: 'pointer',
                  background: 'rgba(255,255,255,0.08)',
                  color: muted,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <X size={14} /> Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
