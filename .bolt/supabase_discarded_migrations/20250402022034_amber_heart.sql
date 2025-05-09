/*
  # Fix organization policies with UUID casting

  1. Changes
    - Drop existing policies that might cause recursion
    - Create new policies with explicit UUID casting
    - Simplify policy conditions to avoid recursion

  2. Security
    - Maintain data isolation between organizations
    - Allow organization creation during signup
    - Enable proper member management
*/

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "View organization" ON organizations;
DROP POLICY IF EXISTS "Create organization" ON organizations;
DROP POLICY IF EXISTS "View members" ON organization_members;
DROP POLICY IF EXISTS "Join organization" ON organization_members;

-- Create simplified organization policies with UUID casting
CREATE POLICY "View organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (auth.jwt() ->> 'organization_id')::uuid
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
    organization_id = (auth.jwt() ->> 'organization_id')::uuid
  );

CREATE POLICY "Join organization"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);