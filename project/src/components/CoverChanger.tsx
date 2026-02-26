import { useState, useEffect } from 'react';
import { Search, X, Check, Loader } from 'lucide-react';
import { saveCustomCover } from './BookCover';

interface Props {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  onChanged: (newUrl: string) => void;
  onClose: () => void;
}

const accent = '#c4a882';
const muted = '#5c5450';

export default function CoverChanger({
  bookId,
  bookTitle,
  bookAuthor,
  onChanged,
  onClose,
}: Props) {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(`${bookTitle} ${bookAuthor}`);
  const [customUrl, setCustomUrl] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [searchDone, setSearchDone] = useState(false);

  // Auto-search on open
  useEffect(() => {
    searchCovers();
  }, []);

  const searchCovers = async () => {
    setLoading(true);
    setResults([]);
    setSelected(null);
    setSearchDone(false);

    const allUrls: string[] = [];

    // === Source 1: Open Library ===
    try {
      const q = encodeURIComponent(query);
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${q}&limit=12&fields=key,cover_i,edition_key,isbn`
      );
      const data = await res.json();

      if (data.docs) {
        for (const doc of data.docs) {
          if (doc.cover_i) {
            const url = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
            if (!allUrls.includes(url)) allUrls.push(url);
          }
          // Also try ISBN covers (often better quality)
          if (doc.isbn && doc.isbn.length > 0) {
            const isbnUrl = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
            if (!allUrls.includes(isbnUrl)) allUrls.push(isbnUrl);
          }
        }
      }
    } catch {}

    // === Source 2: Google Books (backup) ===
    try {
      const q = encodeURIComponent(query);
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=8&printType=books`
      );
      const data = await res.json();

      if (data.items) {
        for (const item of data.items) {
          const images = item.volumeInfo?.imageLinks;
          if (images) {
            const url = (images.thumbnail || images.smallThumbnail || '')
              .replace('http://', 'https://')
              .replace('zoom=1', 'zoom=3')
              .replace('&edge=curl', '');
            if (url && !allUrls.includes(url)) allUrls.push(url);
          }
        }
      }
    } catch {}

    // === Source 3: ISBN from bookId (for NYT books) ===
    if (bookId.startsWith('nyt-')) {
      const isbn = bookId.replace('nyt-', '');
      if (isbn) {
        const isbnUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        if (!allUrls.includes(isbnUrl)) allUrls.unshift(isbnUrl);
      }
    }

    setResults(allUrls.slice(0, 12));
    setLoading(false);
    setSearchDone(true);
  };

  const handleSave = () => {
    const url = selected || customUrl;
    if (url) {
      saveCustomCover(bookId, url);
      onChanged(url);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1e1a18',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '18px',
              color: '#e2ddd5',
            }}
          >
            Change Cover
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: muted,
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchCovers()}
            placeholder="Search for covers..."
            style={{
              flex: 1,
              background: '#141010',
              border: '1px solid #3a3330',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#e2ddd5',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            onClick={searchCovers}
            disabled={loading}
            style={{
              background: accent,
              border: 'none',
              borderRadius: '8px',
              padding: '10px 14px',
              cursor: 'pointer',
              color: '#141010',
              display: 'flex',
              alignItems: 'center',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                border: `2px solid ${accent}`,
                borderTopColor: 'transparent',
                borderRadius: '50%',
                margin: '0 auto 10px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ fontSize: '12px', color: muted }}>
              Searching covers...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <>
            <p
              style={{
                fontSize: '10px',
                color: muted,
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              {results.length} covers found — tap to select
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              {results.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img
                    src={url}
                    alt={`cover ${i + 1}`}
                    onClick={() => setSelected(url)}
                    style={{
                      width: '100%',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border:
                        selected === url
                          ? `3px solid ${accent}`
                          : '3px solid transparent',
                      opacity: selected === url ? 1 : 0.7,
                      transition: 'all 0.2s',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {selected === url && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: accent,
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={12} color="#141010" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* No results */}
        {!loading && searchDone && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>😕</p>
            <p style={{ fontSize: '12px', color: muted }}>No covers found</p>
            <p style={{ fontSize: '10px', color: '#3a3530', marginTop: '4px' }}>
              Try a different search or paste a URL below
            </p>
          </div>
        )}

        {/* Custom URL */}
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '11px', color: muted, marginBottom: '6px' }}>
            Or paste an image URL:
          </p>
          <input
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              setSelected(null);
            }}
            placeholder="https://..."
            style={{
              width: '100%',
              background: '#141010',
              border: '1px solid #3a3330',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#e2ddd5',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {/* Preview */}
          {customUrl && (
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <img
                src={customUrl}
                alt="preview"
                style={{
                  maxWidth: '80px',
                  maxHeight: '120px',
                  borderRadius: '6px',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Save button */}
        {(selected || customUrl) && (
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              background: accent,
              border: 'none',
              borderRadius: '10px',
              padding: '12px',
              color: '#141010',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Check size={16} />
            Save Cover
          </button>
        )}
      </div>
    </div>
  );
}
