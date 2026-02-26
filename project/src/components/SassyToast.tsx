import { useState, useEffect } from 'react';

export type BookVibe =
  | 'dark-romance'
  | 'fantasy'
  | 'heartbreak'
  | 'fluffy'
  | 'thriller'
  | 'classic'
  | 'default';

// 🔥 ШУТКИ ПО ЖАНРАМ после сессии чтения
const SESSION_JOKES: Record<
  BookVibe,
  { few: string[]; good: string[]; beast: string[] }
> = {
  'dark-romance': {
    few: [
      'Just a taste... good girl 😏',
      'Barely started and already blushing? 🌹',
      "That's it? The villain is disappointed 💋",
      "A few pages? He wouldn't let you stop that easy 😈",
      'Teasing the book, are we? Naughty 🖤',
    ],
    good: [
      'Ooh, things are getting intense 🔥',
      'Bet your heart rate is UP right now 😏',
      "Who needs sleep when there's enemies-to-lovers? 🖤",
      "You're blushing. I know you're blushing 🌹",
      "The red flags are waving and you're RUNNING towards them 🚩💋",
    ],
    beast: [
      '200+ pages of dark romance? You okay bestie? 😈🔥',
      'Your Kindle needs a cold shower after that session 🚿',
      'Girl... GIRL... what chapter are you on?! 👀',
      'You devoured that like the villain devours the FMC 😏',
      'Touch grass? No. Touch the next chapter 🖤',
    ],
  },
  fantasy: {
    few: [
      'A quick visit to another realm ⚔️',
      'The quest begins with a single page 🗡️',
      'Even Frodo took breaks... I guess 🧝',
      'Training montage: page 1 📖✨',
      'Your magic power today: reading 🪄',
    ],
    good: [
      'The Chosen One is LOCKED IN 🔮',
      'Plot armor: activated ⚔️',
      'You just leveled up your reading stats! 📈✨',
      'Somewhere a dragon is proud of you 🐉',
      'Side quest complete: read a bunch of pages 🗡️',
    ],
    beast: [
      'You just read an entire quest arc 🏔️⚔️',
      'That was a full dungeon crawl of reading 🐉',
      "The prophecy said you'd read this much 📜✨",
      'Gandalf would say: you shall not STOP! 🧙‍♂️',
      'Achievement unlocked: Book Dragon 🐉📚',
    ],
  },
  heartbreak: {
    few: [
      "A few pages of pain... that's enough for now 🥺",
      "Your heart needed a break, that's okay 💔",
      'Even sadness needs to be sipped slowly 🫶',
      'Tissues: on standby 🤧',
      'Small dose of emotional damage today 💔',
    ],
    good: [
      'Who hurt you? Oh right, the author did 😭',
      "Are you crying? It's okay, we're all crying 🥺",
      'Your tears are watering the pages 💧📖',
      'This book chose violence against your feelings 💔',
      "Reminder: it's fiction... RIGHT?! 😭",
    ],
    beast: [
      'You read ALL of that heartbreak in one sitting?! 😭💔',
      "Bestie please drink water, you've cried enough 🥺💧",
      'Emotional damage: CRITICAL HIT 💥💔',
      'The author owes you therapy 🛋️😭',
      "You're not okay and that's okay 🫂",
    ],
  },
  fluffy: {
    few: [
      'A little serotonin boost 🌸',
      'Just a sprinkle of cute ✨',
      'Smiling already? Good 🥰',
      'Quick dose of happy 💛',
      'Like a warm hug in book form 🤗',
    ],
    good: [
      "You're literally glowing right now ✨🥰",
      'This book is giving serotonin OVERLOAD 🌈',
      "Bet you're smiling at your phone like a weirdo 😊📱",
      'Wholesome content consumed successfully 💛',
      'Your heart is so full right now 🫶',
    ],
    beast: [
      'You inhaled that like it was pure serotonin 🌸✨',
      'That much fluff should be illegal 🥰📚',
      "You're basically a Disney princess now 👑🌈",
      'Tooth-rotting sweetness: MAXIMUM 🍬💛',
      "You're radiating happiness and it's annoying (jk keep going) ✨",
    ],
  },
  thriller: {
    few: [
      'Just checking if the door is locked... 🔐',
      'A few pages of suspense... the tension builds 👀',
      'Plot twist: you stopped reading 😱',
      'The killer is watching you read... slowly 🔪',
      'Trust no one. Not even this notification 🕵️',
    ],
    good: [
      'WHO DID IT? Do you know yet?! 🔍',
      'Your trust issues are growing with each chapter 😅',
      'Plot twist after plot twist... your neck hurts 🌀',
      'Everyone is sus. EVERYONE 🕵️',
      "You're definitely sleeping with the lights on tonight 💡",
    ],
    beast: [
      'You read ALL of that without a bathroom break? Brave 😱',
      'Your FBI agent is impressed by your dedication 🕵️📚',
      'That was a full true crime binge but make it books 🔪📖',
      'You now know 7 ways to... never mind 👀',
      "Plot twist: you're the main character 🌀",
    ],
  },
  classic: {
    few: [
      'A few pages of literature. How distinguished 🎩',
      'Your English teacher would be proud 📖',
      'Sipping tea and reading classics... the vibe ☕',
      'Even a few pages of Tolstoy counts as exercise 💪',
      'Cultured AND casual. Love it 🎭',
    ],
    good: [
      'Look at you being all intellectual 🧐📚',
      'Your vocabulary just leveled up ✨',
      'Somewhere a literature professor shed a tear of joy 😢📖',
      "You're basically a scholar now. Put it on your resume 🎓",
      "Reading classics for fun? You're a different breed 👑",
    ],
    beast: [
      'You just read more classic lit than most do in a year 📜👑',
      "That was... actually impressive. Even I'm shook 🎩✨",
      'PhD in Reading: EARNED 🎓📚',
      'You and the author are basically besties now 🤝',
      'Dostoevsky wrote it, you CONSUMED it 🔥📖',
    ],
  },
  default: {
    few: [
      'A few pages? Every page counts! 📖',
      'Baby steps are still steps 🐾',
      'Even 1 page is better than 0! ✨',
      'Quick reading snack 🍪📚',
      'Not all heroes read 200 pages at once 💪',
    ],
    good: [
      "Nice session! You're on a roll 🔥",
      'Look at you being a bookworm! 🐛📚',
      'Your future self says thanks 🙌',
      'Reading > scrolling. You chose wisely 📖✨',
      'Brain: fed. Mood: elevated. You: amazing 💛',
    ],
    beast: [
      'ABSOLUTE BEAST MODE 🔥📚',
      "You didn't read, you DEVOURED 😤",
      'Somebody call 911, this book just got destroyed 🚨📖',
      'Your reading speed is illegal in 12 countries 🏎️💨',
      'Librarians everywhere just felt a disturbance 📚⚡',
    ],
  },
};

