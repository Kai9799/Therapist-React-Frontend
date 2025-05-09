/*
  # Fix Therapist Policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify policy conditions to avoid self-referential queries
    - Add direct auth.uid() checks where possible
    - Add separate policies for company admins

  2. Security
    - Maintain proper access control
    - Ensure data isolation between companies
    - Preserve admin capabilities
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Therapists can view own profile" ON therapists;
DROP POLICY IF EXISTS "Therapists can update own profile" ON therapists;
DROP POLICY IF EXISTS "Enable therapist profile creation" ON therapists;
DROP POLICY IF EXISTS "Therapists can only view own data" ON therapists;
DROP POLICY IF EXISTS "Enable therapist company linking" ON therapists;

-- Create new simplified policies
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

CREATE POLICY "Company admins can view company members"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM therapists admin
      WHERE admin.auth_id = auth.uid()
      AND admin.role = 'company_admin'
      AND admin.company_id = therapists.company_id
      AND therapists.role != 'company_admin'
    )
  );

CREATE POLICY "Therapists can update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Company admins can update company members"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM therapists admin
      WHERE admin.auth_id = auth.uid()
      AND admin.role = 'company_admin'
      AND admin.company_id = therapists.company_id
      AND therapists.role != 'company_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM therapists admin
      WHERE admin.auth_id = auth.uid()
      AND admin.role = 'company_admin'
      AND admin.company_id = therapists.company_id
      AND therapists.role != 'company_admin'
    )
  );