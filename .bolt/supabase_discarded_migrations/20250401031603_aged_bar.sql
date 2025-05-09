/*
  # Update auth_id to user_id References

  1. Changes
    - Drop existing policies using auth_id
    - Create new policies using user_id
    - Update foreign key references
    - Ensure data consistency

  2. Security
    - Maintain data isolation
    - Preserve access controls
    - Update policy conditions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for signup" ON therapists;
DROP POLICY IF EXISTS "Enable read access" ON therapists;
DROP POLICY IF EXISTS "Enable update own profile" ON therapists;
DROP POLICY IF EXISTS "Company admin read access" ON therapists;
DROP POLICY IF EXISTS "Company admin update access" ON therapists;

-- Create new policies using user_id
CREATE POLICY "Enable insert for signup"
  ON therapists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    CASE
      WHEN user_id IS NULL THEN true
      WHEN user_id = auth.uid()::uuid THEN true
      ELSE false
    END
  );

CREATE POLICY "Enable read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::uuid);

CREATE POLICY "Enable update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::uuid)
  WITH CHECK (user_id = auth.uid()::uuid);

-- Add company admin policies
CREATE POLICY "Company admin read access"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    CASE
      WHEN user_id = auth.uid()::uuid THEN true
      WHEN EXISTS (
        SELECT 1
        FROM therapists admin
        WHERE admin.user_id = auth.uid()::uuid
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
      WHEN user_id = auth.uid()::uuid THEN true
      WHEN EXISTS (
        SELECT 1
        FROM therapists admin
        WHERE admin.user_id = auth.uid()::uuid
        AND admin.role = 'company_admin'
        AND admin.company_id = therapists.company_id
        AND therapists.role != 'company_admin'
      ) THEN true
      ELSE false
    END
  )
  WITH CHECK (
    CASE
      WHEN user_id = auth.uid()::uuid THEN true
      WHEN EXISTS (
        SELECT 1
        FROM therapists admin
        WHERE admin.user_id = auth.uid()::uuid
        AND admin.role = 'company_admin'
        AND admin.company_id = therapists.company_id
        AND therapists.role != 'company_admin'
      ) THEN true
      ELSE false
    END
  );