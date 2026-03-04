import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

const tools = [
  {
    to: '/if-you-liked',
    emoji: '💡',
    title: 'If You Liked...',
    description: 'smart recommendations',
  },
  {
    to: '/quiz',
    emoji: '✨',
    title: 'Vibe Match',
    description: 'find by mood',
  },
  {
    to: '/spin',
    emoji: '🎰',
    title: 'Spin a Book',
    description: 'random pick',
  },
  {
    to: '/tbr',
    emoji: '📚',
    title: 'TBR Builder',
    description: 'plan your reading',
  },
  {
    to: '/cycle',
    emoji: '🌙',
    title: 'Cycle Mode',
    description: 'books for your phase',
  },
];

export default function DiscoverPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-24">
      <h1
        style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '32px',
          fontWeight: 700,
          color: '#e2ddd5',
          marginBottom: '4px',
        }}
      >
        Discover
      </h1>
      <p style={{ color: muted, fontSize: '13px', marginBottom: '24px' }}>
        find your next obsession
      </p>

      {/* Поиск */}
      <button
        onClick={() => navigate('/search')}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '14px',
          background: '#1a1614',
          border: '1px solid rgba(255,255,255,0.06)',
          color: muted,
          fontSize: '14px',
          cursor: 'pointer',
          marginBottom: '24px',
          transition: 'border-color 0.2s',
        }}
      >
        <Search size={16} />
        <span>books, authors, tropes...</span>
      </button>

      {/* Инструменты */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tools.map((tool) => (
          <button
            key={tool.to}
            onClick={() => navigate(tool.to)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '18px 20px',
              borderRadius: '16px',
              background: '#1a1614',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#e2ddd5',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: '28px' }}>{tool.emoji}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>
                {tool.title}
              </div>
              <div style={{ fontSize: '12px', color: muted, marginTop: '2px' }}>
                {tool.description}
              </div>
            </div>
            <span style={{ marginLeft: 'auto', color: muted, fontSize: '18px' }}>
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
