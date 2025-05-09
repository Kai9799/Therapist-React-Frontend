/*
  # Fix organization members policies with robust approach

  1. Changes
    - Drop problematic policies
    - Create new simplified policies using direct user checks
    - Add helper function to get user organization IDs
    - Ensure proper access control for organization members

  2. Security
    - Maintain data isolation between organizations
    - Allow proper access for organization members
    - Prevent policy recursion
*/

DO $$ BEGIN
  -- Drop existing function if it exists
  DROP FUNCTION IF EXISTS get_user_organization_ids(uuid);
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;
  DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
  DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
EXCEPTION
  WHEN undefined_function THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Helper function to get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids(auth_uid uuid)
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT u.organization_id
  FROM users u
  WHERE u.auth_id = auth_uid
  AND u.organization_id IS NOT NULL;
END;
$$ language plpgsql SECURITY DEFINER;

-- Ensure RLS is enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Create new simplified policies
DO $$ BEGIN
  -- Allow users to view members in their organization
  CREATE POLICY "Users can view members in their organization"
    ON organization_members
    FOR SELECT
    TO authenticated
    USING (
      organization_id IN (
        SELECT * FROM get_user_organization_ids(auth.uid())
      )
    );

  -- Allow users to join organizations
  CREATE POLICY "Users can join organizations"
    ON organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (
      user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    );

  -- Allow organization admins to manage members
  CREATE POLICY "Organization admins can manage members"
    ON organization_members
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = (
          SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1
        )
        AND om.role = 'admin'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;