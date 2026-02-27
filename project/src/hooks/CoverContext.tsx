import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { getSupabase } from '../lib/supabaseClient';

interface CoverContextType {
  getCover: (bookId: string) => string | null;
  refreshCovers: () => Promise<void>;
  ready: boolean;
}

const CoverContext = createContext<CoverContextType>({
  getCover: () => null,
  refreshCovers: async () => {},
  ready: false,
});

async function loadFromSupabase(): Promise<Record<string, string>> {
  const sb = getSupabase();
  if (!sb.client) return {};

  try {
    const { data, error } = await sb.client
      .from('books')
      .select('external_id, cover_path')
      .not('cover_path', 'is', null);

    if (error || !data) return {};

    const map: Record<string, string> = {};
    for (const row of data) {
      if (row.external_id && row.cover_path) {
        const path = row.cover_path as string;
        const isFullUrl = path.startsWith('http://') || path.startsWith('https://');
        map[String(row.external_id)] = isFullUrl
          ? path
          : `${sb.url}/storage/v1/object/public/covers/${path}`;
      }
    }
    return map;
  } catch {
    return {};
  }
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

export function CoverProvider({ children }: { children: React.ReactNode }) {
  const supabaseRef = useRef<Record<string, string>>({});
  const coversJsonRef = useRef<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  const refreshCovers = useCallback(async () => {
    const [sbMap, jsonMap] = await Promise.all([
      loadFromSupabase(),
      loadCoversJson(),
    ]);
    supabaseRef.current = sbMap;
    coversJsonRef.current = jsonMap;
    setReady(true);
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
      return null;
    },
    []
  );

  return (
    <CoverContext.Provider value={{ getCover, refreshCovers, ready }}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCovers() {
  return useContext(CoverContext);
}
