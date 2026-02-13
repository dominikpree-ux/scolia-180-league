/*
  # Update Players Table with Additional Fields

  1. Changes
    - Add `nickname` (text) - Player nickname/display name
    - Add `is_captain` (boolean) - Whether player is a team captain
    - Add `available_as_substitute` (boolean) - Whether player is available as substitute
    - Add `preferred_league` (jsonb) - Preferred league tiers (array of strings)
    - Add `looking_for_team` (boolean) - Whether player is looking for a team

  2. Important Notes
    - Uses IF NOT EXISTS pattern to safely add columns
    - All new columns are nullable or have sensible defaults
    - preferred_league uses jsonb for array storage
*/

DO $$
BEGIN
  -- Add nickname column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'nickname'
  ) THEN
    ALTER TABLE players ADD COLUMN nickname text;
  END IF;

  -- Add is_captain column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'is_captain'
  ) THEN
    ALTER TABLE players ADD COLUMN is_captain boolean DEFAULT false;
  END IF;

  -- Add available_as_substitute column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'available_as_substitute'
  ) THEN
    ALTER TABLE players ADD COLUMN available_as_substitute boolean DEFAULT false;
  END IF;

  -- Add preferred_league column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'preferred_league'
  ) THEN
    ALTER TABLE players ADD COLUMN preferred_league jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add looking_for_team column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'looking_for_team'
  ) THEN
    ALTER TABLE players ADD COLUMN looking_for_team boolean DEFAULT false;
  END IF;
END $$;

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_players_is_captain ON players(is_captain);
CREATE INDEX IF NOT EXISTS idx_players_available_as_substitute ON players(available_as_substitute);
CREATE INDEX IF NOT EXISTS idx_players_looking_for_team ON players(looking_for_team);