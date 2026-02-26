import { useLibrary } from './LibraryContext';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: number; // 0-100
  current: number;
  target: number;
}

export function useAchievements(): Achievement[] {
  const { library } = useLibrary();

  const finished = library.filter(
    (b) => b.status === 'finished' || b.status === 'read-before'
  );
  const totalSessions = library.reduce((acc, b) => acc + b.sessions.length, 0);
  const totalPages = library.reduce(
    (acc, b) => acc + b.sessions.reduce((s, ses) => s + ses.pagesRead, 0),
    0
  );
  const totalMinutes = library.reduce(
    (acc, b) => acc + b.sessions.reduce((s, ses) => s + ses.duration, 0),
    0
  );
  const totalHours = Math.floor(totalMinutes / 3600);

  // Books with rating
  const rated = library.filter((b) => b.rating > 0);

  // Books with notes
  const withNotes = library.filter((b) => b.notes && b.notes.trim().length > 0);

  // Unique authors finished
  const uniqueAuthors = new Set(finished.map((b) => b.author)).size;

  // Series completed (all books in library finished)
  const seriesMap: Record<string, { total: number; finished: number }> = {};
  library.forEach((b) => {
    if (b.series) {
      if (!seriesMap[b.series]) seriesMap[b.series] = { total: 0, finished: 0 };
      seriesMap[b.series].total++;
      if (b.status === 'finished' || b.status === 'read-before') {
        seriesMap[b.series].finished++;
      }
    }
  });
  const completedSeries = Object.values(seriesMap).filter(
    (s) => s.total >= 2 && s.finished === s.total
  ).length;

  // Perfect rating (10/10)
  const perfect10 = library.filter((b) => b.rating === 10).length;

  // Night owl — sessions that started after 11pm
  const nightSessions = library.reduce(
    (acc, b) =>
      acc +
      b.sessions.filter((s) => {
        const hour = new Date(s.startTime).getHours();
        return hour >= 23 || hour < 4;
      }).length,
    0
  );

  // Long session (60+ min)
  const longSessions = library.reduce(
    (acc, b) => acc + b.sessions.filter((s) => s.duration >= 3600).length,
    0
  );

  // 100+ pages in one session
  const bigSessions = library.reduce(
    (acc, b) => acc + b.sessions.filter((s) => s.pagesRead >= 100).length,
    0
  );

  const make = (
    id: string,
    title: string,
    description: string,
    emoji: string,
    current: number,
    target: number
  ): Achievement => ({
    id,
    title,
    description,
    emoji,
    unlocked: current >= target,
    progress: Math.min(100, Math.round((current / target) * 100)),
    current,
    target,
  });

  return [
    // Reading milestones
    make(
      'first-book',
      'First Chapter',
      'Finish your first book',
      '📖',
      finished.length,
      1
    ),
    make('bookworm', 'Bookworm', 'Finish 5 books', '🐛', finished.length, 5),
    make(
      'avid-reader',
      'Avid Reader',
      'Finish 10 books',
      '📚',
      finished.length,
      10
    ),
    make(
      'book-dragon',
      'Book Dragon',
      'Finish 25 books',
      '🐉',
      finished.length,
      25
    ),
    make(
      'legend',
      'Living Legend',
      'Finish 50 books',
      '👑',
      finished.length,
      50
    ),

    // Pages
    make(
      'page-turner',
      'Page Turner',
      'Read 1,000 pages total',
      '📄',
      totalPages,
      1000
    ),
    make(
      'page-devourer',
      'Page Devourer',
      'Read 5,000 pages total',
      '🔥',
      totalPages,
      5000
    ),
    make(
      'page-monster',
      'Page Monster',
      'Read 10,000 pages total',
      '💀',
      totalPages,
      10000
    ),

    // Time
    make(
      'dedicated',
      'Dedicated',
      'Read for 10 hours total',
      '⏱️',
      totalHours,
      10
    ),
    make(
      'time-traveler',
      'Time Traveler',
      'Read for 50 hours total',
      '🕰️',
      totalHours,
      50
    ),
    make(
      'eternal-reader',
      'Eternal Reader',
      'Read for 100 hours total',
      '♾️',
      totalHours,
      100
    ),

    // Sessions
    make(
      'getting-started',
      'Getting Started',
      'Complete 5 reading sessions',
      '✨',
      totalSessions,
      5
    ),
    make(
      'consistent',
      'Consistent',
      'Complete 25 reading sessions',
      '💪',
      totalSessions,
      25
    ),
    make(
      'marathon',
      'Marathon Reader',
      'Complete 100 sessions',
      '🏃',
      totalSessions,
      100
    ),

    // Special
    make(
      'series-slayer',
      'Series Slayer',
      'Complete a full series',
      '⚔️',
      completedSeries,
      1
    ),
    make(
      'series-master',
      'Series Master',
      'Complete 3 series',
      '🏆',
      completedSeries,
      3
    ),
    make(
      'author-fan',
      'Author Fan',
      'Finish books by 5 different authors',
      '✍️',
      uniqueAuthors,
      5
    ),
    make('critic', 'Book Critic', 'Rate 10 books', '⭐', rated.length, 10),
    make(
      'journalist',
      'Book Journalist',
      'Write notes for 5 books',
      '📝',
      withNotes.length,
      5
    ),
    make(
      'perfect-10',
      'Perfect 10',
      'Give a book 10/10 rating',
      '💎',
      perfect10,
      1
    ),
    make(
      'night-owl',
      'Night Owl',
      'Read 5 sessions after 11pm',
      '🦉',
      nightSessions,
      5
    ),
    make(
      'endurance',
      'Endurance',
      'Read 60+ minutes in one session',
      '🏋️',
      longSessions,
      1
    ),
    make(
      'speed-demon',
      'Speed Demon',
      'Read 100+ pages in one session',
      '⚡',
      bigSessions,
      1
    ),
  ];
}
