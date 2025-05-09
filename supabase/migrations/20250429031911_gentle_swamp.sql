/*
  # Update RLS Policies for Clerk Authentication
  
  1. Changes
    - Drop existing RLS policies
    - Create new policies using Clerk user IDs
    - Update user_id columns to use text type
    - Add proper type casting for UUID comparisons
  
  2. Security
    - Maintain data isolation between users
    - Use Clerk JWT claims for authentication
*/

-- First create temporary columns
ALTER TABLE clients ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE session_plans ADD COLUMN IF NOT EXISTS clerk_user_id text;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS clerk_user_id text;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

DROP POLICY IF EXISTS "Users can view their own sessions" ON session_plans;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON session_plans;
DROP POLICY IF EXISTS "Users can update their own sessions" ON session_plans;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON session_plans;

DROP POLICY IF EXISTS "Users can view their own resources" ON resources;
DROP POLICY IF EXISTS "Users can insert their own resources" ON resources;
DROP POLICY IF EXISTS "Users can update their own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete their own resources" ON resources;

-- Create new policies using Clerk user IDs
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub')
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "session_plans_select_policy" ON session_plans
  FOR SELECT TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "session_plans_insert_policy" ON session_plans
  FOR INSERT TO authenticated
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "session_plans_update_policy" ON session_plans
  FOR UPDATE TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub')
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "session_plans_delete_policy" ON session_plans
  FOR DELETE TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "resources_select_policy" ON resources
  FOR SELECT TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "resources_insert_policy" ON resources
  FOR INSERT TO authenticated
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "resources_update_policy" ON resources
  FOR UPDATE TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub')
  WITH CHECK (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

CREATE POLICY "resources_delete_policy" ON resources
  FOR DELETE TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims')::json->>'sub');

-- Copy data to new columns (if any exists)
UPDATE clients SET clerk_user_id = user_id::text WHERE user_id IS NOT NULL;
UPDATE session_plans SET clerk_user_id = user_id::text WHERE user_id IS NOT NULL;
UPDATE resources SET clerk_user_id = user_id::text WHERE user_id IS NOT NULL;

-- Drop old columns
ALTER TABLE clients DROP COLUMN user_id;
ALTER TABLE session_plans DROP COLUMN user_id;
ALTER TABLE resources DROP COLUMN user_id;

-- Rename new columns
ALTER TABLE clients RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE session_plans RENAME COLUMN clerk_user_id TO user_id;
ALTER TABLE resources RENAME COLUMN clerk_user_id TO user_id;

-- Add NOT NULL constraints
ALTER TABLE clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE session_plans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE resources ALTER COLUMN user_id SET NOT NULL;