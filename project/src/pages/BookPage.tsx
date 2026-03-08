import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBooks } from '../hooks/BooksContext';
import { useFavorites } from '../hooks/useFavorites';
import { useLibrary } from '../hooks/LibraryContext';
import { useAuth } from '../hooks/AuthContext';
import { seriesDatabase } from '../data/series';
import { ArrowLeft, BookOpen, Camera, ShoppingCart, Pencil, Check, X, Plus, Trash2 } from 'lucide-react';
import BookCover from '../components/BookCover';
import CoverChanger from '../components/CoverChanger';
import BookArtGallery from '../components/BookArtGallery';
import { getSupabase } from '../lib/supabaseClient';

const accent = '#c4a07c';
const muted = '#5c5450';
const ADMIN_EMAIL = 'kattiestrokach@gmail.com';

export default function BookPage() {
  const { books: booksDatabase, refreshBooks } = useBooks();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { addToLibrary, isInLibrary, library } = useLibrary();
  const [showCoverChanger, setShowCoverChanger] = useState(false);
  const [overrideSrc, setOverrideSrc] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  // Admin edit state
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [editData, setEditData] = useState({
    title: '',
    author: '',
    description: '',
    pages: 0,
    year: 0,
    spice: 0,
    series: '',
    seriesNumber: 0,
    vibes: [] as string[],
    tropes: [] as string[],
    mood: [] as string[],
  });

  const book = booksDatabase.find((b) => b.id === id);

  useEffect(() => {
    setOverrideSrc(null);
    setEditMode(false);
  }, [id]);

  useEffect(() => {
    if (book && editMode) {
      setEditData({
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        pages: book.pages || 0,
        year: book.year || 0,
        spice: book.spice || 0,
        series: book.series || '',
        seriesNumber: book.seriesNumber || 0,
        vibes: book.vibes || [],
        tropes: book.tropes || [],
        mood: book.mood || [],
      });
    }
  }, [editMode, book]);

  if (!book) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-12" style={{ textAlign: 'center' }}>
        <p style={{ color: muted }}>Book not found</p>
      </div>
    );
  }

  const coverSrc = overrideSrc ?? book.cover;
  const similar = booksDatabase.filter(
    (b) => book.similar?.includes(b.title) && !(book.series && b.series === book.series)
  );
  const fav = isFavorite(book.id);
  const inLib = isInLibrary(book.id);

  const seriesBooks = book.series
    ? booksDatabase
        .filter((b) => b.series === book.series)
        .sort((a, b) => (a.seriesNumber || 0) - (b.seriesNumber || 0))
    : [];
  const seriesInfo = book.series ? seriesDatabase[book.series] : null;
  const totalInSeries = seriesInfo?.totalBooks || seriesBooks.length;
  const ownedInSeries = seriesBooks.filter((b) => isInLibrary(b.id)).length;

  const authorBooks = booksDatabase.filter(
    (b) =>
      b.author === book.author &&
      b.id !== book.id &&
      !(book.series && b.series === book.series)
  );

  const libraryBook = library.find((b) => b.bookId === book.id);
  const isWishlist = libraryBook?.status === 'wishlist';

  // ===== SAVE TO SUPABASE =====
  const saveChanges = async () => {
    setSaving(true);
    const { client } = getSupabase();
    if (!client) { setSaving(false); return; }

    const { error } = await client
      .from('books')
      .update({
        title: editData.title,
        author: editData.author,
        description: editData.description,
        pages: editData.pages,
        year: editData.year,
        spice: editData.spice,
        series_id: editData.series || null,
        series_num: editData.seriesNumber || null,
        vibes: editData.vibes,
        tropes: editData.tropes,
        mood: editData.mood,
      })
      .eq('id', book.id);

    setSaving(false);

    if (error) {
      setSaveMsg('❌ Error: ' + error.message);
    } else {
      setSaveMsg('✅ Saved!');
      if (refreshBooks) await refreshBooks();
      setTimeout(() => {
        setSaveMsg('');
        setEditMode(false);
      }, 1500);
    }
  };

  // ===== ADMIN EDIT PANEL =====
  const renderAdminPanel = () => (
    <div
      style={{
        background: '#1a1614',
        border: '1px solid rgba(196,160,124,0.4)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', color: accent, fontWeight: 700, letterSpacing: '0.1em' }}>
          ⚙️ ADMIN EDIT
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={saveChanges}
            disabled={saving}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              background: accent,
              color: '#141010',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Check size={12} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setEditMode(false)}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              background: '#2a2520',
              color: muted,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <X size={12} /> Cancel
          </button>
        </div>
      </div>

      {saveMsg && (
        <p style={{ fontSize: '12px', color: saveMsg.includes('✅') ? '#6b9e7a' : '#e74c3c', marginBottom: '12px' }}>
          {saveMsg}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Title */}
        <div>
          <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Title
          </label>
          <input
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            style={inputStyle}
          />
        </div>

        {/* Author */}
        <div>
          <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Author
          </label>
          <input
            value={editData.author}
            onChange={(e) => setEditData({ ...editData, author: e.target.value })}
            style={inputStyle}
          />
        </div>

        {/* Pages / Year / Spice */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Pages
            </label>
            <input
              type="number"
              value={editData.pages}
              onChange={(e) => setEditData({ ...editData, pages: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Year
            </label>
            <input
              type="number"
              value={editData.year}
              onChange={(e) => setEditData({ ...editData, year: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Spice 🌶️
            </label>
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEditData({ ...editData, spice: n })}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    background: editData.spice >= n ? '#c4a07c33' : '#2a2520',
                    color: editData.spice >= n ? accent : muted,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Series / Series Number */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Series
            </label>
            <input
              value={editData.series}
              onChange={(e) => setEditData({ ...editData, series: e.target.value })}
              placeholder="Series name or empty"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              # in Series
            </label>
            <input
              type="number"
              value={editData.seriesNumber}
              onChange={(e) => setEditData({ ...editData, seriesNumber: parseInt(e.target.value) || 0 })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Description
          </label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </div>

        {/* Vibes */}
        <div>
          <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Vibes ✨
          </label>
          {editData.vibes.map((vibe, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
              <input
                value={vibe}
                onChange={(e) => {
                  const newVibes = [...editData.vibes];
                  newVibes[i] = e.target.value;
                  setEditData({ ...editData, vibes: newVibes });
                }}
                style={{ ...inputStyle, flex: 1, marginTop: 0 }}
              />
              <button
                onClick={() => {
                  const newVibes = editData.vibes.filter((_, idx) => idx !== i);
                  setEditData({ ...editData, vibes: newVibes });
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b4040' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setEditData({ ...editData, vibes: [...editData.vibes, ''] })}
            style={{
              marginTop: '8px',
              padding: '6px 14px',
              borderRadius: '16px',
              border: `1px dashed ${accent}55`,
              background: 'none',
              color: accent,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={12} /> Add Vibe
          </button>
        </div>

        {/* Tropes */}
        <div>
          <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Tropes 🏷️
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {editData.tropes.map((trope, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: '#2a2520',
                  fontSize: '11px',
                  color: '#e2ddd5',
                }}
              >
                <input
                  value={trope}
                  onChange={(e) => {
                    const newTropes = [...editData.tropes];
                    newTropes[i] = e.target.value;
                    setEditData({ ...editData, tropes: newTropes });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#e2ddd5',
                    fontSize: '11px',
                    width: `${Math.max(trope.length, 4)}ch`,
                  }}
                />
                <button
                  onClick={() => {
                    const newTropes = editData.tropes.filter((_, idx) => idx !== i);
                    setEditData({ ...editData, tropes: newTropes });
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b4040', padding: 0 }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setEditData({ ...editData, tropes: [...editData.tropes, 'new-trope'] })}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: `1px dashed ${accent}55`,
                background: 'none',
                color: accent,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={10} /> Add
            </button>
          </div>
        </div>

        {/* Mood */}
        <div>
          <label style={{ fontSize: '10px', color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Mood 🎭
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {editData.mood.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  background: '#1a1614',
                  fontSize: '11px',
                  color: muted,
                }}
              >
                <input
                  value={m}
                  onChange={(e) => {
                    const newMood = [...editData.mood];
                    newMood[i] = e.target.value;
                    setEditData({ ...editData, mood: newMood });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: muted,
                    fontSize: '11px',
                    width: `${Math.max(m.length, 4)}ch`,
                  }}
                />
                <button
                  onClick={() => {
                    const newMood = editData.mood.filter((_, idx) => idx !== i);
                    setEditData({ ...editData, mood: newMood });
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b4040', padding: 0 }}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setEditData({ ...editData, mood: [...editData.mood, 'new'] })}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: `1px dashed ${accent}55`,
                background: 'none',
                color: accent,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Plus size={10} /> Add
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #2a2520',
    background: '#141010',
    color: '#e2ddd5',
    fontSize: '13px',
    outline: 'none',
    marginTop: '6px',
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-28">
      <button
        onClick={() => navigate(-1)}
        style={{ color: muted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px' }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: '120px', flexShrink: 0 }}>
          <BookCover
            src={coverSrc}
            title={book.title}
            author={book.author}
            bookId={book.id}
            width={120}
            height={180}
            borderRadius="10px"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }}
          />
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
              fontSize: '24px',
              fontWeight: 700,
              color: '#e2ddd5',
              lineHeight: 1.2,
            }}
          >
            {book.title}
          </h1>
          <p
            onClick={() => navigate(`/author/${encodeURIComponent(book.author)}`)}
            style={{
              fontSize: '13px',
              color: muted,
              marginTop: '4px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(92,84,80,0.4)',
              textUnderlineOffset: '2px',
            }}
          >
            {book.author} →
          </p>
          {book.series && (
            <p style={{ fontSize: '11px', color: accent, marginTop: '4px' }}>
              {book.series} #{book.seriesNumber}
            </p>
          )}
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {book.spice > 0 && (
              <span style={{ fontSize: '11px' }}>{'🌶️'.repeat(book.spice)}</span>
            )}
            {book.pages && (
              <span style={{ fontSize: '11px', color: muted }}>{book.pages} pages</span>
            )}
            {book.year && (
              <span style={{ fontSize: '11px', color: muted }}>{book.year}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (!inLib) addToLibrary(book);
                navigate(`/library/${book.id}`);
              }}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                background: inLib ? '#1e1a18' : accent,
                color: inLib ? accent : '#141010',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BookOpen size={14} />
              {inLib ? 'Open in Library' : 'Add to Library'}
            </button>

            {!inLib && (
              <button
                onClick={() =>
                  addToLibrary({ ...book, id: book.id, pages: book.pages, status: 'wishlist' })
                }
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
                🛒 On Wishlist
              </span>
            )}

            {/* Admin Edit Button */}
            {isAdmin && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '20px',
                  border: '1px solid rgba(196,160,124,0.3)',
                  cursor: 'pointer',
                  background: 'rgba(196,160,124,0.1)',
                  color: accent,
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Pencil size={12} /> Edit Book
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Panel */}
      {isAdmin && editMode && renderAdminPanel()}

      {/* Vibes */}
      {book.vibes && book.vibes.length > 0 && (
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
              marginBottom: '12px',
            }}
          >
            ✨ Why You'll Love This
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {book.vibes.map((vibe, i) => (
              <p
                key={i}
                style={{
                  fontSize: '13px',
                  color: '#c4beb6',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  paddingLeft: '12px',
                  borderLeft: `2px solid ${accent}33`,
                }}
              >
                {vibe}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {book.description && (
        <div style={{ marginBottom: '20px' }}>
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
            {book.description}
          </p>
        </div>
      )}

      <BookArtGallery
        bookId={book.id}
        bookTitle={book.title}
        bookAuthor={book.author}
        series={book.series}
      />

      {/* Tropes */}
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '8px',
          }}
        >
          Tropes
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {book.tropes.map((t) => (
            <span
              key={t}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: '#1e1a18',
                fontSize: '11px',
                color: '#e2ddd5',
              }}
            >
              {t.split('-').join(' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Mood */}
      <div style={{ marginBottom: '24px' }}>
        <h3
          style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: '8px',
          }}
        >
          Mood
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {book.mood.map((m) => (
            <span
              key={m}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                background: '#1a1614',
                fontSize: '11px',
                color: muted,
              }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Series Collection */}
      {book.series && seriesBooks.length > 0 && (
        <div
          style={{
            background: '#1a1614',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid #2a2520',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h3
              style={{
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              📖 {book.series} Collection
            </h3>
            <span style={{ fontSize: '10px', color: muted }}>
              {ownedInSeries}/{totalInSeries} collected
            </span>
          </div>

          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: '#2a2520',
              marginBottom: '14px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(ownedInSeries / totalInSeries) * 100}%`,
                height: '100%',
                borderRadius: '3px',
                background: ownedInSeries === totalInSeries ? '#6b9e7a' : accent,
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          {ownedInSeries === totalInSeries && totalInSeries > 0 && (
            <p
              style={{
                fontSize: '11px',
                color: '#6b9e7a',
                marginBottom: '10px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              🎉 Complete collection! You have them all!
            </p>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: '8px',
            }}
          >
            {Array.from({ length: totalInSeries }, (_, i) => {
              const num = i + 1;
              const seriesBook = seriesBooks.find((b) => b.seriesNumber === num);
              const owned = seriesBook && isInLibrary(seriesBook.id);
              const isCurrent = seriesBook?.id === book.id;

              if (seriesBook) {
                return (
                  <div
                    key={num}
                    onClick={() => navigate(`/book/${seriesBook.id}`)}
                    style={{ cursor: 'pointer', textAlign: 'center', opacity: owned ? 1 : 0.5 }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        border: isCurrent ? `2px solid ${accent}` : '2px solid transparent',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <BookCover
                        src={seriesBook.cover}
                        title={seriesBook.title}
                        bookId={seriesBook.id}
                        width={56}
                        height={80}
                        borderRadius="4px"
                      />
                      {owned && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            background: '#6b9e7a',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            color: 'white',
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '8px',
                        color: isCurrent ? accent : muted,
                        marginTop: '2px',
                        fontWeight: isCurrent ? 700 : 400,
                      }}
                    >
                      #{num}
                    </p>
                  </div>
                );
              }

              return (
                <div key={num} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '80px',
                      borderRadius: '6px',
                      border: '2px dashed #2a2520',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      background: '#141010',
                    }}
                  >
                    <span style={{ fontSize: '16px', color: '#2a2520' }}>?</span>
                  </div>
                  <p style={{ fontSize: '8px', color: '#2a2520', marginTop: '2px' }}>#{num}</p>
                </div>
              );
            })}
          </div>

          {seriesInfo && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              {seriesInfo.completed ? (
                <span style={{ fontSize: '10px', color: '#6b9e7a' }}>
                  ✅ Series complete · {totalInSeries} books
                </span>
              ) : (
                <div>
                  <span style={{ fontSize: '10px', color: '#c9a84c' }}>
                    ⏳ Ongoing series · {seriesBooks.length} of {totalInSeries || '?'} released
                  </span>
                  {seriesInfo.joke && (
                    <p
                      style={{
                        fontSize: '10px',
                        color: muted,
                        fontStyle: 'italic',
                        marginTop: '4px',
                      }}
                    >
                      {seriesInfo.joke}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* More by Author */}
      {authorBooks.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '10px',
            }}
          >
            ✍️ More by {book.author}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {authorBooks.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/book/${a.id}`)}
                className="flex-shrink-0"
                style={{ width: '80px', cursor: 'pointer' }}
              >
                <BookCover
                  src={a.cover}
                  title={a.title}
                  author={a.author}
                  bookId={a.id}
                  width={80}
                  height={112}
                  borderRadius="8px"
                />
                <p style={{ fontSize: '10px', color: muted, marginTop: '4px' }} className="truncate">
                  {a.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar */}
      {similar.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: accent,
              marginBottom: '10px',
            }}
          >
            💡 You might also like
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {similar.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/book/${s.id}`)}
                className="flex-shrink-0"
                style={{ width: '80px', cursor: 'pointer' }}
              >
                <BookCover
                  src={s.cover}
                  title={s.title}
                  author={s.author}
                  bookId={s.id}
                  width={80}
                  height={112}
                  borderRadius="8px"
                />
                <p style={{ fontSize: '10px', color: muted, marginTop: '4px' }} className="truncate">
                  {s.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCoverChanger && (
        <CoverChanger
          bookId={book.id}
          bookTitle={book.title}
          bookAuthor={book.author}
          onChanged={(newUrl) => {
            setOverrideSrc(newUrl);
            setShowCoverChanger(false);
          }}
          onClose={() => setShowCoverChanger(false)}
        />
      )}
    </div>
  );
}