// 🎯 Шутки при добавлении книги в библиотеку
export const ADD_TO_LIBRARY_JOKES = [
  "Another one for the pile... you'll totally read it 😅",
  'TBR pile: *grows menacingly* 📚',
  "Bold of you to add more when you haven't finished the others 👀",
  'Your bookshelf just sighed 📖💨',
  'Added! Now it can collect dust with the rest — JK 😘',
  "Great choice! (That's what you said about the last 47 books) 📚",
  'The book has been chosen. The book is honored 🏆',
  'Your wallet just flinched 💸',
  'Welcome to the library of good intentions ✨',
  'Starting a new book before finishing the old ones? ICONIC 👑',
];

// 😱 Шутки о TBR когда > 5 книг в want-to-read
export const TBR_ROASTS = [
  'You have {count} unread books staring at you... judgmentally 👀',
  '{count} books in your TBR? Are you building a fort? 🏰',
  'Your TBR has more books than some libraries 📚😭',
  "New book? You have {count} waiting! They're forming a support group 🤝",
  "{count} books: 'Are we a joke to you?' 😤📖",
  "At this rate you'll finish your TBR by 2087 📅",
  'Your TBR needs its own zip code at this point 📬',
];

// 🌅 Приветствия по времени суток
export const TIME_GREETINGS = {
  morning: [
    'Morning bookworm! ☀️ Coffee + book = perfect start',
    'Rise and read! 📖☀️',
    'Good morning! Your books missed you overnight 🥺',
  ],
  afternoon: [
    'Afternoon reading session? Distinguished 🎩',
    'Perfect time to ignore responsibilities and read 📚',
    'Your afternoon is about to get way better 📖✨',
  ],
  evening: [
    'Evening reading mode: activated 🌙',
    "Cozy evening + good book = chef's kiss 🤌✨",
    "The night is young and so is your TBR... wait, no it's not 😅",
  ],
  night: [
    'Reading at this hour? *respect* 🌙📖',
    "One more chapter... we both know that's a lie 😏",
    'Sleep is for people without good books 🦇',
    '3 AM reading hits different 🌙✨',
  ],
};

export function getSessionJoke(
  pagesRead: number,
  vibe: BookVibe = 'default'
): string {
  const jokes = SESSION_JOKES[vibe] || SESSION_JOKES.default;

  let pool: string[];
  if (pagesRead <= 10) {
    pool = jokes.few;
  } else if (pagesRead <= 50) {
    pool = jokes.good;
  } else {
    pool = jokes.beast;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  let period: keyof typeof TIME_GREETINGS;

  if (hour >= 5 && hour < 12) period = 'morning';
  else if (hour >= 12 && hour < 17) period = 'afternoon';
  else if (hour >= 17 && hour < 22) period = 'evening';
  else period = 'night';

  const msgs = TIME_GREETINGS[period];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

// ============ TOAST COMPONENT ============

interface ToastProps {
  message: string;
  emoji?: string;
  onClose: () => void;
  duration?: number;
}

export function SassyToast({
  message,
  emoji = '📖',
  onClose,
  duration = 4000,
}: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);

    const timer = setTimeout(() => {
      setLeaving(true);
      setTimeout(onClose, 400);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      onClick={() => {
        setLeaving(true);
        setTimeout(onClose, 400);
      }}
      style={{
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: `translateX(-50%) translateY(${
          visible && !leaving ? '0' : '20px'
        })`,
        opacity: visible && !leaving ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        zIndex: 8000,
        maxWidth: '340px',
        width: '90%',
        padding: '14px 18px',
        borderRadius: '16px',
        background: 'rgba(30, 26, 24, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(196, 160, 124, 0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <span style={{ fontSize: '24px', flexShrink: 0 }}>{emoji}</span>
      <p
        style={{
          fontSize: '13px',
          color: '#e2ddd5',
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        {message}
      </p>
    </div>
  );
}
