/*
  # Create Matches Table

  1. New Tables
    - `matches`
      - `id` (uuid, primary key) - Unique identifier for each match
      - `season_id` (uuid) - Reference to the season
      - `home_team_id` (uuid) - Reference to home team
      - `away_team_id` (uuid) - Reference to away team
      - `match_date` (timestamptz) - Scheduled match date and time
      - `location` (text, nullable) - Match location/venue
      - `home_score` (integer, nullable) - Home team score
      - `away_score` (integer, nullable) - Away team score
      - `status` (text) - Match status: 'scheduled', 'in_progress', 'completed', 'cancelled'
      - `week_number` (integer, nullable) - Week number in the season
      - `notes` (text, nullable) - Additional notes about the match
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `matches` table
    - Add policy for anyone to view all matches
    - Add policy for team captains to update their team's match results
    - Add policy for authenticated users to create matches

  3. Relationships
    - Foreign key to seasons table
    - Foreign key to teams table (home_team_id)
    - Foreign key to teams table (away_team_id)
*/

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  home_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  match_date timestamptz NOT NULL,
  location text,
  home_score integer,
  away_score integer,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  week_number integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Team captains can update their matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
      AND teams.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
      AND teams.captain_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can delete matches"
  ON matches
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE (teams.id = matches.home_team_id OR teams.id = matches.away_team_id)
      AND teams.captain_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);