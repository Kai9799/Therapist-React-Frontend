/*
  # Base Schema for Therapy Planning App
  
  1. Tables
    - users - User profiles and organization management
    - clients - Client information
    - session_plans - Session planning and notes
    - resources - Therapy resources and materials
    
  2. Security
    - Enable RLS on all tables
    - Add policies for data access
    - Simple UUID linking without complex foreign keys
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS session_plans;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  user_type text NOT NULL DEFAULT 'solo',
  seats_purchased integer NOT NULL DEFAULT 1,
  seats_used integer NOT NULL DEFAULT 1,
  org_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  client_name text NOT NULL,
  alias text,
  therapy_type text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session_plans table
CREATE TABLE session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  client_id uuid NOT NULL,
  session_date date NOT NULL,
  topic text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Create resources table
CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  resource_type text NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_clients_created_by ON clients(created_by);
CREATE INDEX idx_session_plans_client_id ON session_plans(client_id);
CREATE INDEX idx_session_plans_created_by ON session_plans(created_by);
CREATE INDEX idx_resources_created_by ON resources(created_by);

-- Add constraints
ALTER TABLE users 
  ADD CONSTRAINT valid_user_type CHECK (user_type IN ('solo', 'organization')),
  ADD CONSTRAINT valid_seats CHECK (seats_purchased >= 1 AND seats_used >= 1);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view their own profile
    auth.uid() = id
    OR 
    -- Organization members can view their org owner's profile
    org_id = (SELECT id FROM users WHERE auth.uid() = id)
    OR
    -- Organization owners can view their team members' profiles
    (SELECT id FROM users WHERE auth.uid() = id) = org_id
  );

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for clients table
CREATE POLICY "Users can view own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create RLS policies for session_plans table
CREATE POLICY "Users can view own sessions"
  ON session_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own sessions"
  ON session_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own sessions"
  ON session_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own sessions"
  ON session_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create RLS policies for resources table
CREATE POLICY "Users can view own resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Add helpful comments
COMMENT ON TABLE users IS 'User profiles and organization management';
COMMENT ON COLUMN users.user_type IS 'Type of user account: solo (individual user) or organization (team owner)';
COMMENT ON COLUMN users.org_id IS 'For team members: references organization owner''s user_id. NULL for solo users. Own user_id for org owners.';

COMMENT ON TABLE clients IS 'Therapist client profiles';
COMMENT ON TABLE session_plans IS 'Therapy session plans and notes';
COMMENT ON TABLE resources IS 'Therapy resources and materials';