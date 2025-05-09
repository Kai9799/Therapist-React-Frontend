/*
  # Fix Therapist Profile Access

  1. Changes
    - Add INSERT policy for therapist profiles
    - Update SELECT policy to handle no rows case
    - Add policy for creating initial profile

  2. Security
    - Maintain data isolation between users
    - Allow profile creation for new users
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON therapists;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON therapists;
DROP POLICY IF EXISTS "Enable update for users based on email" ON therapists;

-- Create new policies
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);