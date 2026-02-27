import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { getSupabase } from '../lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const FINDER_CACHE_KEY = 'bookCovers_v4';

interface CoverContextType {
  getCover: (bookId: string) => string | null;
  refreshCovers: () => Promise<void>;
}

const CoverContext = createContext<CoverContextType>({
  getCover: () => null,
  refreshCovers: async () => {},
});

function getFinderCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(FINDER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function loadFromSupabase(): Promise<Record<string, string>> {
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
      map[String(row.external_id)] =
        `${SUPABASE_URL}/storage/v1/object/public/covers/${row.cover_path}`;
    }
  }
  return map;
}

export function CoverProvider({ children }: { children: React.ReactNode }) {
  const [supabaseMap, setSupabaseMap] = useState<Record<string, string>>({});
  const [finderCache, setFinderCache] = useState<Record<string, string>>(() => getFinderCache());

  const refreshCovers = useCallback(async () => {
    const map = await loadFromSupabase();
    setSupabaseMap(map);
    setFinderCache(getFinderCache());
  }, []);

  useEffect(() => {
    refreshCovers();
  }, [refreshCovers]);

  const getCover = useCallback(
    (bookId: string): string | null => {
      if (supabaseMap[bookId]) return supabaseMap[bookId];
      const cached = finderCache[bookId];
      if (cached && cached !== 'NONE' && cached.length > 5) return cached;
      return null;
    },
    [supabaseMap, finderCache]
  );

  return (
    <CoverContext.Provider value={{ getCover, refreshCovers }}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCovers() {
  return useContext(CoverContext);
}
