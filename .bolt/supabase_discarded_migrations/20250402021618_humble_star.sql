/*
  # Fix RLS policies for organization signup

  1. Changes
    - Drop existing recursive policies
    - Create simplified policies using JWT claims
    - Ensure proper organization creation flow
    - Fix user profile access

  2. Security
    - Maintain data isolation between organizations
    - Allow organization creation during signup
    - Enable proper member management
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Allow authenticated users to create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view members in their organizations" ON organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON organization_members;

-- Create simplified organization policies
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id = auth.jwt() ->> 'organization_id');

CREATE POLICY "Allow organization creation"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified organization members policies
CREATE POLICY "View organization members"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (organization_id = auth.jwt() ->> 'organization_id');

CREATE POLICY "Join organization"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Manage organization members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    organization_id = auth.jwt() ->> 'organization_id'
    AND EXISTS (
      SELECT 1 
      FROM organization_members om 
      WHERE om.organization_id = organization_members.organization_id
      AND om.user_id = (
        SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1
      )
      AND om.role = 'admin'
    )
  );

-- Update user profile policies to avoid recursion
DROP POLICY IF EXISTS "Allow user to view their own user record" ON users;
DROP POLICY IF EXISTS "Allow anyone to insert their own user" ON users;
DROP POLICY IF EXISTS "Allow user to update their own user record" ON users;

CREATE POLICY "View own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Create user profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid());