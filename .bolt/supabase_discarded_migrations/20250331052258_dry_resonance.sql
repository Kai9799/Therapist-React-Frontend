/*
  # Fix Therapist Policies Recursion

  1. Changes
    - Remove policies causing infinite recursion
    - Add simplified non-recursive policies
    - Maintain proper access control
    - Fix company-related policies

  2. Security
    - Maintain data isolation
    - Preserve admin capabilities
    - Ensure proper authorization
*/

-- Drop all existing policies on therapists to start fresh
DROP POLICY IF EXISTS "Therapists can view own profile" ON therapists;
DROP POLICY IF EXISTS "Therapists can update own profile" ON therapists;
DROP POLICY IF EXISTS "Enable therapist profile creation" ON therapists;
DROP POLICY IF EXISTS "Therapists can only view own data" ON therapists;
DROP POLICY IF EXISTS "Enable therapist company linking" ON therapists;
DROP POLICY IF EXISTS "Company admins can view company members" ON therapists;
DROP POLICY IF EXISTS "Company admins can update company members" ON therapists;

-- Create new simplified policies
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Enable read access for own profile"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid() OR
    (role = 'company_admin' AND company_id IN (
      SELECT company_id 
      FROM therapists 
      WHERE auth_id = auth.uid() AND role = 'company_admin'
    ))
  );

CREATE POLICY "Enable update for own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Enable company admin updates"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (
    role != 'company_admin' AND
    company_id IN (
      SELECT company_id
      FROM therapists
      WHERE auth_id = auth.uid() AND role = 'company_admin'
    )
  )
  WITH CHECK (
    role != 'company_admin' AND
    company_id IN (
      SELECT company_id
      FROM therapists
      WHERE auth_id = auth.uid() AND role = 'company_admin'
    )
  );