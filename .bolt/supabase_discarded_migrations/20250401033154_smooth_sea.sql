/*
  # Multi-tenant User Management System Setup

  1. New Tables
    - organizations: Stores organization/practice data
    - organization_members: Links users to organizations with roles
    - clients: Stores client data with organization scoping
    - session_plans: Stores session plans with organization scoping
    - resources: Stores resources with organization scoping

  2. Security
    - Enable RLS on all tables
    - Add policies for data isolation
    - Set up role-based access control
*/

-- Create organizations table
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('solo', 'practice')),
  subscription_tier text NOT NULL,
  subscription_status text DEFAULT 'active',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organization_members table
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'therapist')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create clients table
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_therapist_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  email text,
  phone text,
  date_of_birth date,
  therapy_type text,
  focus_areas text[],
  status text DEFAULT 'active',
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create session_plans table
CREATE TABLE session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  date timestamptz NOT NULL,
  content jsonb NOT NULL,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create resources table
CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  type text NOT NULL,
  content jsonb NOT NULL,
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Organization Policies
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Organization Members Policies
CREATE POLICY "Users can view members in their organization"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization members"
  ON organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND organization_id = organization_members.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- Client Policies
CREATE POLICY "Therapists can view assigned clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    (assigned_therapist_id = auth.uid()) OR
    (organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );

CREATE POLICY "Therapists can manage assigned clients"
  ON clients
  FOR INSERT UPDATE DELETE
  TO authenticated
  USING (
    (assigned_therapist_id = auth.uid()) OR
    (organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );

-- Session Plans Policies
CREATE POLICY "Users can view relevant session plans"
  ON session_plans
  FOR SELECT
  TO authenticated
  USING (
    (author_id = auth.uid()) OR
    (client_id IN (
      SELECT id 
      FROM clients 
      WHERE assigned_therapist_id = auth.uid()
    )) OR
    (organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );

CREATE POLICY "Users can manage their session plans"
  ON session_plans
  FOR INSERT UPDATE DELETE
  TO authenticated
  USING (
    (author_id = auth.uid()) OR
    (organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );

-- Resources Policies
CREATE POLICY "Users can view organization resources"
  ON resources
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their resources"
  ON resources
  FOR INSERT UPDATE DELETE
  TO authenticated
  USING (
    (author_id = auth.uid()) OR
    (organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    ))
  );

-- Create indexes for performance
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_therapist ON clients(assigned_therapist_id);
CREATE INDEX idx_session_plans_org ON session_plans(organization_id);
CREATE INDEX idx_session_plans_client ON session_plans(client_id);
CREATE INDEX idx_session_plans_author ON session_plans(author_id);
CREATE INDEX idx_resources_org ON resources(organization_id);
CREATE INDEX idx_resources_author ON resources(author_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_org_members_updated_at
  BEFORE UPDATE ON organization_members
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