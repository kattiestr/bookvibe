import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { getSupabase } from '../lib/supabaseClient';
import { getBestCover } from '../utils/coverFinder';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const FINDER_CACHE_KEY = 'bookCovers_v4';

interface CoverContextType {
  getCover: (bookId: string) => string | null;
  refreshCovers: () => Promise<void>;
  requestCover: (bookId: string, title: string, author: string, fallbackSrc: string) => void;
  version: number;
  ready: boolean;
}

const CoverContext = createContext<CoverContextType>({
  getCover: () => null,
  refreshCovers: async () => {},
  requestCover: () => {},
  version: 0,
  ready: false,
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

async function loadCoversJson(): Promise<Record<string, string>> {
  try {
    const res = await fetch('/covers.json');
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

const pendingRequests = new Set<string>();

export function CoverProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<Record<string, string>>({});
  const coversJsonRef = useRef<Record<string, string>>({});
  const finderCacheRef = useRef<Record<string, string>>(getFinderCache());
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);

  const refreshCovers = useCallback(async () => {
    const [sbMap, jsonMap] = await Promise.all([
      loadFromSupabase(),
      loadCoversJson(),
    ]);
    supabaseRef.current = sbMap;
    coversJsonRef.current = jsonMap;
    finderCacheRef.current = getFinderCache();
    setReady(true);
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    refreshCovers();
  }, [refreshCovers]);

  const getCover = useCallback(
    (bookId: string): string | null => {
      const sb = supabaseRef.current[bookId];
      if (sb) return sb;
      const jsonUrl = coversJsonRef.current[bookId];
      if (jsonUrl && jsonUrl.length > 5) return jsonUrl;
      const cached = finderCacheRef.current[bookId];
      if (cached && cached !== 'NONE' && cached.length > 5) return cached;
      return null;
    },
    []
  );

  const requestCover = useCallback(
    (bookId: string, title: string, author: string, fallbackSrc: string) => {
      if (supabaseRef.current[bookId]) return;
      if (coversJsonRef.current[bookId]) return;
      const cached = finderCacheRef.current[bookId];
      if (cached && cached !== 'NONE' && cached.length > 5) return;
      if (pendingRequests.has(bookId)) return;

      pendingRequests.add(bookId);

      getBestCover(bookId, title, author, fallbackSrc).then((url) => {
        pendingRequests.delete(bookId);
        if (url) {
          finderCacheRef.current = getFinderCache();
          setVersion((v) => v + 1);
        }
      });
    },
    []
  );

  return (
    <CoverContext.Provider value={{ getCover, refreshCovers, requestCover, version, ready }}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCovers() {
  return useContext(CoverContext);
}
