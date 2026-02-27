import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { booksDatabase } from '../data/books';
import { getCachedCover } from '../utils/coverFinder';
import { getSupabase } from '../lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

interface CoverContextType {
  getCover: (bookId: string) => string;
  refreshCovers: () => Promise<void>;
  isLoading: boolean;
}

const CoverContext = createContext<CoverContextType>({
  getCover: () => '',
  refreshCovers: async () => {},
  isLoading: true,
});

async function fetchSupabaseCovers(): Promise<Record<string, string>> {
  const sb = getSupabase();
  if (!sb.client || !SUPABASE_URL) return {};

  const { data, error } = await sb.client
    .from('books')
    .select('external_id, cover_path')
    .not('cover_path', 'is', null);

  if (error || !data) return {};

  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.external_id && row.cover_path) {
      map[String(row.external_id)] = `${SUPABASE_URL}/storage/v1/object/public/covers/${row.cover_path}`;
    }
  }
  return map;
}

export function CoverProvider({ children }: { children: React.ReactNode }) {
  const [supabaseCovers, setSupabaseCovers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refreshCovers = useCallback(async () => {
    const map = await fetchSupabaseCovers();
    setSupabaseCovers(map);
  }, []);

  useEffect(() => {
    refreshCovers().finally(() => setIsLoading(false));
  }, [refreshCovers]);

  const getCover = useCallback(
    (bookId: string): string => {
      if (supabaseCovers[bookId]) {
        return supabaseCovers[bookId];
      }

      const cached = getCachedCover(bookId);
      if (cached) return cached;

      const book = booksDatabase.find((b) => b.id === bookId);
      return book?.cover || '';
    },
    [supabaseCovers]
  );

  return (
    <CoverContext.Provider value={{ getCover, refreshCovers, isLoading }}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCovers() {
  return useContext(CoverContext);
}
