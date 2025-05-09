/*
  # Create Organizations Table and Functions
  
  1. New Tables
    - organizations
      - id (uuid, primary key)
      - name (text)
      - seats_purchased (integer)
      - seats_used (integer)
      - created_at (timestamp)
      - updated_at (timestamp)
      - settings (jsonb)
      - join_code (text)
  
  2. Functions
    - create_organization: Creates org and updates creator as owner
  
  3. Security
    - Enable RLS
    - Add policies for org access
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  seats_purchased integer NOT NULL DEFAULT 1,
  seats_used integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  join_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex')
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create function to handle organization creation
CREATE OR REPLACE FUNCTION create_organization(
  org_name text,
  seats integer,
  user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Insert new organization
  INSERT INTO organizations (name, seats_purchased)
  VALUES (org_name, seats)
  RETURNING id INTO new_org_id;
  
  -- Update the creating user to be the owner
  UPDATE users
  SET 
    owner_id = null,
    organization_id = new_org_id,
    role = 'owner'
  WHERE id = user_id;
  
  RETURN new_org_id;
END;
$$;