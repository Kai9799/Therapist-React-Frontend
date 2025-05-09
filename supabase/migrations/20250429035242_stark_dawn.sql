/*
  # Client Schema Setup with Policy Checks
  
  1. New Tables
    - clients: Client profiles and information
    - session_plans: Therapy session plans
    - resources: Therapy resources and materials
    
  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users
    - Clerk auth integration
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  email text,
  age text,
  therapy_type text,
  diagnosis text,
  focus_areas text[] DEFAULT '{}'::text[],
  hobbies text[] DEFAULT '{}'::text[],
  short_term_goals text,
  long_term_goals text,
  notes text,
  last_session_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session_plans table
CREATE TABLE IF NOT EXISTS session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  topic text NOT NULL,
  session_date timestamptz NOT NULL,
  overview text,
  structure jsonb[] DEFAULT '{}'::jsonb[],
  techniques jsonb[] DEFAULT '{}'::jsonb[],
  homework text[] DEFAULT '{}'::text[],
  therapist_notes text,
  resources jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  content jsonb NOT NULL,
  formatted_content jsonb,
  content_format text,
  content_version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_user_id ON session_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_client_id ON session_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_client_id ON resources(client_id);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_select_policy'
  ) THEN
    CREATE POLICY "clients_select_policy" ON clients
      FOR SELECT TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_insert_policy'
  ) THEN
    CREATE POLICY "clients_insert_policy" ON clients
      FOR INSERT TO authenticated
      WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_update_policy'
  ) THEN
    CREATE POLICY "clients_update_policy" ON clients
      FOR UPDATE TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub')
      WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_delete_policy'
  ) THEN
    CREATE POLICY "clients_delete_policy" ON clients
      FOR DELETE TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
END $$;

-- Create RLS policies for session_plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_select_policy'
  ) THEN
    CREATE POLICY "session_plans_select_policy" ON session_plans
      FOR SELECT TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_insert_policy'
  ) THEN
    CREATE POLICY "session_plans_insert_policy" ON session_plans
      FOR INSERT TO authenticated
      WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_update_policy'
  ) THEN
    CREATE POLICY "session_plans_update_policy" ON session_plans
      FOR UPDATE TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub')
      WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_delete_policy'
  ) THEN
    CREATE POLICY "session_plans_delete_policy" ON session_plans
      FOR DELETE TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
END $$;

-- Create RLS policies for resources
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_select_policy'
  ) THEN
    CREATE POLICY "resources_select_policy" ON resources
      FOR SELECT TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_insert_policy'
  ) THEN
    CREATE POLICY "resources_insert_policy" ON resources
      FOR INSERT TO authenticated
      WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_update_policy'
  ) THEN
    CREATE POLICY "resources_update_policy" ON resources
      FOR UPDATE TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub')
      WITH CHECK (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_delete_policy'
  ) THEN
    CREATE POLICY "resources_delete_policy" ON resources
      FOR DELETE TO authenticated
      USING (user_id = current_setting('request.jwt.claims')::json->>'sub');
  END IF;
END $$;