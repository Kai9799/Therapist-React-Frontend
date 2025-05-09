/*
  # Initial Schema Setup for TheraPlan
  
  1. New Tables
    - clients: Client profiles and therapy information
    - session_plans: Therapy session plans and notes
    - resources: Therapy resources and materials
    
  2. Security
    - RLS enabled on all tables
    - Policies for secure data access
    - Integration with Clerk auth
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  topic text NOT NULL,
  session_date timestamptz NOT NULL,
  overview text,
  structure jsonb[] DEFAULT '{}'::jsonb[],
  techniques jsonb[] DEFAULT '{}'::jsonb[],
  homework text[] DEFAULT '{}'::text[],
  therapist_notes text,
  resources jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
    UNION
    SELECT users.id
    FROM users
    WHERE users.owner_id = (
      SELECT users_1.id
      FROM users users_1
      WHERE users_1.auth_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert their own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

-- Create RLS policies for session_plans
CREATE POLICY "Users can view their own sessions"
  ON session_plans FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
    UNION
    SELECT users.id
    FROM users
    WHERE users.owner_id = (
      SELECT users_1.id
      FROM users users_1
      WHERE users_1.auth_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert their own sessions"
  ON session_plans FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update their own sessions"
  ON session_plans FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own sessions"
  ON session_plans FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

-- Create RLS policies for resources
CREATE POLICY "Users can view their own resources"
  ON resources FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
    UNION
    SELECT users.id
    FROM users
    WHERE users.owner_id = (
      SELECT users_1.id
      FROM users users_1
      WHERE users_1.auth_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert their own resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can update their own resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ))
  WITH CHECK (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own resources"
  ON resources FOR DELETE
  TO authenticated
  USING (user_id IN (
    SELECT users.id
    FROM users
    WHERE users.auth_id = auth.uid()
  ));