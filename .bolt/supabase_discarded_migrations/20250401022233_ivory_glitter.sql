/*
  # Add Subscription Type Field
  
  1. Changes
    - Add subscription_type field to therapists table
    - Update existing records
    - Add check constraint for valid types
    
  2. Security
    - Maintain existing policies
    - Ensure data consistency
*/

-- Add subscription_type column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapists' AND column_name = 'subscription_type'
  ) THEN
    ALTER TABLE therapists 
    ADD COLUMN subscription_type text DEFAULT 'individual'::text
    CHECK (subscription_type IN ('individual', 'company'));
  END IF;
END $$;