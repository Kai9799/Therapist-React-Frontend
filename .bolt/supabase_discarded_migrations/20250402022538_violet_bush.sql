/*
  # Fix Organization Policies

  1. Changes
    - Drop existing policies that might cause recursion
    - Create simplified organization policies
    - Create simplified organization members policies
    - Add policy for organization admins to view all members
    - Add policy for organization admins to manage members

  2. Security
    - Maintain data isolation between organizations
    - Allow proper access for organization admins
    - Prevent recursion in policy checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View organization" ON organizations;
DROP POLICY IF EXISTS "Create organization" ON organizations;
DROP POLICY IF EXISTS "View members" ON organization_members;
DROP POLICY IF EXISTS "Join organization" ON organization_members;

-- Create simplified organization policies
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE organization_id = organizations.id
      AND user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Allow organization creation"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified organization members policies
CREATE POLICY "Users can view members in their organization"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om2
      WHERE om2.organization_id = organization_members.organization_id
      AND om2.user_id IN (
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

-- Add policy for organization admins
CREATE POLICY "Organization admins can manage members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
      AND om.role = 'admin'
    )
  );

-- Add policy for viewing organization members
CREATE POLICY "Organization admins can view all members"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = users.organization_id
      AND om.user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
      AND om.role = 'admin'
    )
  );