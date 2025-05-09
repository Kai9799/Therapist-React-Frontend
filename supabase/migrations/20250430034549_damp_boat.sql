/*
  # Update Schema for Clerk Authentication
  
  1. Changes
    - Drop existing policies before altering columns
    - Update column types to text for Clerk user IDs
    - Create new policies using Clerk JWT claims
    
  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated users
    - Use Clerk JWT claims for authentication
*/

-- Drop existing policies first
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

DROP POLICY IF EXISTS "session_plans_select_policy" ON session_plans;
DROP POLICY IF EXISTS "session_plans_insert_policy" ON session_plans;
DROP POLICY IF EXISTS "session_plans_update_policy" ON session_plans;
DROP POLICY IF EXISTS "session_plans_delete_policy" ON session_plans;

DROP POLICY IF EXISTS "resources_select_policy" ON resources;
DROP POLICY IF EXISTS "resources_insert_policy" ON resources;
DROP POLICY IF EXISTS "resources_update_policy" ON resources;
DROP POLICY IF EXISTS "resources_delete_policy" ON resources;

-- Now we can safely alter the column types
ALTER TABLE clients ALTER COLUMN user_id TYPE text;
ALTER TABLE session_plans ALTER COLUMN user_id TYPE text;
ALTER TABLE resources ALTER COLUMN user_id TYPE text;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create new policies using Clerk JWT claims
CREATE POLICY "clients_select_policy" ON clients
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "clients_insert_policy" ON clients
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "clients_update_policy" ON clients
  FOR UPDATE TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'))
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "clients_delete_policy" ON clients
  FOR DELETE TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Session plans policies
CREATE POLICY "session_plans_select_policy" ON session_plans
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "session_plans_insert_policy" ON session_plans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "session_plans_update_policy" ON session_plans
  FOR UPDATE TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'))
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "session_plans_delete_policy" ON session_plans
  FOR DELETE TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Resources policies
CREATE POLICY "resources_select_policy" ON resources
  FOR SELECT TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "resources_insert_policy" ON resources
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "resources_update_policy" ON resources
  FOR UPDATE TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'))
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "resources_delete_policy" ON resources
  FOR DELETE TO authenticated
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_user_id ON session_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);

-- Ensure foreign key constraints with cascade deletes
ALTER TABLE session_plans
  DROP CONSTRAINT IF EXISTS session_plans_client_id_fkey,
  ADD CONSTRAINT session_plans_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE CASCADE;

ALTER TABLE resources
  DROP CONSTRAINT IF EXISTS resources_client_id_fkey,
  ADD CONSTRAINT resources_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES clients(id)
  ON DELETE CASCADE;