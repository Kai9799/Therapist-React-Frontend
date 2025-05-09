/*
  # Fix Therapist RLS Policies

  1. Changes
    - Drop existing policies that may conflict
    - Create new policies with proper UUID casting
    - Add policy for initial signup
    - Add policy for profile management

  2. Security
    - Maintain data isolation
    - Allow profile creation
    - Enable profile updates
*/

-- Drop any existing policies
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access" ON therapists;
DROP POLICY IF EXISTS "Enable update own profile" ON therapists;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON therapists;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON therapists;
DROP POLICY IF EXISTS "Enable update for users based on email" ON therapists;

-- Create new policies with proper UUID handling
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_id = auth.uid()::uuid OR
    auth_id IS NULL
  );

CREATE POLICY "Enable read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid()::uuid OR
    auth_id IS NULL
  );

CREATE POLICY "Enable update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid()::uuid)
  WITH CHECK (auth_id = auth.uid()::uuid);