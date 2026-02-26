import { useState } from 'react';
import { X } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

interface DNFModalProps {
  bookTitle: string;
  bookId: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

const SUPPORT_MESSAGES = [
  "Life's too short for books that don't spark joy ✨",
  "Marie Kondo would be proud — if it doesn't spark joy, let it go 🧹",
  "You didn't fail the book. The book failed YOU 💅",
  "Not every love story works out. This one just wasn't meant to be 💔📖",
  "DNF = Did Nothing Fatal. You're fine, bestie 😌",
  'Your TBR pile just breathed a sigh of relief 📚💨',
  'Plot twist: the real main character is you, moving on 👑',
  'Some books are like bad dates — better to leave early 🚪',
  'You just freed up time for a book that actually deserves you 🌟',
  'Abandoning a book is self-care. Look it up 💆‍♀️',
  'A DNF today is a better book tomorrow 🔮',
  'Readers who DNF are just efficient queens 👸',
];

const QUICK_REASONS = [
  '😴 Too slow / boring',
  '😤 Annoying characters',
  '📉 Lost interest',
  '🤮 Bad writing style',
  '😬 Not what I expected',
  '🔥 Too much hype, not enough substance',
  "💤 Couldn't connect",
  '⏰ Not the right time',
];

export default function DNFModal({
  bookTitle,
  bookId,
  onConfirm,
  onCancel,
}: DNFModalProps) {
  const [reason, setReason] = useState('');
  const [supportMsg] = useState(
    () => SUPPORT_MESSAGES[Math.floor(Math.random() * SUPPORT_MESSAGES.length)]
  );

  const handleQuickReason = (quickReason: string) => {
    const clean = quickReason.replace(/^[^\s]+ /, ''); // remove emoji prefix
    setReason((prev) => (prev ? `${prev}, ${clean}` : clean));
  };

  const handleConfirm = () => {
    if (reason.trim()) {
      localStorage.setItem(`dnf-reason-${bookId}`, reason.trim());
    }
    onConfirm(reason.trim());
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          borderRadius: '20px',
          background: '#1e1a18',
          border: '1px solid #2a2520',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 20px 16px',
            textAlign: 'center',
            background: 'rgba(176,80,80,0.06)',
            borderBottom: '1px solid #2a2520',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={18} color={muted} />
          </button>

          <p style={{ fontSize: '40px', marginBottom: '8px' }}>📖💨</p>
          <h2
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '18px',
              fontWeight: 700,
              color: '#e2ddd5',
              marginBottom: '6px',
            }}
          >
            Breaking up with a book?
          </h2>
          <p
            style={{
              fontSize: '12px',
              color: muted,
              lineHeight: 1.5,
            }}
          >
            You're about to DNF{' '}
            <span style={{ color: accent, fontWeight: 600 }}>
              "{bookTitle}"
            </span>
          </p>
        </div>

        {/* Support message */}
        <div
          style={{
            margin: '16px 16px 0',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(196,160,124,0.06)',
            border: `1px solid ${accent}22`,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              color: accent,
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {supportMsg}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '16px' }}>
          {/* Quick reasons */}
          <p
            style={{
              fontSize: '10px',
              color: muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            Quick reasons (optional)
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              marginBottom: '14px',
            }}
          >
            {QUICK_REASONS.map((qr) => (
              <button
                key={qr}
                onClick={() => handleQuickReason(qr)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#2a2520',
                  color: '#b0a89e',
                  fontSize: '11px',
                  transition: 'all 0.2s',
                }}
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Custom reason */}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Or write your own reason... (totally optional)"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid #2a2520',
              background: '#141010',
              color: '#e2ddd5',
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
              minHeight: '50px',
              fontFamily: 'inherit',
              lineHeight: 1.5,
            }}
          />

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                background: '#2a2520',
                color: muted,
                fontSize: '13px',
              }}
            >
              Keep reading
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                background: '#b05050',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              💀 DNF it
            </button>
          </div>

          {/* Reassurance */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '10px',
              color: '#3a3530',
              marginTop: '12px',
              lineHeight: 1.5,
            }}
          >
            There are 130 million books in the world. You don't owe this one
            your time 💛
          </p>
        </div>
      </div>
    </div>
  );
}
