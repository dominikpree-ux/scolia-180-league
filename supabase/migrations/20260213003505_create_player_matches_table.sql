/*
  # Create Player Matches Table

  1. New Tables
    - `player_matches`
      - `id` (uuid, primary key) - Unique identifier for each player match
      - `match_id` (uuid) - Reference to the team match
      - `player1_id` (uuid) - Reference to first player
      - `player2_id` (uuid) - Reference to second player
      - `player1_score` (integer, nullable) - Player 1 score
      - `player2_score` (integer, nullable) - Player 2 score
      - `winner_id` (uuid, nullable) - Reference to the winning player
      - `match_order` (integer) - Order of the match within the team match
      - `status` (text) - Match status: 'scheduled', 'in_progress', 'completed', 'cancelled'
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `player_matches` table
    - Add policy for anyone to view all player matches
    - Add policy for players to update their own matches
    - Add policy for authenticated users to create player matches

  3. Relationships
    - Foreign key to matches table
    - Foreign key to players table (player1_id, player2_id, winner_id)
*/

CREATE TABLE IF NOT EXISTS player_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player1_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player2_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player1_score integer,
  player2_score integer,
  winner_id uuid REFERENCES players(id) ON DELETE SET NULL,
  match_order integer NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_players CHECK (player1_id != player2_id),
  CONSTRAINT valid_winner CHECK (winner_id IS NULL OR winner_id = player1_id OR winner_id = player2_id)
);

ALTER TABLE player_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view player matches"
  ON player_matches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create player matches"
  ON player_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Players can update their own matches"
  ON player_matches
  FOR UPDATE
  TO authenticated
  USING (player1_id = auth.uid() OR player2_id = auth.uid())
  WITH CHECK (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE POLICY "Players can delete their matches"
  ON player_matches
  FOR DELETE
  TO authenticated
  USING (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_player_matches_match_id ON player_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_player_matches_player1_id ON player_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_player_matches_player2_id ON player_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_player_matches_winner_id ON player_matches(winner_id);
CREATE INDEX IF NOT EXISTS idx_player_matches_status ON player_matches(status);