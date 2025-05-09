/*
  # Add Company and Team Management Tables

  1. New Tables
    - companies: Stores company/organization information
    - teams: Stores team information within companies
    - team_members: Links therapists to teams
    - team_invites: Manages team invitations

  2. Changes
    - Add company_id to therapists table
    - Update RLS policies
    - Add triggers for team management
*/

-- Create companies table first
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

-- Then add company_id to therapists
ALTER TABLE therapists 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;

-- Create teams table
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

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  therapist_id uuid NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  UNIQUE(team_id, therapist_id)
);

-- Create team_invites table
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

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company members can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT t.company_id 
    FROM therapists t 
    WHERE t.auth_id = auth.uid()
  ));

CREATE POLICY "Team members can view their teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT tm.team_id
    FROM team_members tm
    JOIN therapists t ON t.id = tm.therapist_id
    WHERE t.auth_id = auth.uid()
  ));

CREATE POLICY "Team admins can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (team_id IN (
    SELECT tm2.team_id
    FROM team_members tm2
    JOIN therapists t ON t.id = tm2.therapist_id
    WHERE t.auth_id = auth.uid()
    AND tm2.role IN ('admin', 'owner')
  ));

CREATE POLICY "Team admins can manage invites"
  ON team_invites
  FOR ALL
  TO authenticated
  USING (team_id IN (
    SELECT tm.team_id
    FROM team_members tm
    JOIN therapists t ON t.id = tm.therapist_id
    WHERE t.auth_id = auth.uid()
    AND tm.role IN ('admin', 'owner')
  ));

-- Create triggers
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_therapists_company ON therapists(company_id);
CREATE INDEX IF NOT EXISTS idx_teams_company ON teams(company_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_therapist ON team_members(therapist_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_team ON team_invites(team_id);