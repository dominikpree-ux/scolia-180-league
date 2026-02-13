/*
  # Create Messages Tables

  1. New Tables
    - `player_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `sender_id` (uuid) - Reference to the sender player
      - `receiver_id` (uuid) - Reference to the receiver player
      - `content` (text) - Message content
      - `is_read` (boolean) - Whether the message has been read
      - `created_at` (timestamptz) - Record creation timestamp

    - `team_messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `sender_team_id` (uuid) - Reference to the sender team
      - `receiver_team_id` (uuid) - Reference to the receiver team
      - `sender_player_id` (uuid) - Reference to the player who sent the message
      - `content` (text) - Message content
      - `is_read` (boolean) - Whether the message has been read
      - `created_at` (timestamptz) - Record creation timestamp

    - `messages`
      - `id` (uuid, primary key) - Unique identifier for each message
      - `sender_id` (uuid) - Reference to the sender player
      - `content` (text) - Message content
      - `message_type` (text) - Type: 'league_chat', 'announcement'
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on all message tables
    - Add policies for players to view and send messages
    - Add policies for team captains to view team messages

  3. Relationships
    - Foreign keys to players and teams tables
*/

-- Player Messages Table
CREATE TABLE IF NOT EXISTS player_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE player_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their own messages"
  ON player_messages
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Players can send messages"
  ON player_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Players can update messages they received"
  ON player_messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

CREATE POLICY "Players can delete their sent messages"
  ON player_messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_player_messages_sender_id ON player_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_player_messages_receiver_id ON player_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_player_messages_created_at ON player_messages(created_at DESC);

-- Team Messages Table
CREATE TABLE IF NOT EXISTS team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  receiver_team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sender_player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their team messages"
  ON team_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = auth.uid()
      AND (players.team_id = team_messages.sender_team_id OR players.team_id = team_messages.receiver_team_id)
    )
  );

CREATE POLICY "Team members can send messages"
  ON team_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_player_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = auth.uid()
      AND players.team_id = sender_team_id
    )
  );

CREATE POLICY "Team captains can update messages to their team"
  ON team_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_messages.receiver_team_id
      AND teams.captain_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_messages.receiver_team_id
      AND teams.captain_id = auth.uid()
    )
  );

CREATE POLICY "Senders can delete their team messages"
  ON team_messages
  FOR DELETE
  TO authenticated
  USING (sender_player_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_team_messages_sender_team_id ON team_messages(sender_team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_receiver_team_id ON team_messages(receiver_team_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_sender_player_id ON team_messages(sender_player_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at DESC);

-- League Messages Table (for league-wide chat and announcements)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'league_chat' CHECK (message_type IN ('league_chat', 'announcement')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view league messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can send league chat messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Senders can delete their own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);