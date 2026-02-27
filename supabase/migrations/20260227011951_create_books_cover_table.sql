/*
  # Create books table for cover_path storage

  1. New Tables
    - `books`
      - `id` (uuid, primary key)
      - `external_id` (text, unique) — matches the local booksDatabase book.id (e.g. "1", "2")
      - `cover_path` (text, nullable) — Supabase Storage path, e.g. "defaults/1.jpg"
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Public SELECT on cover_path (needed for frontend to read covers without auth)
    - No INSERT/UPDATE from client — only service role (admin API) writes to this table

  3. Notes
    - This table only stores admin-set cover overrides
    - The external_id links to booksDatabase.id on the frontend
    - Storage bucket "covers" must exist (created separately)
*/

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  cover_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read book cover paths"
  ON books
  FOR SELECT
  TO anon, authenticated
  USING (true);
