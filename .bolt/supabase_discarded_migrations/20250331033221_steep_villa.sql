/*
  # Initial Schema Setup

  1. New Tables
    - therapists: Stores therapist profiles
    - clients: Stores client information
    - session_plans: Stores therapy session plans
    - resources: Stores therapy resources and materials
    - companies: Stores company/organization information
    - teams: Stores team information within companies
    - team_members: Links therapists to teams
    - team_invites: Manages team invitations
    - note_templates: Stores note templates

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
    - Set up secure defaults

  3. Enums
    - subscription_tier: Basic plan types
    - session_type: Types of therapy sessions
    - resource_type: Types of therapy resources
*/

-- Create enums
CREATE TYPE subscription_tier AS ENUM ('basic', 'premium', 'professional');
CREATE TYPE session_type AS ENUM ('individual', 'group', 'family', 'couples');
CREATE TYPE resource_type AS ENUM ('worksheet', 'handout', 'exercise', 'assessment');

-- Create tables
CREATE TABLE IF NOT EXISTS therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  practice_name text,
  professional_title text,
  license_number text,
  subscription_tier subscription_tier DEFAULT 'basic',
  subscription_status text DEFAULT 'active',
  subscription_start_date timestamptz DEFAULT now(),
  subscription_end_date timestamptz,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  therapy_type text DEFAULT 'Cognitive Behavioral Therapy',
  hobbies text[],
  focus_areas text[],
  short_term_goals text,
  long_term_goals text,
  notes text,
  status text DEFAULT 'active',
  last_session_date timestamptz,
  next_session_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  session_type session_type DEFAULT 'individual',
  topic text NOT NULL,
  overview text,
  structure jsonb,
  techniques jsonb,
  resources jsonb,
  homework text[],
  therapist_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  title text NOT NULL,
  description text,
  type resource_type NOT NULL,
  content jsonb NOT NULL,
  tags text[],
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  website text,
  billing_email text,
  subscription_tier text NOT NULL,
  subscription_status text DEFAULT 'active',
  subscription_seats int DEFAULT 5,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  UNIQUE(team_id, therapist_id)
);

CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  invited_by uuid REFERENCES therapists(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, email)
);

CREATE TABLE IF NOT EXISTS note_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable therapist creation" ON therapists
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Enable therapist view" ON therapists
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Enable therapist update" ON therapists
  FOR UPDATE TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Client policies
CREATE POLICY "Therapists can manage own clients" ON clients
  FOR ALL TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

-- Session plan policies
CREATE POLICY "Therapists can manage own session plans" ON session_plans
  FOR ALL TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

-- Resource policies
CREATE POLICY "Therapists can manage own resources" ON resources
  FOR ALL TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

-- Company policies
CREATE POLICY "Company members can view their company" ON companies
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT t.company_id 
    FROM therapists t 
    WHERE t.auth_id = auth.uid()
  ));

-- Team policies
CREATE POLICY "Team members can view their teams" ON teams
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT tm.team_id
    FROM team_members tm
    JOIN therapists t ON t.id = tm.therapist_id
    WHERE t.auth_id = auth.uid()
  ));

-- Team member policies
CREATE POLICY "Team admins can manage members" ON team_members
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT tm2.team_id
    FROM team_members tm2
    JOIN therapists t ON t.id = tm2.therapist_id
    WHERE t.auth_id = auth.uid()
    AND tm2.role IN ('admin', 'owner')
  ));

-- Team invite policies
CREATE POLICY "Team admins can manage invites" ON team_invites
  FOR ALL TO authenticated
  USING (team_id IN (
    SELECT tm.team_id
    FROM team_members tm
    JOIN therapists t ON t.id = tm.therapist_id
    WHERE t.auth_id = auth.uid()
    AND tm.role IN ('admin', 'owner')
  ));

-- Note template policies
CREATE POLICY "Therapists can manage own templates" ON note_templates
  FOR ALL TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_therapists_auth_id ON therapists(auth_id);
CREATE INDEX IF NOT EXISTS idx_clients_therapist ON clients(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_client ON session_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_therapist ON session_plans(therapist_id);
CREATE INDEX IF NOT EXISTS idx_resources_therapist ON resources(therapist_id);
CREATE INDEX IF NOT EXISTS idx_resources_client ON resources(client_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_therapist ON team_members(therapist_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_note_templates_therapist ON note_templates(therapist_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_therapists_updated_at
  BEFORE UPDATE ON therapists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_session_plans_updated_at
  BEFORE UPDATE ON session_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_note_templates_updated_at
  BEFORE UPDATE ON note_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();