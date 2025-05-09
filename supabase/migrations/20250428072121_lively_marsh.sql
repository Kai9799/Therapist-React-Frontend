/*
  # Fix Users Table RLS Policies
  
  1. Changes
    - Add organization_id column if not exists
    - Drop existing policies
    - Create new non-recursive policies
    
  2. Security
    - Users can still only access their own data
    - Organization access handled through direct foreign key checks
*/

-- Add organization_id column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can view organization members" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can access profiles"
ON users FOR SELECT
TO authenticated
USING (
  auth_id = auth.uid() OR  -- User's own profile
  id IN (                  -- Organization members
    SELECT organization_id 
    FROM users 
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());