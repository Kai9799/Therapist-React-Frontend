/*
  # Update RLS Policies

  1. Changes
    - Add INSERT policy for therapists table
    - Update SELECT policy to handle no rows case
    - Add policy for creating initial profile

  2. Security
    - Maintain data isolation between users
    - Allow profile creation for new users
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Therapists can view own profile" ON therapists;
DROP POLICY IF EXISTS "Therapists can update own profile" ON therapists;

-- Create new policies
CREATE POLICY "Enable therapist profile creation"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Therapists can view own profile"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Therapists can update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());