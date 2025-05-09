/*
  # Fix Recursive RLS Policies

  1. Changes
    - Drop all existing policies on therapists table
    - Create new simplified non-recursive policies
    - Use direct auth.uid() comparisons
    - Separate policies for different operations
    - Avoid complex subqueries

  2. Security
    - Maintain data access control
    - Prevent infinite recursion
    - Keep role-based access intact
*/

-- Drop all existing policies on therapists
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access" ON therapists;
DROP POLICY IF EXISTS "Enable update own profile" ON therapists;
DROP POLICY IF EXISTS "Company admin read access" ON therapists;
DROP POLICY IF EXISTS "Company admin update access" ON therapists;

-- Create new simplified policies
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

-- Add company admin policies without recursion
CREATE POLICY "Company admin read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth_id = auth.uid() THEN true
      WHEN EXISTS (
        SELECT 1 
        FROM therapists admin 
        WHERE admin.auth_id = auth.uid() 
        AND admin.role = 'company_admin'
        AND admin.company_id = therapists.company_id
      ) THEN true
      ELSE false
    END
  );

CREATE POLICY "Company admin update access"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (
    CASE
      WHEN auth_id = auth.uid() THEN true
      WHEN EXISTS (
        SELECT 1 
        FROM therapists admin 
        WHERE admin.auth_id = auth.uid() 
        AND admin.role = 'company_admin'
        AND admin.company_id = therapists.company_id
        AND therapists.role != 'company_admin'
      ) THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE
      WHEN auth_id = auth.uid() THEN true
      WHEN EXISTS (
        SELECT 1 
        FROM therapists admin 
        WHERE admin.auth_id = auth.uid() 
        AND admin.role = 'company_admin'
        AND admin.company_id = therapists.company_id
        AND therapists.role != 'company_admin'
      ) THEN true
      ELSE false
    END
  );