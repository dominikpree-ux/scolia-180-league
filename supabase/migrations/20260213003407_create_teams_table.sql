/*
  # Create Teams Table

  1. New Tables
    - `teams`
      - `id` (uuid, primary key) - Unique identifier for each team
      - `name` (text) - Team name
      - `captain_id` (uuid, nullable) - Reference to the team captain (will be set after players table exists)
      - `season_id` (uuid) - Reference to the season
      - `logo_url` (text, nullable) - Team logo URL
      - `wins` (integer) - Number of wins
      - `losses` (integer) - Number of losses
      - `draws` (integer) - Number of draws
      - `points` (integer) - Total points
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `teams` table
    - Add policy for public read access to all teams
    - Add policy for team captains to update their own team
    - Add policy for authenticated users to create teams

  3. Relationships
    - Foreign key to seasons table
*/

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  captain_id uuid,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  logo_url text,
  wins integer DEFAULT 0,
  losses integer DEFAULT 0,
  draws integer DEFAULT 0,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team captains can update their team"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (captain_id = auth.uid())
  WITH CHECK (captain_id = auth.uid());

CREATE POLICY "Authenticated users can delete teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (captain_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_teams_season_id ON teams(season_id);
CREATE INDEX IF NOT EXISTS idx_teams_captain_id ON teams(captain_id);
CREATE INDEX IF NOT EXISTS idx_teams_points ON teams(points DESC);