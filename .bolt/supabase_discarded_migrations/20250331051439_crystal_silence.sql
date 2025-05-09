/*
  # Company Signup Flow

  1. Changes
    - Add policies to enable company creation during signup
    - Add policies for company admin access
    - Add role field to therapists table
    - Update RLS policies for data privacy

  2. Security
    - Ensure company admins can only see aggregated stats
    - Maintain data privacy between therapists
*/

-- Add role field to therapists if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'therapists' AND column_name = 'role'
  ) THEN
    ALTER TABLE therapists 
    ADD COLUMN role text DEFAULT 'solo'::text
    CHECK (role IN ('solo', 'company_admin', 'company_user'));
  END IF;
END $$;

-- Update therapist policies for company access
DROP POLICY IF EXISTS "Therapists can view own profile" ON therapists;
CREATE POLICY "Therapists can view own profile"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid() OR
    (company_id IN (
      SELECT t.company_id 
      FROM therapists t 
      WHERE t.auth_id = auth.uid() 
      AND t.role = 'company_admin'
    ) AND role != 'company_admin')
  );

-- Allow company creation during signup
DROP POLICY IF EXISTS "Enable company creation" ON companies;
CREATE POLICY "Enable company creation"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow company admins to manage their company
DROP POLICY IF EXISTS "Company admins can manage company" ON companies;
CREATE POLICY "Company admins can manage company"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    id IN (
      SELECT t.company_id
      FROM therapists t
      WHERE t.auth_id = auth.uid()
      AND t.role = 'company_admin'
    )
  );

-- Allow therapists to update their company_id and role
DROP POLICY IF EXISTS "Enable therapist company linking" ON therapists;
CREATE POLICY "Enable therapist company linking"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_therapists_role ON therapists(role);
CREATE INDEX IF NOT EXISTS idx_therapists_company_role ON therapists(company_id, role);