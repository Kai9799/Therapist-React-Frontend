/*
  # Add Age Field to Clients Table

  1. Changes
    - Add age field to clients table
    - Update database types
    - Ensure backward compatibility
*/

-- Add age column to clients table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'age'
  ) THEN
    ALTER TABLE clients ADD COLUMN age text;
  END IF;
END $$;