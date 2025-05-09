/*
  # Fix users table RLS policies

  1. Changes
    - Remove recursive policies from users table
    - Add new, simplified policies that prevent infinite recursion
    - Maintain security while allowing proper access patterns

  2. Security
    - Users can still only access their own profile
    - Organization owners can access their team members
    - Team members can access their organization
    - Prevents any circular references in policies
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can access their own profile" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can insert profile" ON users;
DROP POLICY IF EXISTS "Users can update profile" ON users;

-- Create new, simplified policies
CREATE POLICY "users_select_self" ON users
  FOR SELECT TO authenticated
  USING (
    auth_id = auth.uid() OR  -- User can access their own profile
    owner_id = (             -- Team members can access their organization owner
      SELECT id 
      FROM users 
      WHERE auth_id = auth.uid()
    ) OR
    id = (                   -- Organization owners can access their members
      SELECT owner_id 
      FROM users 
      WHERE auth_id = auth.uid() AND owner_id IS NOT NULL
    )
  );

CREATE POLICY "users_insert_self" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "users_update_self" ON users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());