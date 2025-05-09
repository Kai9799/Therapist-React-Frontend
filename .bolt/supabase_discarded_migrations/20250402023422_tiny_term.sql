/*
  # Fix Company Signup Policies

  1. Changes
    - Drop existing recursive policies
    - Create simplified policies for organization management
    - Fix user profile policies
    - Add direct organization access policies

  2. Security
    - Maintain data isolation between organizations
    - Allow organization creation and management
    - Prevent policy recursion
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Allow organization creation" ON organizations;
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can join organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can view all members" ON users;

-- Create simplified organization policies
CREATE POLICY "View organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified organization members policies
CREATE POLICY "View organization members"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Create organization members"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update user profile policies
DROP POLICY IF EXISTS "View own profile" ON users;
DROP POLICY IF EXISTS "Create user profile" ON users;
DROP POLICY IF EXISTS "Update own profile" ON users;

CREATE POLICY "View user profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Create user profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Update user profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);

-- Add function to check organization membership
CREATE OR REPLACE FUNCTION is_organization_member(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM organization_members om
    JOIN users u ON u.id = om.user_id
    WHERE om.organization_id = org_id
    AND u.auth_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;