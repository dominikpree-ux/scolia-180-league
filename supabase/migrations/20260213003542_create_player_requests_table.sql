/*
  # Create Player Requests Table

  1. New Tables
    - `player_requests`
      - `id` (uuid, primary key) - Unique identifier for each request
      - `player_id` (uuid) - Reference to the player making the request
      - `team_id` (uuid) - Reference to the team
      - `message` (text, nullable) - Optional message from the player
      - `status` (text) - Request status: 'pending', 'accepted', 'rejected'
      - `responded_at` (timestamptz, nullable) - When the request was responded to
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `player_requests` table
    - Add policy for players to view their own requests
    - Add policy for team captains to view requests to their team
    - Add policy for players to create requests
    - Add policy for team captains to update requests to their team

  3. Relationships
    - Foreign key to players table
    - Foreign key to teams table
*/

CREATE TABLE IF NOT EXISTS player_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE player_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own requests"
  ON player_requests
  FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Team captains can view requests to their team"
  ON player_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = player_requests.team_id
      AND teams.captain_id = auth.uid()
    )
  );

CREATE POLICY "Players can create requests"
  ON player_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Team captains can update requests to their team"
  ON player_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = player_requests.team_id
      AND teams.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = player_requests.team_id
      AND teams.captain_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete their own requests"
  ON player_requests
  FOR DELETE
  TO authenticated
  USING (player_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_player_requests_player_id ON player_requests(player_id);
CREATE INDEX IF NOT EXISTS idx_player_requests_team_id ON player_requests(team_id);
CREATE INDEX IF NOT EXISTS idx_player_requests_status ON player_requests(status);
CREATE INDEX IF NOT EXISTS idx_player_requests_created_at ON player_requests(created_at DESC);