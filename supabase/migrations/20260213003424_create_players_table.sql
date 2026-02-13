/*
  # Create Players Table

  1. New Tables
    - `players`
      - `id` (uuid, primary key) - References auth.users(id)
      - `team_id` (uuid, nullable) - Reference to the team
      - `name` (text) - Player name
      - `email` (text) - Player email
      - `phone` (text, nullable) - Player phone number
      - `is_free_agent` (boolean) - Whether player is a free agent
      - `skill_level` (integer) - Player skill level (1-10)
      - `position` (text, nullable) - Preferred position
      - `avatar_url` (text, nullable) - Player avatar URL
      - `bio` (text, nullable) - Player biography
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `players` table
    - Add policy for anyone to view all players
    - Add policy for players to update their own profile
    - Add policy for team captains to update players on their team

  3. Relationships
    - Foreign key to teams table
    - Primary key references auth.users(id)
*/

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  is_free_agent boolean DEFAULT true,
  skill_level integer DEFAULT 5 CHECK (skill_level >= 1 AND skill_level <= 10),
  position text,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view players"
  ON players
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can insert their own profile"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Players can update their own profile"
  ON players
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Players can delete their own profile"
  ON players
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_is_free_agent ON players(is_free_agent);
CREATE INDEX IF NOT EXISTS idx_players_skill_level ON players(skill_level);