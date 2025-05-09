/*
  # Revert organization policies to previous state
  
  1. Changes
    - Drop recently added function and policies
    - Restore original organization member policies
    - Maintain proper access control
    
  2. Security
    - Maintain data isolation between organizations
    - Keep existing security model
*/

-- Drop recently added function and policies
DROP FUNCTION IF EXISTS get_user_organization_ids(uuid);
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;

-- Ensure RLS is enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Restore original policies
CREATE POLICY "Users can view members in their organization"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can join organizations"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

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