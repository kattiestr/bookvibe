import { useEffect, useState } from 'react';

const MESSAGES = [
  { title: '🎉 YOU DID IT!', sub: 'Another one bites the dust!' },
  { title: '📚 BOOK COMPLETE!', sub: 'Your TBR is shaking right now' },
  { title: '🏆 FINISHED!', sub: "You're basically a reading machine" },
  { title: '✨ AMAZING!', sub: "That book didn't stand a chance" },
  { title: '🎊 CONGRATS!', sub: 'Your bookshelf is so proud of you' },
  { title: '🔥 SLAYED IT!', sub: 'One down, a million to go (worth it)' },
  { title: '💪 UNSTOPPABLE!', sub: 'Sleep is overrated anyway' },
  { title: '📖 DONE!', sub: 'Time to start the next one... right?' },
  { title: '🌟 INCREDIBLE!', sub: 'You + books = the best love story' },
  { title: '🎆 WOW!', sub: 'That was fast! Are you even human?' },
];

const FOLLOW_UPS = [
  "Don't forget to rate it! ⭐",
  "Write your thoughts while they're fresh 📝",
  'Time to recommend it to everyone 😤',
  'Post-book depression incoming in 3... 2... 1... 💔',
  "Now the real question: what's next? 🤔",
  'You earned a snack break 🍪',
];

const EMOJIS = [
  '🎉',
  '✨',
  '🌟',
  '💫',
  '🎊',
  '⭐',
  '🔥',
  '💛',
  '📚',
  '🏆',
  '❤️',
  '🦋',
  '🌸',
  '🎆',
];
const COLORS = [
  '#c4a07c',
  '#c9a84c',
  '#e2ddd5',
  '#e8a838',
  '#d4738a',
  '#8aa8d0',
  '#6b9e7a',
];

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
  speed: number;
  drift: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface Props {
  bookTitle: string;
  onClose: () => void;
}

function ConfettiCanvas() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Create particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 40,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        size: 12 + Math.random() * 18,
        speed: 1 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 0.7 + Math.random() * 0.3,
      });
    }
    setParticles(newParticles);

    // Animate
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y + p.speed,
            x: p.x + p.drift * 0.3,
            rotation: p.rotation + p.rotationSpeed,
            opacity: p.y > 80 ? Math.max(p.opacity - 0.02, 0) : p.opacity,
          }))
          .filter((p) => p.y < 110)
      );
    }, 50);

    // Add more particles after a delay
    const timeout1 = setTimeout(() => {
      setParticles((prev) => [
        ...prev,
        ...Array.from({ length: 20 }, (_, i) => ({
          id: 100 + i,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
          size: 14 + Math.random() * 16,
          speed: 1.5 + Math.random() * 2,
          drift: (Math.random() - 0.5) * 3,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 8,
          opacity: 0.8 + Math.random() * 0.2,
        })),
      ]);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout1);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10000,
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            transition: 'none',
            pointerEvents: 'none',
          }}
        >
          {p.emoji}
        </div>
      ))}
      {/* Color dots */}
      {Array.from({ length: 30 }, (_, i) => {
        const startX = Math.random() * 100;
        const startY = -5 - Math.random() * 30;
        return (
          <div
            key={`dot-${i}`}
            style={{
              position: 'absolute',
              left: `${startX}%`,
              top: `${startY + (Date.now() % 3000) / 30}%`,
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              borderRadius: '50%',
              background: COLORS[i % COLORS.length],
              opacity: 0.6,
              animation: `confettiFall ${
                2 + Math.random() * 2
              }s linear forwards`,
              animationDelay: `${Math.random() * 1.5}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function Celebration({ bookTitle, onClose }: Props) {
  const [message] = useState(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
  );
  const [followUp] = useState(
    () => FOLLOW_UPS[Math.floor(Math.random() * FOLLOW_UPS.length)]
  );
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 50);
  }, []);

  return (
    <>
      <ConfettiCanvas />
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          background: 'rgba(20,16,16,0.92)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            transform: show
              ? 'scale(1) translateY(0)'
              : 'scale(0.8) translateY(20px)',
            transition:
              'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
        >
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '42px',
              fontWeight: 700,
              color: '#e2ddd5',
              lineHeight: 1.1,
              marginBottom: '12px',
            }}
          >
            {message.title}
          </h1>

          <p
            style={{ fontSize: '16px', color: '#c4a07c', marginBottom: '20px' }}
          >
            {message.sub}
          </p>

          <div
            style={{
              padding: '16px 24px',
              borderRadius: '14px',
              background: 'rgba(196,160,124,0.08)',
              border: '1px solid rgba(196,160,124,0.2)',
              marginBottom: '20px',
            }}
          >
            <p
              style={{
                fontSize: '11px',
                color: '#5c5450',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: '4px',
              }}
            >
              you just finished
            </p>
            <p
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '20px',
                fontWeight: 600,
                color: '#e2ddd5',
              }}
            >
              {bookTitle}
            </p>
          </div>

          <p
            style={{
              fontSize: '14px',
              color: '#8a8480',
              fontStyle: 'italic',
              marginBottom: '32px',
            }}
          >
            {followUp}
          </p>

          <button
            onClick={onClose}
            style={{
              padding: '14px 36px',
              borderRadius: '25px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              background: '#c4a07c',
              color: '#141010',
            }}
          >
            Continue ✨
          </button>

          <p style={{ fontSize: '11px', color: '#3a3530', marginTop: '16px' }}>
            tap anywhere to close
          </p>
        </div>
      </div>
    </>
  );
}
