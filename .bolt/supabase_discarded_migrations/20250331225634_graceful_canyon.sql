/*
  # Enable Clerk JWT Auth in Supabase

  1. Changes
    - Drop and recreate auth functions for Clerk JWT compatibility
    - Set up auth.uid() to return text for Clerk user IDs
    - Add auth.email() function for Clerk email claims
    - Create helper function for auth user ID retrieval

  2. Security
    - Maintain secure authentication flow
    - Enable proper authorization checks
    - Preserve data isolation
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS auth.uid() CASCADE;
DROP FUNCTION IF EXISTS auth.email() CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_user_id() CASCADE;

-- Create function to get auth user id from Clerk JWT
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS text AS $$
BEGIN
  RETURN nullif(current_setting('request.jwt.claim.sub', true), '')::text;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get auth user email from Clerk JWT
CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text AS $$
BEGIN
  RETURN nullif(current_setting('request.jwt.claim.email', true), '')::text;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create helper function to get auth user ID
CREATE OR REPLACE FUNCTION public.get_auth_user_id() 
RETURNS text AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;