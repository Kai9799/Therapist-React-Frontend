/*
  # Fix Therapist Table RLS Policies

  1. Changes
    - Update RLS policies to properly handle UUID type casting
    - Ensure users can only access their own data
    - Fix profile creation during signup

  2. Security
    - Maintain data isolation between users
    - Allow profile creation for new users
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access" ON therapists;
DROP POLICY IF EXISTS "Enable update own profile" ON therapists;

-- Create new policies
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid()::uuid);

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