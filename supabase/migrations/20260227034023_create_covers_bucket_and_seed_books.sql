/*
  # Create covers storage bucket and seed books table

  1. Storage
    - Create 'covers' bucket (public) for book cover images
    - Add policies for public read and service-role write

  2. Data
    - Seed all book external_ids (1-140) into the books table
    - Uses ON CONFLICT to safely handle re-runs

  3. Notes
    - cover_path remains NULL until an admin sets a cover
    - Storage bucket is public so covers display without auth
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read covers"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'covers');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role upload covers"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'covers');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role update covers"
    ON storage.objects FOR UPDATE
    TO service_role
    USING (bucket_id = 'covers')
    WITH CHECK (bucket_id = 'covers');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO books (external_id) VALUES
  ('1'),('2'),('3'),('4'),('5'),('6'),('7'),('8'),('9'),('10'),
  ('11'),('12'),('13'),('14'),('15'),('16'),('17'),('18'),('19'),('20'),
  ('21'),('22'),('23'),('24'),('25'),('26'),('27'),('28'),('29'),('30'),
  ('31'),('32'),('33'),('34'),('35'),('36'),('37'),('38'),('39'),('40'),
  ('41'),('42'),('43'),('44'),('45'),('46'),('47'),('48'),('49'),('50'),
  ('51'),('52'),('53'),('54'),('55'),('56'),('57'),('58'),('59'),('60'),
  ('61'),('62'),('63'),('64'),('65'),('66'),('67'),('68'),('69'),('70'),
  ('71'),('72'),('73'),('74'),('75'),('76'),('77'),('78'),('79'),('80'),
  ('81'),('82'),('83'),('84'),('85'),('86'),('87'),('88'),('89'),('90'),
  ('91'),('92'),('93'),('94'),('95'),('96'),('97'),('98'),('99'),('100'),
  ('101'),('102'),('103'),('104'),('105'),('106'),('107'),('108'),('109'),('110'),
  ('111'),('112'),('113'),('114'),('115'),('116'),('117'),('118'),('119'),('120'),
  ('121'),('122'),('123'),('124'),('125'),('126'),('127'),('128'),('129'),('130'),
  ('131'),('132'),('133'),('134'),('135'),('136'),('137'),('138'),('139'),('140')
ON CONFLICT (external_id) DO NOTHING;
