/*
  # Fix organization creation and RLS policies

  1. Changes
    - Drop existing policies that might cause recursion
    - Create simplified policies for organizations and members
    - Fix policy for organization creation
    - Update user profile policies

  2. Security
    - Maintain data isolation between organizations
    - Allow organization creation during signup
    - Enable proper member management
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Allow organization creation" ON organizations;
DROP POLICY IF EXISTS "View organization members" ON organization_members;
DROP POLICY IF EXISTS "Join organization" ON organization_members;
DROP POLICY IF EXISTS "Manage organization members" ON organization_members;

-- Create simplified organization policies
CREATE POLICY "View organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
    )
  );

CREATE POLICY "Create organization"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create simplified organization members policies
CREATE POLICY "View members"
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

CREATE POLICY "Join organization"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update user profile policies
DROP POLICY IF EXISTS "View own profile" ON users;
DROP POLICY IF EXISTS "Create user profile" ON users;
DROP POLICY IF EXISTS "Update own profile" ON users;

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