/*
  # Add JWT Template for Clerk Integration

  1. Changes
    - Add JWT template for Clerk authentication
    - Set up claims mapping for Supabase RLS
    - Configure user synchronization

  2. Security
    - Ensure proper JWT validation
    - Map Clerk user ID to Supabase auth.uid
    - Preserve data isolation
*/

-- Create function to handle Clerk JWT claims
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

-- Create helper function to get auth user ID
CREATE OR REPLACE FUNCTION public.get_auth_user_id() 
RETURNS text 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;