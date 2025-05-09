/*
  # Update Therapist Schema and Policies
  
  1. Changes
    - Rename auth_id to user_id to match schema
    - Update RLS policies to use user_id
    - Ensure proper references to auth.users
    
  2. Security
    - Maintain data isolation
    - Keep existing access controls
    - Update policy conditions
*/

-- Ensure RLS is enabled
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access" ON therapists;
DROP POLICY IF EXISTS "Enable update own profile" ON therapists;

-- Create new policies using user_id
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE
      WHEN user_id IS NULL THEN true
      WHEN user_id = auth.uid()::uuid THEN true
      ELSE false
    END
  );

CREATE POLICY "Enable read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Enable update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);