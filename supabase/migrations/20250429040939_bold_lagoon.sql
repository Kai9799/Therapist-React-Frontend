/*
  # Initial Public Schema Setup
  
  1. Changes
    - Create schema in public namespace
    - Set up tables with proper RLS
    - Add policies for data access control
    
  2. Security
    - Enable RLS on all tables
    - Policies use Clerk auth
*/

-- Create schema objects in public namespace
CREATE SCHEMA IF NOT EXISTS public;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, authenticated;

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
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
CREATE TABLE IF NOT EXISTS public.session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_user_id ON public.session_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_client_id ON public.session_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_client_id ON public.resources(client_id);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_select_policy'
  ) THEN
    CREATE POLICY "clients_select_policy" ON public.clients
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_insert_policy'
  ) THEN
    CREATE POLICY "clients_insert_policy" ON public.clients
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_update_policy'
  ) THEN
    CREATE POLICY "clients_update_policy" ON public.clients
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' AND policyname = 'clients_delete_policy'
  ) THEN
    CREATE POLICY "clients_delete_policy" ON public.clients
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create RLS policies for session_plans
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_select_policy'
  ) THEN
    CREATE POLICY "session_plans_select_policy" ON public.session_plans
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_insert_policy'
  ) THEN
    CREATE POLICY "session_plans_insert_policy" ON public.session_plans
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_update_policy'
  ) THEN
    CREATE POLICY "session_plans_update_policy" ON public.session_plans
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'session_plans' AND policyname = 'session_plans_delete_policy'
  ) THEN
    CREATE POLICY "session_plans_delete_policy" ON public.session_plans
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Create RLS policies for resources
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_select_policy'
  ) THEN
    CREATE POLICY "resources_select_policy" ON public.resources
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_insert_policy'
  ) THEN
    CREATE POLICY "resources_insert_policy" ON public.resources
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_update_policy'
  ) THEN
    CREATE POLICY "resources_update_policy" ON public.resources
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'resources' AND policyname = 'resources_delete_policy'
  ) THEN
    CREATE POLICY "resources_delete_policy" ON public.resources
      FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;