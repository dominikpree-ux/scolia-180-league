/*
  # Create Player Stats Table

  1. New Tables
    - `player_stats`
      - `id` (uuid, primary key) - Unique identifier for each stat record
      - `player_id` (uuid) - Reference to the player
      - `season_id` (uuid) - Reference to the season
      - `matches_played` (integer) - Total matches played
      - `matches_won` (integer) - Total matches won
      - `matches_lost` (integer) - Total matches lost
      - `matches_drawn` (integer) - Total matches drawn
      - `total_points` (integer) - Total points earned
      - `win_percentage` (decimal) - Win percentage
      - `average_score` (decimal) - Average score per match
      - `highest_score` (integer) - Highest score in a single match
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `player_stats` table
    - Add policy for anyone to view all player stats
    - Add policy for players to update their own stats
    - Add policy for authenticated users to create player stats

  3. Relationships
    - Foreign key to players table
    - Foreign key to seasons table
    - Unique constraint on (player_id, season_id)
*/

CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  matches_played integer DEFAULT 0,
  matches_won integer DEFAULT 0,
  matches_lost integer DEFAULT 0,
  matches_drawn integer DEFAULT 0,
  total_points integer DEFAULT 0,
  win_percentage decimal(5,2) DEFAULT 0.00,
  average_score decimal(5,2) DEFAULT 0.00,
  highest_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_player_season UNIQUE (player_id, season_id)
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player stats"
  ON player_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create player stats"
  ON player_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Players can update their own stats"
  ON player_stats
  FOR UPDATE
  TO authenticated
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Players can delete their own stats"
  ON player_stats
  FOR DELETE
  TO authenticated
  USING (player_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_season_id ON player_stats(season_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_total_points ON player_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_win_percentage ON player_stats(win_percentage DESC);