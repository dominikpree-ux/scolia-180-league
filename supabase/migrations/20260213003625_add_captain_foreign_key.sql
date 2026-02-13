/*
  # Add Captain Foreign Key to Teams

  1. Changes
    - Add foreign key constraint on `teams.captain_id` referencing `players.id`
    - This constraint was deferred until after the players table was created

  2. Important Notes
    - Uses IF NOT EXISTS pattern to safely add the constraint
    - ON DELETE SET NULL to handle captain removal gracefully
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'teams_captain_id_fkey'
    AND table_name = 'teams'
  ) THEN
    ALTER TABLE teams
    ADD CONSTRAINT teams_captain_id_fkey
    FOREIGN KEY (captain_id)
    REFERENCES players(id)
    ON DELETE SET NULL;
  END IF;
END $$;