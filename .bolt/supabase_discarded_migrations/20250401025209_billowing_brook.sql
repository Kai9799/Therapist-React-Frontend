/*
  # Fix Therapist Profile Creation and Access

  1. Changes
    - Drop existing policies
    - Add policy for initial profile creation
    - Add policy for profile access
    - Add policy for profile updates
    - Allow NULL auth_id during creation

  2. Security
    - Maintain data isolation
    - Enable profile creation
    - Restrict profile updates
*/

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access" ON therapists;
DROP POLICY IF EXISTS "Enable update own profile" ON therapists;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON therapists;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON therapists;
DROP POLICY IF EXISTS "Enable update for users based on email" ON therapists;

-- Create new policies
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE
      WHEN auth_id IS NULL THEN true
      WHEN auth_id = auth.uid()::uuid THEN true
      ELSE false
    END
  );

CREATE POLICY "Enable read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN auth_id IS NULL THEN true
      WHEN auth_id = auth.uid()::uuid THEN true
      ELSE false
    END
  );

CREATE POLICY "Enable update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid()::uuid)
  WITH CHECK (auth_id = auth.uid()::uuid);