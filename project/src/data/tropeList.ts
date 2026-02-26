export interface TropeInfo {
  key: string;
  label: string;
  emoji: string;
  category: string;
  description: string;
}

export const TROPE_CATEGORIES = [
  { key: 'popular', label: '🔥 Popular', color: '#e74c3c' },
  { key: 'dark', label: '🖤 Dark & Spicy', color: '#8b0000' },
  { key: 'power', label: '💰 Wealth & Power', color: '#c9a84c' },
  { key: 'supernatural', label: '🔮 Supernatural', color: '#9b59b6' },
  { key: 'forbidden', label: '🚫 Forbidden', color: '#e67e22' },
  { key: 'emotional', label: '💔 Emotional', color: '#3498db' },
  { key: 'fun', label: '🌸 Fun & Light', color: '#2ecc71' },
  { key: 'action', label: '⚔️ Action', color: '#95a5a6' },
];

export const ALL_TROPES: TropeInfo[] = [
  // 🔥 POPULAR
  {
    key: 'enemies-to-lovers',
    label: 'Enemies to Lovers',
    emoji: '⚔️→❤️',
    category: 'popular',
    description: 'They hate each other... at first',
  },
  {
    key: 'friends-to-lovers',
    label: 'Friends to Lovers',
    emoji: '👫→❤️',
    category: 'popular',
    description: 'Best friends catch feelings',
  },
  {
    key: 'slow-burn',
    label: 'Slow Burn',
    emoji: '🕯️',
    category: 'popular',
    description: 'The tension builds for CHAPTERS',
  },
  {
    key: 'forced-proximity',
    label: 'Forced Proximity',
    emoji: '🏠',
    category: 'popular',
    description: 'Stuck together, feelings happen',
  },
  {
    key: 'fake-dating',
    label: 'Fake Dating',
    emoji: '💍',
    category: 'popular',
    description: "Pretending... until it's real",
  },
  {
    key: 'grumpy-sunshine',
    label: 'Grumpy x Sunshine',
    emoji: '😠☀️',
    category: 'popular',
    description: 'Brooding meets bright & happy',
  },
  {
    key: 'only-one-bed',
    label: 'Only One Bed',
    emoji: '🛏️',
    category: 'popular',
    description: "Oh no... there's only one bed 😏",
  },
  {
    key: 'he-falls-first',
    label: 'He Falls First',
    emoji: '🫠',
    category: 'popular',
    description: "He's a GONER from day one",
  },
  {
    key: 'she-falls-first',
    label: 'She Falls First',
    emoji: '😍',
    category: 'popular',
    description: 'She catches feelings first',
  },
  {
    key: 'second-chance',
    label: 'Second Chance',
    emoji: '🔄',
    category: 'popular',
    description: 'Love gets another shot',
  },
  {
    key: 'love-triangle',
    label: 'Love Triangle',
    emoji: '📐',
    category: 'popular',
    description: 'Two options, one heart',
  },
  {
    key: 'found-family',
    label: 'Found Family',
    emoji: '🫂',
    category: 'popular',
    description: 'Chosen family > blood family',
  },
  {
    key: 'rivals',
    label: 'Rivals',
    emoji: '🏆',
    category: 'popular',
    description: 'Competition breeds attraction',
  },
  {
    key: 'opposites-attract',
    label: 'Opposites Attract',
    emoji: '🧲',
    category: 'popular',
    description: 'Total opposites, perfect match',
  },
  {
    key: 'forbidden-love',
    label: 'Forbidden Love',
    emoji: '🚷❤️',
    category: 'popular',
    description: "They shouldn't... but they DO",
  },
  {
    key: 'childhood-friends',
    label: 'Childhood Friends',
    emoji: '👶→❤️',
    category: 'popular',
    description: 'Known each other since kids',
  },
  {
    key: 'pining',
    label: 'Pining',
    emoji: '💭',
    category: 'popular',
    description: 'Longing looks and unspoken feelings',
  },

  // 🖤 DARK & SPICY
  {
    key: 'morally-grey',
    label: 'Morally Grey',
    emoji: '🐺',
    category: 'dark',
    description: 'Not a villain, not a hero... perfect',
  },
  {
    key: 'possessive-hero',
    label: 'Possessive Hero',
    emoji: '😤',
    category: 'dark',
    description: '"You\'re MINE" energy',
  },
  {
    key: 'obsessed-hero',
    label: 'Obsessed Hero',
    emoji: '🖤👁️',
    category: 'dark',
    description: "He's not just in love, he's OBSESSED",
  },
  {
    key: 'villain-romance',
    label: 'Villain Romance',
    emoji: '😈',
    category: 'dark',
    description: 'Fall for the bad guy',
  },
  {
    key: 'stalker-romance',
    label: 'Stalker Romance',
    emoji: '👁️',
    category: 'dark',
    description: 'He watches from the shadows',
  },
  {
    key: 'masked-man',
    label: 'Masked Man',
    emoji: '🎭',
    category: 'dark',
    description: "Who's behind the mask?",
  },
  {
    key: 'captive-romance',
    label: 'Captive Romance',
    emoji: '⛓️',
    category: 'dark',
    description: 'Taken, but feelings develop',
  },
  {
    key: 'dark-protector',
    label: 'Dark Protector',
    emoji: '🛡️🖤',
    category: 'dark',
    description: 'Dangerous, but protective of HER',
  },
  {
    key: 'touch-her-and-die',
    label: 'Touch Her & Die',
    emoji: '💀',
    category: 'dark',
    description: "Hurt her? You're dead.",
  },
  {
    key: 'who-did-this-to-you',
    label: 'Who Did This to You',
    emoji: '🔥😤',
    category: 'dark',
    description: 'Protective rage unlocked',
  },
  {
    key: 'anti-hero',
    label: 'Anti-Hero',
    emoji: '🗡️',
    category: 'dark',
    description: 'Doing bad things for good reasons',
  },
  {
    key: 'bratty-heroine',
    label: 'Bratty Heroine',
    emoji: '👸😏',
    category: 'dark',
    description: 'She talks back and he LOVES it',
  },
  {
    key: 'praise-kink',
    label: 'Praise Kink',
    emoji: '✨👄',
    category: 'dark',
    description: '"Good girl" hits different',
  },
  {
    key: 'dominant-hero',
    label: 'Dominant Hero',
    emoji: '👔',
    category: 'dark',
    description: 'He takes control',
  },
  {
    key: 'revenge',
    label: 'Revenge',
    emoji: '🗡️🔥',
    category: 'dark',
    description: 'Vengeance drives the plot',
  },
  {
    key: 'monster-romance',
    label: 'Monster Romance',
    emoji: '👹❤️',
    category: 'dark',
    description: 'Not human, very attractive',
  },
  {
    key: 'size-difference',
    label: 'Size Difference',
    emoji: '📏',
    category: 'dark',
    description: "He's huge, she's tiny",
  },
  {
    key: 'redemption-arc',
    label: 'Redemption Arc',
    emoji: '🌅',
    category: 'dark',
    description: 'Bad boy becomes better',
  },

  // 💰 WEALTH & POWER
  {
    key: 'billionaire',
    label: 'Billionaire',
    emoji: '💰',
    category: 'power',
    description: 'Obscenely rich hero',
  },
  {
    key: 'ceo-romance',
    label: 'CEO Romance',
    emoji: '👔💼',
    category: 'power',
    description: 'The boss is hot',
  },
  {
    key: 'royalty',
    label: 'Royalty',
    emoji: '👑',
    category: 'power',
    description: 'Kings, queens, princes, princesses',
  },
  {
    key: 'mafia-boss',
    label: 'Mafia Boss',
    emoji: '🔫🖤',
    category: 'power',
    description: 'Crime lord falls in love',
  },
  {
    key: 'power-imbalance',
    label: 'Power Imbalance',
    emoji: '⚖️',
    category: 'power',
    description: 'One has all the power',
  },
  {
    key: 'sugar-daddy',
    label: 'Sugar Daddy',
    emoji: '💎',
    category: 'power',
    description: 'He spoils her rotten',
  },
  {
    key: 'arranged-marriage',
    label: 'Arranged Marriage',
    emoji: '💒',
    category: 'power',
    description: 'Married first, love later',
  },
  {
    key: 'bodyguard',
    label: 'Bodyguard',
    emoji: '🕶️',
    category: 'power',
    description: 'Protector falls for the protected',
  },

  // 🔮 SUPERNATURAL
  {
    key: 'fated-mates',
    label: 'Fated Mates',
    emoji: '🔗❤️',
    category: 'supernatural',
    description: "Destiny says they're meant to be",
  },
  {
    key: 'magical-bond',
    label: 'Magical Bond',
    emoji: '✨🔗',
    category: 'supernatural',
    description: 'Connected by magic',
  },
  {
    key: 'vampire-romance',
    label: 'Vampire Romance',
    emoji: '🧛',
    category: 'supernatural',
    description: 'Fangs and feelings',
  },
  {
    key: 'werewolf-romance',
    label: 'Werewolf Romance',
    emoji: '🐺🌙',
    category: 'supernatural',
    description: 'Howling at the moon for love',
  },
  {
    key: 'shifter-romance',
    label: 'Shifter Romance',
    emoji: '🦊',
    category: 'supernatural',
    description: 'Shape-shifting lovers',
  },
  {
    key: 'witch-romance',
    label: 'Witch Romance',
    emoji: '🧙‍♀️',
    category: 'supernatural',
    description: 'Magic and romance',
  },
  {
    key: 'reverse-harem',
    label: 'Reverse Harem',
    emoji: '👸👑👑👑',
    category: 'supernatural',
    description: 'Why choose? She gets them ALL',
  },
  {
    key: 'chosen-one',
    label: 'Chosen One',
    emoji: '⭐',
    category: 'supernatural',
    description: "Prophecy says they're special",
  },
  {
    key: 'portal-fantasy',
    label: 'Portal Fantasy',
    emoji: '🌀',
    category: 'supernatural',
    description: 'Transported to another world',
  },

  // 🚫 FORBIDDEN
  {
    key: 'priest-romance',
    label: 'Priest Romance',
    emoji: '⛪😈',
    category: 'forbidden',
    description: 'Forgive me father... 😏',
  },
  {
    key: 'teacher-student',
    label: 'Teacher/Student',
    emoji: '📚👨‍🏫',
    category: 'forbidden',
    description: 'Forbidden academic attraction',
  },
  {
    key: 'boss-employee',
    label: 'Boss/Employee',
    emoji: '👔💼',
    category: 'forbidden',
    description: 'Office romance, big risk',
  },
  {
    key: 'age-gap',
    label: 'Age Gap',
    emoji: '🔢',
    category: 'forbidden',
    description: 'Significant age difference',
  },
  {
    key: 'brother-best-friend',
    label: "Brother's Best Friend",
    emoji: '🚷🔥',
    category: 'forbidden',
    description: 'Off limits... or is he?',
  },
  {
    key: 'best-friends-sibling',
    label: "Best Friend's Sibling",
    emoji: '👫🚫',
    category: 'forbidden',
    description: "Your BFF's hot sibling",
  },
  {
    key: 'single-parent',
    label: 'Single Parent',
    emoji: '👶❤️',
    category: 'forbidden',
    description: 'Falling for someone with a kid',
  },
  {
    key: 'nanny-romance',
    label: 'Nanny Romance',
    emoji: '👶🏠',
    category: 'forbidden',
    description: 'The nanny catches feelings',
  },
  {
    key: 'step-siblings',
    label: 'Step-Siblings',
    emoji: '🏠🚫',
    category: 'forbidden',
    description: 'Not blood, still taboo',
  },
  {
    key: 'secret-identity',
    label: 'Secret Identity',
    emoji: '🎭',
    category: 'forbidden',
    description: "They're hiding who they really are",
  },

  // 💔 EMOTIONAL
  {
    key: 'hurt-comfort',
    label: 'Hurt/Comfort',
    emoji: '🩹❤️',
    category: 'emotional',
    description: 'Pain healed by love',
  },
  {
    key: 'broken-hero',
    label: 'Broken Hero',
    emoji: '💔🗡️',
    category: 'emotional',
    description: 'Damaged, but she fixes him',
  },
  {
    key: 'sunshine-protects-grumpy',
    label: 'Sunshine Protects Grumpy',
    emoji: '☀️🛡️',
    category: 'emotional',
    description: 'The soft one is actually fierce',
  },
  {
    key: 'forced-marriage',
    label: 'Forced Marriage',
    emoji: '💒⛓️',
    category: 'emotional',
    description: 'Married against their will',
  },
  {
    key: 'marriage-of-convenience',
    label: 'Marriage of Convenience',
    emoji: '💒📋',
    category: 'emotional',
    description: 'Business deal becomes love',
  },
  {
    key: 'miscommunication',
    label: 'Miscommunication',
    emoji: '🗣️❌',
    category: 'emotional',
    description: 'Just TALK to each other!',
  },
  {
    key: 'unrequited-love',
    label: 'Unrequited Love',
    emoji: '💔😢',
    category: 'emotional',
    description: "Loving someone who doesn't love back",
  },
  {
    key: 'one-that-got-away',
    label: 'One That Got Away',
    emoji: '🚶💨',
    category: 'emotional',
    description: 'The love that almost was',
  },
  {
    key: 'widower-romance',
    label: 'Widower Romance',
    emoji: '🕯️❤️',
    category: 'emotional',
    description: 'Finding love after loss',
  },
  {
    key: 'amnesia',
    label: 'Amnesia',
    emoji: '🧠❓',
    category: 'emotional',
    description: 'Forgotten memories, rediscovered love',
  },

  // 🌸 FUN & LIGHT
  {
    key: 'road-trip',
    label: 'Road Trip',
    emoji: '🚗',
    category: 'fun',
    description: 'Adventure on the open road',
  },
  {
    key: 'coworkers-to-lovers',
    label: 'Coworkers to Lovers',
    emoji: '💼❤️',
    category: 'fun',
    description: 'Office romance done right',
  },
  {
    key: 'neighbors',
    label: 'Neighbors',
    emoji: '🏘️',
    category: 'fun',
    description: 'Love next door',
  },
  {
    key: 'bet-dare',
    label: 'Bet / Dare',
    emoji: '🎲',
    category: 'fun',
    description: 'It started as a bet...',
  },
  {
    key: 'holiday-romance',
    label: 'Holiday Romance',
    emoji: '🎄',
    category: 'fun',
    description: 'Seasonal love story',
  },
  {
    key: 'bookish-heroine',
    label: 'Bookish Heroine',
    emoji: '📚👩',
    category: 'fun',
    description: 'She loves books (relatable!)',
  },
  {
    key: 'matchmaker',
    label: 'Matchmaker',
    emoji: '💘',
    category: 'fun',
    description: 'Setting others up... finding own love',
  },

  // ⚔️ ACTION
  {
    key: 'military-romance',
    label: 'Military Romance',
    emoji: '🎖️',
    category: 'action',
    description: 'Soldier falls in love',
  },
  {
    key: 'spy-romance',
    label: 'Spy Romance',
    emoji: '🕵️',
    category: 'action',
    description: 'Secret agents, secret feelings',
  },
  {
    key: 'detective-romance',
    label: 'Detective Romance',
    emoji: '🔍',
    category: 'action',
    description: 'Solving crimes and catching feelings',
  },
  {
    key: 'survival',
    label: 'Survival',
    emoji: '🏔️',
    category: 'action',
    description: 'Surviving together builds bonds',
  },
  {
    key: 'heist',
    label: 'Heist',
    emoji: '💎🏃',
    category: 'action',
    description: 'Stealing things (and hearts)',
  },
];

// Helper: get trope info
export function getTropeInfo(key: string): TropeInfo | undefined {
  return ALL_TROPES.find((t) => t.key === key);
}

// Helper: get tropes by category
export function getTropesByCategory(category: string): TropeInfo[] {
  return ALL_TROPES.filter((t) => t.category === category);
}

// Helper: search tropes
export function searchTropes(query: string): TropeInfo[] {
  const q = query.toLowerCase();
  return ALL_TROPES.filter(
    (t) =>
      t.label.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.key.includes(q)
  );
}
