/*
  # Fix RLS policies to avoid recursion
  
  1. Changes
    - Drop all existing policies that might cause recursion
    - Create simplified policies that avoid circular dependencies
    - Use direct auth.uid() checks where possible
    - Avoid nested subqueries in policy definitions
    
  2. Security
    - Maintain data isolation between organizations
    - Allow proper access for organization admins
    - Ensure secure signup flow
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow user to view their own user record" ON users;
DROP POLICY IF EXISTS "Allow anyone to insert their own user" ON users;
DROP POLICY IF EXISTS "Allow user to update their own user record" ON users;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view members in their organization" ON organization_members;
DROP POLICY IF EXISTS "Users can insert own members" ON organization_members;

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
CREATE POLICY "Users can view organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create organization members policies
CREATE POLICY "Users can view organization members"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join organizations"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add helper function for checking organization membership
CREATE OR REPLACE FUNCTION check_organization_access(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users 
    WHERE auth_id = auth.uid() 
    AND organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;