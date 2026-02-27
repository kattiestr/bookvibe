import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { getSupabase } from '../lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

interface CoverContextType {
  getCover: (bookId: string) => string | null;
  setLocalCover: (bookId: string, url: string) => void;
  refreshCovers: () => Promise<void>;
}

const CoverContext = createContext<CoverContextType>({
  getCover: () => null,
  setLocalCover: () => {},
  refreshCovers: async () => {},
});

function loadLocalCovers(): Record<string, string> {
  try {
    const raw = localStorage.getItem('customCovers');
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
  const [localMap, setLocalMap] = useState<Record<string, string>>(() => loadLocalCovers());

  const refreshCovers = useCallback(async () => {
    const map = await loadFromSupabase();
    setSupabaseMap(map);
  }, []);

  useEffect(() => {
    refreshCovers();
  }, [refreshCovers]);

  const setLocalCover = useCallback((bookId: string, url: string) => {
    setLocalMap((prev) => {
      const next = { ...prev, [bookId]: url };
      try {
        localStorage.setItem('customCovers', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const getCover = useCallback(
    (bookId: string): string | null => {
      if (localMap[bookId]) return localMap[bookId];
      return supabaseMap[bookId] ?? null;
    },
    [localMap, supabaseMap]
  );

  return (
    <CoverContext.Provider value={{ getCover, setLocalCover, refreshCovers }}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCovers() {
  return useContext(CoverContext);
}
