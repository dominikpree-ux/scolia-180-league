/*
  # Update Teams Table with Additional Fields

  1. Changes
    - Add `sets_won` (integer) - Number of sets won
    - Add `sets_lost` (integer) - Number of sets lost
    - Add `legs_won` (integer) - Number of legs won
    - Add `legs_lost` (integer) - Number of legs lost
    - Add `positions_needed` (integer) - Number of positions needed
    - Add `scolia_location` (text) - Team location
    - Add `looking_for_players` (boolean) - Whether team is recruiting
    - Add `average_group` (text) - Average group classification (A, B, C)
    - Add `league_tier` (text) - League tier (A, B, C)
    - Add `status` (text) - Team status (approved, pending, rejected)
    - Add `recruitment_message` (text) - Message for recruiting players
    - Add `captain_email` (text) - Captain's email address

  2. Important Notes
    - Uses IF NOT EXISTS pattern to safely add columns
    - All new columns are nullable or have sensible defaults
*/

DO $$
BEGIN
  -- Add sets_won column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'sets_won'
  ) THEN
    ALTER TABLE teams ADD COLUMN sets_won integer DEFAULT 0;
  END IF;

  -- Add sets_lost column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'sets_lost'
  ) THEN
    ALTER TABLE teams ADD COLUMN sets_lost integer DEFAULT 0;
  END IF;

  -- Add legs_won column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'legs_won'
  ) THEN
    ALTER TABLE teams ADD COLUMN legs_won integer DEFAULT 0;
  END IF;

  -- Add legs_lost column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'legs_lost'
  ) THEN
    ALTER TABLE teams ADD COLUMN legs_lost integer DEFAULT 0;
  END IF;

  -- Add positions_needed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'positions_needed'
  ) THEN
    ALTER TABLE teams ADD COLUMN positions_needed integer DEFAULT 0;
  END IF;

  -- Add scolia_location column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'scolia_location'
  ) THEN
    ALTER TABLE teams ADD COLUMN scolia_location text;
  END IF;

  -- Add looking_for_players column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'looking_for_players'
  ) THEN
    ALTER TABLE teams ADD COLUMN looking_for_players boolean DEFAULT false;
  END IF;

  -- Add average_group column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'average_group'
  ) THEN
    ALTER TABLE teams ADD COLUMN average_group text;
  END IF;

  -- Add league_tier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'league_tier'
  ) THEN
    ALTER TABLE teams ADD COLUMN league_tier text;
  END IF;

  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'status'
  ) THEN
    ALTER TABLE teams ADD COLUMN status text DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected'));
  END IF;

  -- Add recruitment_message column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'recruitment_message'
  ) THEN
    ALTER TABLE teams ADD COLUMN recruitment_message text;
  END IF;

  -- Add captain_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'captain_email'
  ) THEN
    ALTER TABLE teams ADD COLUMN captain_email text;
  END IF;
END $$;

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_teams_league_tier ON teams(league_tier);
CREATE INDEX IF NOT EXISTS idx_teams_average_group ON teams(average_group);
CREATE INDEX IF NOT EXISTS idx_teams_looking_for_players ON teams(looking_for_players);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);