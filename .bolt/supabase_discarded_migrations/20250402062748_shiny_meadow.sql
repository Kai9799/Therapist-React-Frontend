/*
  # Add Organization Invites Table

  1. New Tables
    - `organization_invites`
      - Stores pending invitations to join organizations
      - Includes invite token and expiry date
      - Links to organizations table

  2. Security
    - Enable RLS on organization_invites table
    - Add policies for organization admins to manage invites
*/

-- Create organization invites table
CREATE TABLE IF NOT EXISTS organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  token text NOT NULL UNIQUE,
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- Create policies for organization invites
CREATE POLICY "Organization admins can view invites"
  ON organization_invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_invites.organization_id
      AND om.user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can create invites"
  ON organization_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_invites.organization_id
      AND om.user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Organization admins can delete invites"
  ON organization_invites
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM organization_members om
      WHERE om.organization_id = organization_invites.organization_id
      AND om.user_id IN (
        SELECT id FROM users WHERE auth_id = auth.uid()
      )
      AND om.role = 'admin'
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_org_invites_org_id ON organization_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);

-- Add updated_at trigger
CREATE TRIGGER update_organization_invites_updated_at
  BEFORE UPDATE ON organization_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();