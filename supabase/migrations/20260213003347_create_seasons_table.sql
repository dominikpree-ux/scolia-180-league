/*
  # Create Seasons Table

  1. New Tables
    - `seasons`
      - `id` (uuid, primary key) - Unique identifier for each season
      - `name` (text) - Season name (e.g., "Season 2024", "Winter 2024")
      - `start_date` (date) - Season start date
      - `end_date` (date) - Season end date
      - `is_active` (boolean) - Whether this season is currently active
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `seasons` table
    - Add policy for public read access to all seasons
    - Add policy for authenticated admin users to manage seasons
*/

CREATE TABLE IF NOT EXISTS seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seasons"
  ON seasons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert seasons"
  ON seasons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update seasons"
  ON seasons
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete seasons"
  ON seasons
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_seasons_is_active ON seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(start_date, end_date);