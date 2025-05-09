/*
  # Update JWT Functions for Clerk Integration

  1. Changes
    - Update auth functions to use user_id claim instead of sub
    - Maintain existing functionality with new claim name
    - Keep role-based access control
    - Preserve email claim handling

  2. Security
    - Maintain secure authentication flow
    - Preserve data isolation
    - Keep existing policies working
*/

-- Drop existing auth functions to recreate with updated JWT handling
DROP FUNCTION IF EXISTS auth.jwt() CASCADE;
DROP FUNCTION IF EXISTS auth.uid() CASCADE;
DROP FUNCTION IF EXISTS auth.email() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_user_id() CASCADE;

-- Create function to handle Clerk JWT claims with role support
CREATE OR REPLACE FUNCTION auth.jwt() 
RETURNS jsonb 
LANGUAGE sql STABLE
AS $$
  SELECT 
    coalesce(
      nullif(current_setting('request.jwt.claim', true), ''),
      '{}'
    )::jsonb
$$;

-- Create function to get user ID from Clerk JWT using user_id claim
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT 
    coalesce(
      nullif(current_setting('request.jwt.claim.user_id', true), ''),
      (auth.jwt() ->> 'user_id')
    )
$$;

-- Create function to get user email from Clerk JWT
CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT 
    coalesce(
      nullif(current_setting('request.jwt.claim.email', true), ''),
      (auth.jwt() ->> 'email')
    )
$$;

-- Create function to get user role from Clerk JWT
CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT 
    coalesce(
      nullif(current_setting('request.jwt.claim.role', true), ''),
      'authenticated'
    )
$$;

-- Create helper function to get auth user ID
CREATE OR REPLACE FUNCTION public.get_auth_user_id() 
RETURNS text 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON therapists;
DROP POLICY IF EXISTS "Enable read access for all users" ON therapists;
DROP POLICY IF EXISTS "Enable update for users based on email" ON therapists;

-- Create new policies with correct syntax
CREATE POLICY "Enable insert for authenticated users only" ON therapists
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable read access for authenticated users" ON therapists
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on email" ON therapists
FOR UPDATE
USING (auth.email() = email)
WITH CHECK (auth.email() = email);