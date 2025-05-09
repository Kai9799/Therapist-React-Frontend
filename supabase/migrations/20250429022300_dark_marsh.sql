/*
  # Initial Auth Schema Setup
  
  1. New Tables
    - users: Core user profiles and subscription management
    - organizations: Team and subscription management
  
  2. Security
    - RLS enabled on all tables
    - Policies for data access control
    
  3. Functions
    - create_organization: Creates new organizations
    - join_organization: Handles member joining
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'member'::text,
  owner_id uuid REFERENCES users(id),
  stripe_customer_id text,
  subscription_tier text DEFAULT 'basic'::text,
  subscription_status text DEFAULT 'active'::text,
  seats_purchased integer DEFAULT 1,
  trial_start timestamptz,
  trial_end timestamptz,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES users(id),
  seats_purchased integer NOT NULL DEFAULT 2,
  seats_used integer DEFAULT 0,
  admin_count integer DEFAULT 0,
  join_code text UNIQUE DEFAULT encode(gen_random_bytes(9), 'base64'),
  stripe_customer_id text,
  subscription_tier text DEFAULT 'team'::text,
  subscription_status text DEFAULT 'active'::text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + interval '14 days'),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_owner_id ON users(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations(owner_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "users_select_self" ON users
  FOR SELECT TO authenticated
  USING (
    auth_id = auth.uid() OR  -- User can access their own profile
    owner_id = (             -- Team members can access their organization owner
      SELECT id 
      FROM users 
      WHERE auth_id = auth.uid()
    ) OR
    id = (                   -- Organization owners can access their members
      SELECT owner_id 
      FROM users 
      WHERE auth_id = auth.uid() AND owner_id IS NOT NULL
    )
  );

CREATE POLICY "users_insert_self" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "users_update_self" ON users
  FOR UPDATE TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Create RLS policies for organizations
CREATE POLICY "organizations_select_members" ON organizations
  FOR SELECT TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
      UNION
      SELECT owner_id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "organizations_insert_owner" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "organizations_update_owner" ON organizations
  FOR UPDATE TO authenticated
  USING (owner_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (owner_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Create function to create organization
CREATE OR REPLACE FUNCTION create_organization(
  org_name text,
  seats integer,
  user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Validate inputs
  IF seats < 2 THEN
    RAISE EXCEPTION 'Organizations must have at least 2 seats';
  END IF;

  -- Create organization
  INSERT INTO organizations (name, owner_id, seats_purchased)
  VALUES (org_name, user_id, seats)
  RETURNING id INTO org_id;

  -- Update user's role to owner
  UPDATE users
  SET role = 'owner',
      subscription_tier = 'team',
      seats_purchased = seats
  WHERE id = user_id;

  RETURN org_id;
END;
$$;

-- Create function to join organization
CREATE OR REPLACE FUNCTION join_organization(
  join_code text,
  user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_record record;
BEGIN
  -- Get organization by join code
  SELECT * INTO org_record
  FROM organizations
  WHERE organizations.join_code = join_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  -- Check if seats are available
  IF org_record.seats_used >= org_record.seats_purchased THEN
    RAISE EXCEPTION 'No seats available in this organization';
  END IF;

  -- Update user's organization reference
  UPDATE users
  SET owner_id = org_record.owner_id,
      role = 'member',
      subscription_tier = 'team'
  WHERE id = user_id;

  -- Increment seats used
  UPDATE organizations
  SET seats_used = seats_used + 1
  WHERE id = org_record.id;

  RETURN org_record.id;
END;
$$;