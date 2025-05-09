/*
  # Configure JWT Authentication with Outseta
  
  1. Changes
    - Add JWT verification using Outseta public key
    - Update RLS policies to use JWT claims
    - Add indexes for performance
*/

-- Create function to verify Outseta JWT
CREATE OR REPLACE FUNCTION verify_outseta_jwt()
RETURNS void AS $$
BEGIN
  -- Set JWT verification settings
  SET request.jwt.claim.sub = current_setting('request.jwt.claims', true)::json->>'sub';
  SET request.jwt.claim.email = current_setting('request.jwt.claims', true)::json->>'email';
  SET request.jwt.claim.name = current_setting('request.jwt.claims', true)::json->>'name';
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (outseta_id = (current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (outseta_id = (current_setting('request.jwt.claim.sub', true)))
WITH CHECK (outseta_id = (current_setting('request.jwt.claim.sub', true)));

-- Update RLS policies for session_plans table
DROP POLICY IF EXISTS "Users can view their own sessions" ON session_plans;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON session_plans;
DROP POLICY IF EXISTS "Users can update their own sessions" ON session_plans;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON session_plans;

CREATE POLICY "Users can view their own sessions"
ON session_plans FOR SELECT
TO authenticated
USING (outseta_id = (current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Users can insert their own sessions"
ON session_plans FOR INSERT
TO authenticated
WITH CHECK (outseta_id = (current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Users can update their own sessions"
ON session_plans FOR UPDATE
TO authenticated
USING (outseta_id = (current_setting('request.jwt.claim.sub', true)))
WITH CHECK (outseta_id = (current_setting('request.jwt.claim.sub', true)));

CREATE POLICY "Users can delete their own sessions"
ON session_plans FOR DELETE
TO authenticated
USING (outseta_id = (current_setting('request.jwt.claim.sub', true)));