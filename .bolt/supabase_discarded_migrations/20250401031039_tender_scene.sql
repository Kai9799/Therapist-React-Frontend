/*
  # Update Therapist Profile RLS Policies

  1. Changes
    - Simplify RLS policies
    - Allow profile creation during signup
    - Enable profile management
    - Fix auth_id handling

  2. Security
    - Maintain data isolation
    - Allow profile creation
    - Restrict profile updates
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access" ON therapists;
DROP POLICY IF EXISTS "Enable update own profile" ON therapists;

-- Create new simplified policies
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
  USING (auth_id = auth.uid()::uuid);

CREATE POLICY "Enable update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid()::uuid)
  WITH CHECK (auth_id = auth.uid()::uuid);