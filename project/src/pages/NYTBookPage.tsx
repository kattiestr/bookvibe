import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLibrary } from '../hooks/LibraryContext';
import {
  ArrowLeft,
  ShoppingCart,
  Check,
  Camera,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import CoverChanger from '../components/CoverChanger';

const accent = '#c4a07c';
const muted = '#5c5450';

export default function NYTBookPage() {
  const { isbn } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToLibrary, isInLibrary, library, updateBook } = useLibrary();

  const [showCoverChanger, setShowCoverChanger] = useState(false);
  const [coverKey, setCoverKey] = useState(0);

  // Get book info from URL params
  const title = searchParams.get('title') || 'Unknown Title';
  const author = searchParams.get('author') || 'Unknown Author';
  const cover = searchParams.get('cover') || '';
  const description = searchParams.get('desc') || '';
  const rank = searchParams.get('rank') || '';
  const weeks = searchParams.get('weeks') || '0';
  const listName = searchParams.get('list') || '';
  const buyLink = searchParams.get('buy') || '';

  const bookId = `nyt-${isbn}`;
  const inLibrary = isInLibrary(bookId);
  const libraryBook = library.find((b) => b.bookId === bookId);
  const isWishlist = libraryBook?.status === 'wishlist';

  // Get custom cover if set
  const [customCover, setCustomCover] = useState<string | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`custom-cover-${bookId}`);
      if (saved) setCustomCover(saved);
    } catch {}
  }, [bookId, coverKey]);

  const displayCover = customCover || libraryBook?.cover || cover;

  const formatTitle = (t: string) =>
    t.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const addWishlist = () => {
    if (inLibrary) return;
    addToLibrary({
      id: bookId,
      title: formatTitle(title),
      author: formatTitle(author),
      cover: displayCover,
      pages: 300,
      status: 'wishlist',
    });
  };

  const addLibrary = () => {
    if (!inLibrary) {
      addToLibrary({
        id: bookId,
        title: formatTitle(title),
        author: formatTitle(author),
        cover: displayCover,
        pages: 300,
        status: 'want-to-read',
      });
    }
    navigate(`/library/${bookId}`);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
      <button
        onClick={() => navigate(-1)}
        style={{
          color: muted,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* Trending badge */}
      {rank && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(231,76,60,0.1)',
            marginBottom: '16px',
          }}
        >
          <span style={{ fontSize: '11px', color: '#e74c3c', fontWeight: 600 }}>
            🔥 #{rank} on NYT {listName}
          </span>
          {parseInt(weeks) === 1 ? (
            <span style={{ fontSize: '10px', color: '#e74c3c' }}>
              · NEW this week!
            </span>
          ) : parseInt(weeks) > 0 ? (
            <span style={{ fontSize: '10px', color: '#2ecc71' }}>
              · {weeks} weeks on list
            </span>
          ) : null}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '130px', flexShrink: 0 }}>
          {displayCover ? (
            <img
              key={coverKey}
              src={displayCover}
              alt={title}
              style={{
                width: '130px',
                height: '195px',
                borderRadius: '10px',
                objectFit: 'cover',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            />
          ) : (
            <div
              style={{
                width: '130px',
                height: '195px',
                borderRadius: '10px',
                background: '#2a2520',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
              }}
            >
              📖
            </div>
          )}
          <button
            onClick={() => setShowCoverChanger(true)}
            style={{
              background: 'rgba(196,168,130,0.15)',
              border: '1px solid rgba(196,168,130,0.3)',
              borderRadius: '8px',
              padding: '5px 10px',
              color: accent,
              fontSize: '10px',
              cursor: 'pointer',
              marginTop: '8px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Camera size={10} />
            Change Cover
          </button>
        </div>

        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: 700,
              color: '#e2ddd5',
              lineHeight: 1.2,
            }}
          >
            {formatTitle(title)}
          </h1>
          <p style={{ fontSize: '13px', color: muted, marginTop: '4px' }}>
            {formatTitle(author)}
          </p>

          {/* Action buttons */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={addLibrary}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                background: inLibrary && !isWishlist ? '#1e1a18' : accent,
                color: inLibrary && !isWishlist ? accent : '#141010',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BookOpen size={14} />
              {inLibrary && !isWishlist ? 'Open in Library' : 'Add to Library'}
            </button>

            {!inLibrary && (
              <button
                onClick={addWishlist}
                style={{
                  padding: '10px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#1e1a18',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: muted,
                }}
              >
                <ShoppingCart size={12} /> Wishlist
              </button>
            )}

            {isWishlist && (
              <span
                style={{
                  padding: '10px 14px',
                  borderRadius: '20px',
                  background: 'rgba(196,160,124,0.1)',
                  fontSize: '11px',
                  color: accent,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={12} /> On Wishlist
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div
          style={{
            background: '#1a1614',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #2a2520',
          }}
        >
          <h3
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '8px',
            }}
          >
            About
          </h3>
          <p style={{ fontSize: '13px', color: '#a09a90', lineHeight: 1.7 }}>
            {description}
          </p>
        </div>
      )}

      {/* Buy externally */}
      {buyLink && (
        <a
          href={buyLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px',
            borderRadius: '14px',
            background: '#1a1614',
            border: '1px solid #2a2520',
            textDecoration: 'none',
            marginBottom: '20px',
          }}
        >
          <ExternalLink size={14} color={muted} />
          <span style={{ fontSize: '12px', color: muted }}>Buy on Amazon</span>
        </a>
      )}

      {/* Info card */}
      <div
        style={{
          background: '#1a1614',
          borderRadius: '14px',
          padding: '16px',
          border: '1px solid #2a2520',
        }}
      >
        <h3
          style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '12px',
          }}
        >
          Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isbn && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: muted }}>ISBN</span>
              <span style={{ fontSize: '11px', color: '#e2ddd5' }}>{isbn}</span>
            </div>
          )}
          {listName && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: muted }}>NYT List</span>
              <span style={{ fontSize: '11px', color: '#e2ddd5' }}>
                {listName}
              </span>
            </div>
          )}
          {parseInt(weeks) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: muted }}>
                Weeks on list
              </span>
              <span style={{ fontSize: '11px', color: '#e2ddd5' }}>
                {weeks}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Cover Changer */}
      {showCoverChanger && (
        <CoverChanger
          bookId={bookId}
          bookTitle={formatTitle(title)}
          bookAuthor={formatTitle(author)}
          onChanged={() => {
            setShowCoverChanger(false);
            setCoverKey((k) => k + 1);
            // Update library book cover too
            if (inLibrary) {
              try {
                const newCover = localStorage.getItem(`custom-cover-${bookId}`);
                if (newCover) updateBook(bookId, { cover: newCover });
              } catch {}
            }
          }}
          onClose={() => setShowCoverChanger(false)}
        />
      )}
    </div>
  );
}
