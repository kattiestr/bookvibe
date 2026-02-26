import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { booksDatabase } from '../data/books';
import { fixAllCovers, getCachedCover } from '../utils/coverFinder';

interface CoverContextType {
  getCover: (bookId: string) => string;
  isFixing: boolean;
  progress: string;
}

const CoverContext = createContext<CoverContextType>({
  getCover: () => '',
  isFixing: false,
  progress: '',
});

export function CoverProvider({ children }: { children: React.ReactNode }) {
  const [covers, setCovers] = useState<Record<string, string>>({});
  const [isFixing, setIsFixing] = useState(false);
  const [progress, setProgress] = useState('');

  const getCover = useCallback(
    (bookId: string): string => {
      // 1. From fixed covers (best)
      if (covers[bookId] && covers[bookId].length > 10) {
        return covers[bookId];
      }

      // 2. From localStorage cache
      const cached = getCachedCover(bookId);
      if (cached) return cached;

      // 3. Original from database
      const book = booksDatabase.find((b) => b.id === bookId);
      return book?.cover || '';
    },
    [covers]
  );

  useEffect(() => {
    const books = booksDatabase.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.cover,
    }));

    setIsFixing(true);

    fixAllCovers(books, (done, total) => {
      setProgress(`${done}/${total}`);
    }).then((result) => {
      setCovers(result);
      setIsFixing(false);
      setProgress('');
    });
  }, []);

  return (
    <CoverContext.Provider value={{ getCover, isFixing, progress }}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCovers() {
  return useContext(CoverContext);
}
