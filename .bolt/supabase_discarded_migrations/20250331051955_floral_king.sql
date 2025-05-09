/*
  # Add Company Invites System

  1. New Tables
    - company_invites: Stores pending invitations to join companies
      - id (uuid, primary key)
      - company_id (uuid, references companies)
      - email (text)
      - role (text, default 'company_user')
      - invited_by (uuid, references therapists)
      - token (text, unique)
      - status (text)
      - created_at (timestamptz)
      - expires_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for company admins
    - Set up secure defaults
*/

-- Create company_invites table
CREATE TABLE IF NOT EXISTS company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'company_user',
  invited_by uuid REFERENCES therapists(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  CONSTRAINT valid_role CHECK (role IN ('company_user', 'company_admin')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Enable RLS
ALTER TABLE company_invites ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company admins can manage invites"
  ON company_invites
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT t.company_id
      FROM therapists t
      WHERE t.auth_id = auth.uid()
      AND t.role = 'company_admin'
    )
  );

CREATE POLICY "Users can view their own invites"
  ON company_invites
  FOR SELECT
  TO authenticated
  USING (
    email IN (
      SELECT t.email
      FROM therapists t
      WHERE t.auth_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_company_invites_company ON company_invites(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invites_email ON company_invites(email);
CREATE INDEX IF NOT EXISTS idx_company_invites_status ON company_invites(status);
CREATE INDEX IF NOT EXISTS idx_company_invites_token ON company_invites(token);