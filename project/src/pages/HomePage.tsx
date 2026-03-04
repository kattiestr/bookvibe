{/* This Month's Reads */}
{monthlyReads.length > 0 && (() => {
  const [showAll, setShowAll] = useState(false);
  const medals = ['🥇', '🥈', '🥉'];
  const visible = showAll ? monthlyReads : monthlyReads.slice(0, 3);

  return (
    <div style={{
      marginTop: 24,
      padding: '16px',
      borderRadius: '16px',
      background: bg2,
      border: '1px solid #2a2520',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <p style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: muted,
        }}>
          📚 This Month's Reads
        </p>
        <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>
          {monthlyReads.length} book{monthlyReads.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map((book, i) => {
          const { label, color } = getRatingLabel(book.rating || 0);
          return (
            <div
              key={book.bookId}
              onClick={() => navigate(`/library/${book.bookId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '10px',
                background: i < 3 ? 'rgba(196,160,124,0.04)' : 'transparent',
              }}
            >
              <span style={{ fontSize: i < 3 ? 18 : 13, flexShrink: 0, width: 24, textAlign: 'center', color: i >= 3 ? muted : undefined }}>
                {i < 3 ? medals[i] : `${i + 1}.`}
              </span>
              <img
                src={book.cover}
                alt={book.title}
                style={{
                  width: 36,
                  height: 52,
                  objectFit: 'cover',
                  borderRadius: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#e2ddd5',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {book.title}
                </p>
                <p style={{ fontSize: 10, color: muted }}>{book.author}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {book.rating > 0 && (
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#c9a84c' }}>
                    {book.rating}/10
                  </p>
                )}
                <p style={{ fontSize: 9, color, fontWeight: 600 }}>{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {monthlyReads.length > 3 && (
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '8px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            background: '#2a2520',
            color: muted,
            fontSize: 11,
          }}
        >
          {showAll
            ? '▲ Show less'
            : `▼ +${monthlyReads.length - 3} more books`}
        </button>
      )}
    </div>
  );
})()}
