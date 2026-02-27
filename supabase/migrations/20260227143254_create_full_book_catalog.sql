/*
  # Create Full Book Catalog Schema

  Creates the complete relational schema for the book catalog, separate from the
  existing `books` cover-map table.

  1. New Tables
    - `catalog_series` - book series metadata (name)
    - `catalog_books` - full book records (title, author, isbn, pages, year, spice, series FK, cover URL, description, rating)
    - `catalog_tags` - tags with type: trope | genre | mood | vibe
    - `catalog_book_tags` - many-to-many: books <-> tags
    - `catalog_book_similar` - similar book pairs (book_id, similar_book_id)
    - `catalog_book_vibes` - text vibe lines per book (ordered)

  2. Security
    - RLS enabled on all tables
    - Public read-only access (anon role can SELECT)
    - No write access for anon (inserts done via service role in migrations)

  3. Notes
    - Does NOT modify the existing `books` table (used for cover storage)
    - `catalog_books.id` uses text to match the static data IDs ('1','2',...)
    - `cover_url` stores the computed cover URL from books.ts
    - `similar` in books.ts uses book titles not IDs, so catalog_book_similar stores book IDs
*/

CREATE TABLE IF NOT EXISTS catalog_series (
  id text PRIMARY KEY,
  name text NOT NULL
);

ALTER TABLE catalog_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalog_series"
  ON catalog_series FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS catalog_books (
  id text PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  isbn text NOT NULL DEFAULT '',
  cover_url text NOT NULL DEFAULT '',
  spice smallint NOT NULL DEFAULT 0,
  pages integer,
  year integer,
  description text,
  rating numeric(3,1),
  series_id text REFERENCES catalog_series(id),
  series_number integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catalog_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalog_books"
  ON catalog_books FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS catalog_tags (
  id text PRIMARY KEY,
  slug text NOT NULL,
  name text NOT NULL,
  type text NOT NULL
);

ALTER TABLE catalog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalog_tags"
  ON catalog_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS catalog_book_tags (
  book_id text NOT NULL REFERENCES catalog_books(id),
  tag_id text NOT NULL REFERENCES catalog_tags(id),
  PRIMARY KEY (book_id, tag_id)
);

ALTER TABLE catalog_book_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalog_book_tags"
  ON catalog_book_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS catalog_book_similar (
  book_id text NOT NULL REFERENCES catalog_books(id),
  similar_book_id text NOT NULL REFERENCES catalog_books(id),
  PRIMARY KEY (book_id, similar_book_id)
);

ALTER TABLE catalog_book_similar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalog_book_similar"
  ON catalog_book_similar FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS catalog_book_vibes (
  id bigserial PRIMARY KEY,
  book_id text NOT NULL REFERENCES catalog_books(id),
  vibe_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE catalog_book_vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read catalog_book_vibes"
  ON catalog_book_vibes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_catalog_books_series ON catalog_books(series_id);
CREATE INDEX IF NOT EXISTS idx_catalog_books_author ON catalog_books(author);
CREATE INDEX IF NOT EXISTS idx_catalog_book_tags_book ON catalog_book_tags(book_id);
CREATE INDEX IF NOT EXISTS idx_catalog_book_tags_tag ON catalog_book_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_catalog_book_vibes_book ON catalog_book_vibes(book_id);
CREATE INDEX IF NOT EXISTS idx_catalog_book_similar_book ON catalog_book_similar(book_id);
