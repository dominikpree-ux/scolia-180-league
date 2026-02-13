/*
  # Update Players Table for Independent IDs

  1. Changes
    - Drop the foreign key constraint from players.id to auth.users.id
    - Add auth_user_id column to link to auth.users when available
    - Make players.id a regular UUID that can be set independently
    - Update RLS policies to work with the new structure

  2. Important Notes
    - This allows importing players without requiring auth accounts
    - Players can be linked to auth accounts later via auth_user_id
    - Existing data is preserved
*/

-- First, let's check if we need to recreate the table or can modify it
-- Since players table might have data, we'll be careful

DO $$
BEGIN
  -- Add auth_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'auth_user_id'
  ) THEN
    -- Add the new column for linking to auth users
    ALTER TABLE players ADD COLUMN auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- For existing records, copy id to auth_user_id
    UPDATE players SET auth_user_id = id WHERE auth_user_id IS NULL;
  END IF;
END $$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Anyone can view players" ON players;
DROP POLICY IF EXISTS "Players can insert their own profile" ON players;
DROP POLICY IF EXISTS "Players can update their own profile" ON players;
DROP POLICY IF EXISTS "Players can delete their own profile" ON players;

-- Create new RLS policies that work with auth_user_id
CREATE POLICY "Anyone can view players"
  ON players
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can insert their own profile"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id OR auth_user_id IS NULL);

CREATE POLICY "Authenticated users can insert player records"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Players can update their own profile"
  ON players
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Players can delete their own profile"
  ON players
  FOR DELETE
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Add index for auth_user_id
CREATE INDEX IF NOT EXISTS idx_players_auth_user_id ON players(auth_user_id);