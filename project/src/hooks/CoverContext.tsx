import React, { createContext, useContext, useCallback } from 'react';
import { useBooks } from './BooksContext';

interface CoverContextType {
  getCover: (bookId: string) => string | null;
  refreshCovers: () => Promise<void>;
  ready: boolean;
}

const CoverContext = createContext<CoverContextType>({
  getCover: () => null,
  refreshCovers: async () => {},
  ready: true,
});

export function CoverProvider({ children }: { children: React.ReactNode }) {
  const { refreshBooks } = useBooks();

  const getCover = useCallback((_bookId: string): string | null => null, []);

  const refreshCovers = useCallback(async () => {
    await refreshBooks();
  }, [refreshBooks]);

  return (
    <CoverContext.Provider value={{ getCover, refreshCovers, ready: true }}>
      {children}
    </CoverContext.Provider>
  );
}

export function useCovers() {
  return useContext(CoverContext);
}
