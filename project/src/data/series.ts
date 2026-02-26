export interface SeriesInfo {
  name: string;
  totalBooks: number | null;
  completed: boolean;
  joke?: string;
}

export const seriesDatabase: Record<string, SeriesInfo> = {
  'The Empyrean': {
    name: 'The Empyrean',
    totalBooks: 5,
    completed: false,
    joke: 'Rebecca Yarros is writing as fast as she can... we hope 🐉',
  },
  ACOTAR: {
    name: 'A Court of Thorns and Roses',
    totalBooks: 5,
    completed: false,
    joke: 'SJM keeps us waiting and we keep buying 👑',
  },
  'Crescent City': {
    name: 'Crescent City',
    totalBooks: 3,
    completed: true,
  },
  'Blood and Ash': {
    name: 'Blood and Ash',
    totalBooks: 6,
    completed: false,
    joke: 'JLA never stops writing. We never stop reading. 📖',
  },
  'The Powerless Trilogy': {
    name: 'The Powerless Trilogy',
    totalBooks: 3,
    completed: false,
    joke: "Fearless is coming... we're not ready 💀",
  },
  'The Folk of the Air': {
    name: 'The Folk of the Air',
    totalBooks: 3,
    completed: true,
  },
  'Kingdom of the Wicked': {
    name: 'Kingdom of the Wicked',
    totalBooks: 3,
    completed: true,
  },
  'Throne of Glass': {
    name: 'Throne of Glass',
    totalBooks: 8,
    completed: true,
  },
  'The Bridge Kingdom': {
    name: 'The Bridge Kingdom',
    totalBooks: 4,
    completed: true,
  },
  'These Hollow Vows': {
    name: 'These Hollow Vows',
    totalBooks: 2,
    completed: true,
  },
  'Celestial Kingdom': {
    name: 'Celestial Kingdom',
    totalBooks: 2,
    completed: true,
  },
  'Cat and Mouse Duet': {
    name: 'Cat and Mouse Duet',
    totalBooks: 2,
    completed: true,
  },
  'Legacy of Gods': {
    name: 'Legacy of Gods',
    totalBooks: 6,
    completed: true,
  },
  'The Ruinous Love Trilogy': {
    name: 'The Ruinous Love Trilogy',
    totalBooks: 3,
    completed: true,
  },
  "Devil's Night": {
    name: "Devil's Night",
    totalBooks: 5,
    completed: true,
  },
  'Fall Away': {
    name: 'Fall Away',
    totalBooks: 5,
    completed: true,
  },
  Twisted: {
    name: 'Twisted',
    totalBooks: 4,
    completed: true,
  },
  'Kings of Sin': {
    name: 'Kings of Sin',
    totalBooks: 4,
    completed: true,
  },
  'Maple Hills': {
    name: 'Maple Hills',
    totalBooks: 3,
    completed: true,
  },
  'Windy City': {
    name: 'Windy City',
    totalBooks: 5,
    completed: false,
    joke: 'Liz Tomforde keeps adding more athletes to love 🏒⚾🏀',
  },
  'Vancouver Storm': {
    name: 'Vancouver Storm',
    totalBooks: 4,
    completed: false,
    joke: 'More hockey boys are on the way 🏒',
  },
  'Born in Blood Mafia Chronicles': {
    name: 'Born in Blood Mafia Chronicles',
    totalBooks: 9,
    completed: true,
  },
  Made: {
    name: 'Made',
    totalBooks: 4,
    completed: true,
  },
  Knockemout: {
    name: 'Knockemout',
    totalBooks: 3,
    completed: true,
  },
  'Dark Olympus': {
    name: 'Dark Olympus',
    totalBooks: 6,
    completed: true,
  },
  'Zodiac Academy': {
    name: 'Zodiac Academy',
    totalBooks: 9,
    completed: true,
  },
  Caraval: {
    name: 'Caraval',
    totalBooks: 3,
    completed: true,
  },
  'Once Upon a Broken Heart': {
    name: 'Once Upon a Broken Heart',
    totalBooks: 3,
    completed: true,
  },
  'Six of Crows': {
    name: 'Six of Crows',
    totalBooks: 2,
    completed: true,
  },
  'Alex Stern': {
    name: 'Alex Stern',
    totalBooks: 3,
    completed: false,
    joke: 'Bardugo is cooking something dark for book 3... 🌑',
  },
  'The Atlas': {
    name: 'The Atlas',
    totalBooks: 3,
    completed: false,
    joke: 'Who survives next? Place your bets. 💀',
  },
  'Hades & Persephone': {
    name: 'Hades & Persephone',
    totalBooks: 3,
    completed: true,
  },
  'Shatter Me': {
    name: 'Shatter Me',
    totalBooks: 6,
    completed: true,
  },
  'The Grisha': {
    name: 'The Grisha',
    totalBooks: 3,
    completed: true,
  },
  'The Mortal Instruments': {
    name: 'The Mortal Instruments',
    totalBooks: 6,
    completed: true,
  },
  'The Infernal Devices': {
    name: 'The Infernal Devices',
    totalBooks: 3,
    completed: true,
  },
  Outlander: {
    name: 'Outlander',
    totalBooks: 9,
    completed: false,
    joke: 'Diana Gabaldon writes 1000-page books. We read them in 2 days. 🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  },
  'The Burning Kingdoms': {
    name: 'The Burning Kingdoms',
    totalBooks: 3,
    completed: true,
  },
  'Serpent & Dove': {
    name: 'Serpent & Dove',
    totalBooks: 3,
    completed: true,
  },
  'Letters of Enchantment': {
    name: 'Letters of Enchantment',
    totalBooks: 2,
    completed: true,
  },
  'Bellinger Sisters': {
    name: 'Bellinger Sisters',
    totalBooks: 2,
    completed: true,
  },
  'A Vine Mess': {
    name: 'A Vine Mess',
    totalBooks: 2,
    completed: true,
  },
};
