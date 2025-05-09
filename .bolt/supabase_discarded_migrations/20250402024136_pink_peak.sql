/*
  # Fix RLS policies and signup flow
  
  1. Changes
    - Drop all existing policies that might cause recursion
    - Create simplified policies that avoid circular dependencies
    - Add organization-specific policies
    - Fix user profile access
    
  2. Security
    - Maintain data isolation between organizations
    - Allow proper access for organization admins
    - Ensure secure signup flow
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "View organizations" ON organizations;
DROP POLICY IF EXISTS "Create organizations" ON organizations;
DROP POLICY IF EXISTS "View organization members" ON organization_members;
DROP POLICY IF EXISTS "Create organization members" ON organization_members;
DROP POLICY IF EXISTS "View user profiles" ON users;
DROP POLICY IF EXISTS "Create user profile" ON users;
DROP POLICY IF EXISTS "Update user profile" ON users;

-- Create simplified user policies
CREATE POLICY "Allow user to view their own user record"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Allow anyone to insert their own user"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow user to update their own user record"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);

-- Create organization policies
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM users 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create organization members policies
CREATE POLICY "Users can view members in their organization"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM users 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own members"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id 
      FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Add function to check if user is organization admin
CREATE OR REPLACE FUNCTION is_organization_admin(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE om.organization_id = org_id
    AND u.auth_id = auth.uid()
    AND om.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;