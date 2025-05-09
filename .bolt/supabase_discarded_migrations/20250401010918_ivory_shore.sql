/*
  # Fix JWT Template and RLS Policies

  1. Changes
    - Fix RLS policies to use correct clauses
    - Update JWT handling functions
    - Ensure proper policy syntax for INSERT operations

  2. Security
    - Maintain data isolation
    - Fix policy syntax while preserving security rules
    - Keep existing access controls
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

-- Create function to get user ID from Clerk JWT
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS text 
LANGUAGE sql STABLE
AS $$
  SELECT 
    coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (auth.jwt() ->> 'sub')
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