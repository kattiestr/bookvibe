const CACHE_KEY = 'bookCovers_v4';

function getCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveCache(cache: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// Search Google Books by title + author → get thumbnail
async function fetchGoogleCover(
  title: string,
  author: string
): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author}`);
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&printType=books`
    );
    if (!res.ok) return null;
    const data = await res.json();

    const images = data.items?.[0]?.volumeInfo?.imageLinks;
    if (!images) return null;

    const url = images.thumbnail || images.smallThumbnail;
    if (!url) return null;

    // Make it bigger and https
    return url
      .replace('http://', 'https://')
      .replace('zoom=1', 'zoom=3')
      .replace('&edge=curl', '');
  } catch {
    return null;
  }
}

// Test if image URL actually works (not 1x1 pixel)
function testImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const timeout = setTimeout(() => resolve(false), 5000);
    img.onload = () => {
      clearTimeout(timeout);
      resolve(img.naturalWidth > 10 && img.naturalHeight > 10);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
    img.src = url;
  });
}

// Get best cover for one book
export async function getBestCover(
  bookId: string,
  title: string,
  author: string,
  originalCover: string
): Promise<string> {
  const cache = getCache();

  // Already cached
  if (cache[bookId] && cache[bookId].length > 10) {
    return cache[bookId];
  }

  // Test original cover first
  const originalWorks = await testImage(originalCover);
  if (originalWorks) {
    cache[bookId] = originalCover;
    saveCache(cache);
    return originalCover;
  }

  // Original broken → search Google Books
  const googleUrl = await fetchGoogleCover(title, author);
  if (googleUrl) {
    // Test Google's URL too
    const googleWorks = await testImage(googleUrl);
    if (googleWorks) {
      cache[bookId] = googleUrl;
      saveCache(cache);
      return googleUrl;
    }

    // Try smaller zoom
    const smallerUrl = googleUrl.replace('zoom=3', 'zoom=1');
    const smallerWorks = await testImage(smallerUrl);
    if (smallerWorks) {
      cache[bookId] = smallerUrl;
      saveCache(cache);
      return smallerUrl;
    }
  }

  // Nothing works — mark as failed so we don't retry
  cache[bookId] = 'NONE';
  saveCache(cache);
  return '';
}

// Process all books in background
export async function fixAllCovers(
  books: { id: string; title: string; author: string; cover: string }[],
  onProgress?: (fixed: number, total: number) => void
): Promise<Record<string, string>> {
  const cache = getCache();
  const results: Record<string, string> = {};

  // Separate cached from uncached
  const uncached: typeof books = [];
  for (const book of books) {
    if (
      cache[book.id] &&
      cache[book.id] !== 'NONE' &&
      cache[book.id].length > 10
    ) {
      results[book.id] = cache[book.id];
    } else if (cache[book.id] === 'NONE') {
      results[book.id] = '';
    } else {
      uncached.push(book);
    }
  }

  onProgress?.(books.length - uncached.length, books.length);

  // Process uncached in batches of 2
  for (let i = 0; i < uncached.length; i += 2) {
    const batch = uncached.slice(i, i + 2);

    await Promise.all(
      batch.map(async (book) => {
        const cover = await getBestCover(
          book.id,
          book.title,
          book.author,
          book.cover
        );
        results[book.id] = cover;
      })
    );

    onProgress?.(
      books.length - uncached.length + i + batch.length,
      books.length
    );

    // Delay to avoid rate limiting
    if (i + 2 < uncached.length) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  return results;
}

export function getCachedCover(bookId: string): string | null {
  const cache = getCache();
  const val = cache[bookId];
  if (!val || val === 'NONE') return null;
  return val;
}

export function clearCoverCache() {
  localStorage.removeItem(CACHE_KEY);
}
