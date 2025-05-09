/*
  # Company Data Privacy Schema Update

  1. Changes
    - Add role field to therapists table
    - Add company_stats table for aggregated reporting
    - Update RLS policies to ensure data privacy

  2. Security
    - Each therapist can only see their own clients/data
    - Company admins can see aggregated stats but not individual data
    - Enable RLS on all tables
*/

-- Add role field to therapists
ALTER TABLE therapists
ADD COLUMN IF NOT EXISTS role text DEFAULT 'solo'::text
CHECK (role IN ('solo', 'company_admin', 'company_user'));

-- Create company_stats table for aggregated reporting
CREATE TABLE IF NOT EXISTS company_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  total_clients integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  total_resources integer DEFAULT 0,
  stats_by_therapist jsonb DEFAULT '{}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

-- Enable RLS
ALTER TABLE company_stats ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policies

-- Therapists can only see their own data
CREATE POLICY "Therapists can only view own data"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (
    auth_id = auth.uid() OR
    (company_id IN (
      SELECT t.company_id 
      FROM therapists t 
      WHERE t.auth_id = auth.uid() 
      AND t.role = 'company_admin'
    ) AND role != 'company_admin')
  );

-- Company admins can view aggregated stats
CREATE POLICY "Company admins can view stats"
  ON company_stats
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT t.company_id
      FROM therapists t
      WHERE t.auth_id = auth.uid()
      AND t.role = 'company_admin'
    )
  );

-- Function to update company stats
CREATE OR REPLACE FUNCTION update_company_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update company stats when clients/sessions/resources change
  WITH stats AS (
    SELECT
      t.company_id,
      COUNT(DISTINCT c.id) as total_clients,
      COUNT(DISTINCT s.id) as total_sessions,
      COUNT(DISTINCT r.id) as total_resources,
      jsonb_object_agg(
        t.id,
        jsonb_build_object(
          'clients', COUNT(DISTINCT c.id),
          'sessions', COUNT(DISTINCT s.id),
          'resources', COUNT(DISTINCT r.id)
        )
      ) as stats_by_therapist
    FROM therapists t
    LEFT JOIN clients c ON c.therapist_id = t.id
    LEFT JOIN session_plans s ON s.therapist_id = t.id
    LEFT JOIN resources r ON r.therapist_id = t.id
    WHERE t.company_id IS NOT NULL
    GROUP BY t.company_id
  )
  INSERT INTO company_stats (
    company_id,
    total_clients,
    total_sessions,
    total_resources,
    stats_by_therapist,
    last_updated
  )
  SELECT
    company_id,
    total_clients,
    total_sessions,
    total_resources,
    stats_by_therapist,
    now()
  FROM stats
  ON CONFLICT (company_id) DO UPDATE
  SET
    total_clients = EXCLUDED.total_clients,
    total_sessions = EXCLUDED.total_sessions,
    total_resources = EXCLUDED.total_resources,
    stats_by_therapist = EXCLUDED.stats_by_therapist,
    last_updated = now();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update company stats
CREATE TRIGGER update_company_stats_on_client_change
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_company_stats();

CREATE TRIGGER update_company_stats_on_session_change
  AFTER INSERT OR UPDATE OR DELETE ON session_plans
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_company_stats();

CREATE TRIGGER update_company_stats_on_resource_change
  AFTER INSERT OR UPDATE OR DELETE ON resources
  FOR EACH STATEMENT
  EXECUTE FUNCTION update_company_stats();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapists_role ON therapists(role);
CREATE INDEX IF NOT EXISTS idx_company_stats_company ON company_stats(company_id);

-- Update existing company-related policies
DROP POLICY IF EXISTS "Company members can view their company" ON companies;
CREATE POLICY "Company members can view their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT t.company_id 
      FROM therapists t 
      WHERE t.auth_id = auth.uid()
    )
  );

-- Ensure client data privacy
DROP POLICY IF EXISTS "Therapists can manage own clients" ON clients;
CREATE POLICY "Therapists can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists 
      WHERE auth_id = auth.uid()
    )
  );

-- Ensure session data privacy
DROP POLICY IF EXISTS "Therapists can manage own session plans" ON session_plans;
CREATE POLICY "Therapists can manage own session plans"
  ON session_plans
  FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists 
      WHERE auth_id = auth.uid()
    )
  );

-- Ensure resource data privacy
DROP POLICY IF EXISTS "Therapists can manage own resources" ON resources;
CREATE POLICY "Therapists can manage own resources"
  ON resources
  FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists 
      WHERE auth_id = auth.uid()
    )
  );