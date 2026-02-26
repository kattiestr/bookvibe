import type { BookVibe } from './SassyToast';

const VIBES: { key: BookVibe; label: string; emoji: string }[] = [
  { key: 'dark-romance', label: 'Dark Romance', emoji: '🖤' },
  { key: 'fluffy', label: 'Fluffy / Rom-com', emoji: '🌸' },
  { key: 'spicy', label: 'Spicy 🌶️', emoji: '🔥' },
  { key: 'fantasy', label: 'Fantasy', emoji: '⚔️' },
  { key: 'heartbreak', label: 'Heartbreak', emoji: '💔' },
  { key: 'thriller', label: 'Thriller', emoji: '🔪' },
  { key: 'classic', label: 'Classic Lit', emoji: '🎩' },
  { key: 'default', label: 'Other', emoji: '📖' },
];

const accent = '#c4a07c';
const muted = '#5c5450';

interface Props {
  selected: BookVibe;
  onChange: (vibe: BookVibe) => void;
}

export default function VibeSelector({ selected, onChange }: Props) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p
        style={{
          fontSize: '11px',
          color: muted,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '8px',
        }}
      >
        Book Vibe 🎭
      </p>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {VIBES.map((v) => (
          <button
            key={v.key}
            onClick={() => onChange(v.key)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              border: 'none',
              cursor: 'pointer',
              background: selected === v.key ? accent : '#1e1a18',
              color: selected === v.key ? '#141010' : muted,
              fontWeight: selected === v.key ? 700 : 400,
              transition: 'all 0.2s',
            }}
          >
            {v.emoji} {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
