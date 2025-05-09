/*
  # Fix Therapist Table RLS Policies

  1. Changes
    - Remove recursive policies
    - Add simple, direct policies
    - Maintain data isolation
    - Fix infinite recursion issue

  2. Security
    - Ensure proper access control
    - Prevent unauthorized access
    - Maintain company admin capabilities
*/

-- Drop all existing policies on therapists
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access for own profile" ON therapists;
DROP POLICY IF EXISTS "Enable update for own profile" ON therapists;
DROP POLICY IF EXISTS "Enable company admin updates" ON therapists;

-- Create new non-recursive policies
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Enable read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Enable update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Add separate policy for company admins to view members
CREATE POLICY "Company admin read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    company_id = (
      SELECT company_id 
      FROM therapists 
      WHERE auth_id = auth.uid() 
      AND role = 'company_admin'
      LIMIT 1
    )
  );

-- Add separate policy for company admins to update members
CREATE POLICY "Company admin update access"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (
    company_id = (
      SELECT company_id 
      FROM therapists 
      WHERE auth_id = auth.uid() 
      AND role = 'company_admin'
      LIMIT 1
    )
    AND role != 'company_admin'
  )
  WITH CHECK (
    company_id = (
      SELECT company_id 
      FROM therapists 
      WHERE auth_id = auth.uid() 
      AND role = 'company_admin'
      LIMIT 1
    )
    AND role != 'company_admin'
  );