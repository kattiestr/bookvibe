import { useState, useRef } from 'react';
import { ExternalLink, Plus, X, ImageIcon } from 'lucide-react';

const accent = '#c4a07c';
const muted = '#5c5450';

interface BookArtGalleryProps {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  series?: string;
}

function getStorageKey(bookId: string) {
  return `book-art-${bookId}`;
}

function getSavedImages(bookId: string): string[] {
  try {
    const saved = localStorage.getItem(getStorageKey(bookId));
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveImages(bookId: string, images: string[]) {
  localStorage.setItem(getStorageKey(bookId), JSON.stringify(images));
}

export default function BookArtGallery({
  bookId,
  bookTitle,
  bookAuthor,
  series,
}: BookArtGalleryProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [images, setImages] = useState<string[]>(() => getSavedImages(bookId));
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pinterestQuery = encodeURIComponent(
    `${bookTitle} ${bookAuthor} book aesthetic fan art`
  );
  const pinterestUrl = `https://pinterest.com/search/pins/?q=${pinterestQuery}`;

  const pinterestSeriesQuery = series
    ? encodeURIComponent(`${series} series book aesthetic fan art`)
    : null;
  const pinterestSeriesUrl = pinterestSeriesQuery
    ? `https://pinterest.com/search/pins/?q=${pinterestSeriesQuery}`
    : null;

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Max 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newImages = [...images, base64];
      setImages(newImages);
      saveImages(bookId, newImages);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    saveImages(bookId, newImages);
  };

  // Spoiler gate
  if (!unlocked) {
    return (
      <div
        style={{
          background: '#1a1614',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #2a2520',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '16px',
            fontWeight: 700,
            color: '#e2ddd5',
            marginBottom: '8px',
          }}
        >
          🎨 Fan Art & Aesthetics
        </h3>

        <p
          style={{
            fontSize: '12px',
            color: muted,
            lineHeight: 1.6,
            marginBottom: '6px',
          }}
        >
          Browse fan art, character aesthetics, and mood boards for this book.
        </p>

        <div
          style={{
            background: 'rgba(231,76,60,0.08)',
            border: '1px solid rgba(231,76,60,0.2)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '16px',
          }}
        >
          <p
            style={{
              fontSize: '11px',
              color: '#e74c3c',
              fontWeight: 600,
              marginBottom: '2px',
            }}
          >
            ⚠️ Spoiler Warning
          </p>
          <p style={{ fontSize: '11px', color: '#b0a89e', lineHeight: 1.5 }}>
            Fan art and images may contain major spoilers for the plot,
            characters, and key moments. Enter at your own risk!
          </p>
        </div>

        <button
          onClick={() => setUnlocked(true)}
          style={{
            padding: '12px 28px',
            borderRadius: '24px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            background: accent,
            color: '#141010',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <ImageIcon size={14} />
          I don't mind spoilers — show me!
        </button>

        <p
          style={{
            fontSize: '10px',
            color: '#3a3530',
            marginTop: '10px',
            fontStyle: 'italic',
          }}
        >
          You've been warned 👀
        </p>
      </div>
    );
  }

  return (
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
          fontFamily: 'Playfair Display, serif',
          fontSize: '16px',
          fontWeight: 700,
          color: '#e2ddd5',
          marginBottom: '14px',
        }}
      >
        🎨 Fan Art & Aesthetics
      </h3>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <a
          href={pinterestUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            background: '#E60023',
            color: 'white',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
          </svg>
          Browse "{bookTitle}" on Pinterest
          <ExternalLink size={12} />
        </a>

        {pinterestSeriesUrl && (
          <a
            href={pinterestSeriesUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: '#2a2520',
              color: '#e2ddd5',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            📚 Browse "{series}" series art
            <ExternalLink size={10} />
          </a>
        )}
      </div>

      {images.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <p
            style={{
              fontSize: '11px',
              color: muted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '8px',
            }}
          >
            Your saved art ({images.length})
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
            }}
          >
            {images.map((img, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={img}
                  alt={`Art ${i + 1}`}
                  onClick={() => setViewingImage(img)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(i);
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={10} color="white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAddImage}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          border: '2px dashed #2a2520',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: muted,
          fontSize: '12px',
        }}
      >
        <Plus size={14} />
        Save your own art
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {viewingImage && (
        <div
          onClick={() => setViewingImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <button
            onClick={() => setViewingImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} color="white" />
          </button>
          <img
            src={viewingImage}
            alt="Art full view"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              borderRadius: '12px',
              objectFit: 'contain',
            }}
          />
        </div>
      )}

      <button
        onClick={() => setUnlocked(false)}
        style={{
          margin: '12px auto 0',
          display: 'block',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '10px',
          color: '#3a3530',
        }}
      >
        🔒 Hide art section
      </button>
    </div>
  );
}
