/*
  # Fix RLS Policies for Users Table
  
  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new simplified policies for:
      - Selecting user profiles
      - Inserting new users during signup
      - Updating user profiles
    
  2. Security
    - Enable RLS
    - Allow users to access their own data
    - Allow organization access where appropriate
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access profiles" ON users;
DROP POLICY IF EXISTS "Enable read access to own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for signup" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view profiles"
ON users FOR SELECT
TO authenticated
USING (
  auth_id = auth.uid() OR
  id IN (
    SELECT organization_id 
    FROM users 
    WHERE auth_id = auth.uid()
  ) OR
  organization_id IN (
    SELECT id 
    FROM users 
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Users can insert profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Users can update profile"
ON users FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());