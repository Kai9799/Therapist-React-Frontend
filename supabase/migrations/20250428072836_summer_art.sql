/*
  # Fix Users Table Permissions
  
  1. Changes
    - Drop existing policies
    - Create new policies that allow:
      - User creation during signup
      - Profile viewing
      - Profile updates
    
  2. Security
    - Maintain data access control
    - Allow initial user creation
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable read access to own profile"
ON users FOR SELECT
TO authenticated
USING (
  auth_id = auth.uid() OR
  id IN (
    SELECT organization_id 
    FROM users 
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY "Enable insert for signup"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  auth_id = auth.uid()
);

CREATE POLICY "Enable update for own profile"
ON users FOR UPDATE
TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());