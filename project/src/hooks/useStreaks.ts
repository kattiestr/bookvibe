import { useLibrary } from './LibraryContext';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  readToday: boolean;
  calendar: Record<string, number>; // 'YYYY-MM-DD' -> pages read
  weekActivity: { day: string; active: boolean; pages: number }[];
}

function dateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function useStreaks(): StreakInfo {
  const { library } = useLibrary();

  // Build calendar of reading days
  const calendar: Record<string, number> = {};

  library.forEach((book) => {
    book.sessions.forEach((session) => {
      const key = dateKey(new Date(session.startTime));
      calendar[key] = (calendar[key] || 0) + session.pagesRead;
    });
  });

  const today = dateKey(new Date());
  const readToday = !!calendar[today];

  // Calculate current streak
  let currentStreak = 0;
  const d = new Date();

  // If didn't read today, start checking from yesterday
  if (!readToday) {
    d.setDate(d.getDate() - 1);
  }

  while (calendar[dateKey(d)]) {
    currentStreak++;
    d.setDate(d.getDate() - 1);
  }

  // Calculate longest streak
  const sortedDays = Object.keys(calendar).sort();
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  if (sortedDays.length === 0) longestStreak = 0;

  // Week activity (last 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = dateKey(date);
    weekActivity.push({
      day: dayNames[date.getDay()],
      active: !!calendar[key],
      pages: calendar[key] || 0,
    });
  }

  return {
    currentStreak,
    longestStreak,
    readToday,
    calendar,
    weekActivity,
  };
}
