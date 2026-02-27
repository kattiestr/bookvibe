/*
  # Allow anonymous users to write book covers

  ## Changes
  - Add INSERT policy for books table allowing anyone to insert
  - Add UPDATE policy for books table allowing anyone to update

  ## Reason
  The app does not use auth, so we need to allow anonymous clients
  to save custom cover URLs directly without going through an Edge Function.
*/

CREATE POLICY "Anyone can insert book covers"
  ON books
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update book covers"
  ON books
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
