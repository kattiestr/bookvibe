import { useState, useEffect } from 'react';
import { useLibrary } from '../hooks/LibraryContext';
import { Pencil, Check, Target } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

const STORAGE_KEY = 'bookvibe-goals';

interface Goals {
  enGoal: number;
  ruGoal: number;
  year: number;
}

const MOTIVATIONS_EN = [
  "You're crushing it! 💪",
  'Reading machine mode: ON 🤖',
  'Your English shelf is growing! 📚',
  'Shakespeare would be proud 🎭',
  'Keep going, bookworm! 🐛',
];

const MOTIVATIONS_RU = [
  'Красавица! Так держать! 💪',
  'Пушкин бы одобрил 📜',
  'Книжный червячок в деле! 🐛',
  'Твоя полка гордится тобой 📚',
  'Ещё чуть-чуть! Ты сможешь! ✨',
];

const DONE_MESSAGES = [
  "🎉 GOAL COMPLETE! You're a legend!",
  '🏆 You did it! Time to set a bigger goal 😏',
  '👑 Goal crushed! Absolute queen behavior',
  '🌟 Over-achiever alert! Amazing!',
];

export default function ReadingGoals() {
  const { library } = useLibrary();
  const currentYear = new Date().getFullYear();

  const [goals, setGoals] = useState<Goals>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.year === currentYear) return parsed;
      }
    } catch {}
    return { enGoal: 12, ruGoal: 12, year: currentYear };
  });

  const [editingEn, setEditingEn] = useState(false);
  const [editingRu, setEditingRu] = useState(false);
  const [enInput, setEnInput] = useState('');
  const [ruInput, setRuInput] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  // Count finished books this year by language
  const finishedThisYear = library.filter((b) => {
    if (b.status !== 'finished' && b.status !== 'read-before') return false;
    if (!b.dateFinished) return false;
    return new Date(b.dateFinished).getFullYear() === currentYear;
  });

  const enDone = finishedThisYear.filter((b) => b.language === 'en').length;
  const ruDone = finishedThisYear.filter((b) => b.language === 'ru').length;
  const totalDone = enDone + ruDone;
  const totalGoal = goals.enGoal + goals.ruGoal;

  const enPercent =
    goals.enGoal > 0
      ? Math.min(Math.round((enDone / goals.enGoal) * 100), 100)
      : 0;
  const ruPercent =
    goals.ruGoal > 0
      ? Math.min(Math.round((ruDone / goals.ruGoal) * 100), 100)
      : 0;
  const totalPercent =
    totalGoal > 0
      ? Math.min(Math.round((totalDone / totalGoal) * 100), 100)
      : 0;

  const getMotivation = (done: number, goal: number, msgs: string[]) => {
    if (done >= goal && goal > 0)
      return DONE_MESSAGES[Math.floor(Math.random() * DONE_MESSAGES.length)];
    const pct = goal > 0 ? done / goal : 0;
    if (pct >= 0.75) return 'Almost there! The finish line is in sight! 🏁';
    if (pct >= 0.5) return "Halfway! You're doing amazing! 🎯";
    if (pct >= 0.25) return msgs[Math.floor(Math.random() * msgs.length)];
    if (done > 0) return 'Great start! Keep the momentum going! 🚀';
    return "Let's get reading! Your first book awaits ✨";
  };

  const saveEn = () => {
    const val = parseInt(enInput);
    if (!isNaN(val) && val > 0) setGoals((g) => ({ ...g, enGoal: val }));
    setEditingEn(false);
  };

  const saveRu = () => {
    const val = parseInt(ruInput);
    if (!isNaN(val) && val > 0) setGoals((g) => ({ ...g, ruGoal: val }));
    setEditingRu(false);
  };

  const monthsLeft = 12 - new Date().getMonth();
  const booksLeft = Math.max(totalGoal - totalDone, 0);
  const booksPerMonth = monthsLeft > 0 ? Math.ceil(booksLeft / monthsLeft) : 0;

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '14px',
        background: '#1a1614',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <Target size={16} color={accent} />
        <p
          style={{
            fontSize: '11px',
            color: muted,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          {currentYear} Reading Goals
        </p>
      </div>

      {/* Total Progress */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <p
          style={{
            fontSize: '40px',
            fontWeight: 700,
            color: '#e2ddd5',
            lineHeight: 1,
          }}
        >
          {totalDone}{' '}
          <span style={{ fontSize: '18px', color: muted }}>/ {totalGoal}</span>
        </p>
        <div
          style={{
            height: '8px',
            borderRadius: '4px',
            background: '#2a2520',
            margin: '12px 0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${totalPercent}%`,
              height: '100%',
              borderRadius: '4px',
              background: totalPercent >= 100 ? '#6b9e7a' : accent,
              transition: 'width 0.5s',
            }}
          />
        </div>
        <p
          style={{
            fontSize: '12px',
            color: totalPercent >= 100 ? '#6b9e7a' : accent,
            fontWeight: 600,
          }}
        >
          {totalPercent}% complete
        </p>
        {booksLeft > 0 && (
          <p style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>
            {booksLeft} books left · ~{booksPerMonth}/month to reach your goal
          </p>
        )}
      </div>

      {/* English Goal */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#e2ddd5' }}>🇬🇧 English</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: accent }}>
              {enDone}
            </span>
            <span style={{ fontSize: '11px', color: muted }}>/</span>
            {!editingEn ? (
              <button
                onClick={() => {
                  setEditingEn(true);
                  setEnInput(goals.enGoal.toString());
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '13px', color: muted }}>
                  {goals.enGoal}
                </span>
                <Pencil size={10} color={muted} />
              </button>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <input
                  type="number"
                  value={enInput}
                  onChange={(e) => setEnInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveEn()}
                  style={{
                    width: '40px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${accent}`,
                    background: '#141010',
                    color: '#e2ddd5',
                    fontSize: '12px',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
                <button
                  onClick={saveEn}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={12} color={accent} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            height: '6px',
            borderRadius: '3px',
            background: '#2a2520',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${enPercent}%`,
              height: '100%',
              borderRadius: '3px',
              background: enPercent >= 100 ? '#6b9e7a' : '#8aa8d0',
              transition: 'width 0.5s',
            }}
          />
        </div>
        <p
          style={{
            fontSize: '10px',
            color: muted,
            marginTop: '4px',
            fontStyle: 'italic',
          }}
        >
          {getMotivation(enDone, goals.enGoal, MOTIVATIONS_EN)}
        </p>
      </div>

      {/* Russian Goal */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#e2ddd5' }}>🇷🇺 Русский</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: accent }}>
              {ruDone}
            </span>
            <span style={{ fontSize: '11px', color: muted }}>/</span>
            {!editingRu ? (
              <button
                onClick={() => {
                  setEditingRu(true);
                  setRuInput(goals.ruGoal.toString());
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '13px', color: muted }}>
                  {goals.ruGoal}
                </span>
                <Pencil size={10} color={muted} />
              </button>
            ) : (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <input
                  type="number"
                  value={ruInput}
                  onChange={(e) => setRuInput(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveRu()}
                  style={{
                    width: '40px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: `1px solid ${accent}`,
                    background: '#141010',
                    color: '#e2ddd5',
                    fontSize: '12px',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
                <button
                  onClick={saveRu}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={12} color={accent} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            height: '6px',
            borderRadius: '3px',
            background: '#2a2520',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${ruPercent}%`,
              height: '100%',
              borderRadius: '3px',
              background: ruPercent >= 100 ? '#6b9e7a' : '#d4738a',
              transition: 'width 0.5s',
            }}
          />
        </div>
        <p
          style={{
            fontSize: '10px',
            color: muted,
            marginTop: '4px',
            fontStyle: 'italic',
          }}
        >
          {getMotivation(ruDone, goals.ruGoal, MOTIVATIONS_RU)}
        </p>
      </div>
    </div>
  );
}
