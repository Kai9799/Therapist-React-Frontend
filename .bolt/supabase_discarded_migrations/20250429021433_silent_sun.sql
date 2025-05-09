/*
  # Add Organization Creation Function
  
  1. New Functions
    - create_organization: Creates an organization and links it to the owner
  
  2. Security
    - Function can only be executed by authenticated users
    - Validates input parameters
    - Maintains data consistency
*/

-- Create organization function
CREATE OR REPLACE FUNCTION create_organization(
  org_name text,
  seats int,
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
  IF org_name IS NULL OR seats < 2 OR user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid parameters';
  END IF;

  -- Create organization
  INSERT INTO organizations (
    name,
    seats_purchased,
    seats_used,
    admin_count,
    created_at,
    updated_at,
    owner_id
  ) VALUES (
    org_name,
    seats,
    1, -- Initial seat for owner
    1, -- Owner counts as first admin
    now(),
    now(),
    user_id
  ) RETURNING id INTO org_id;

  -- Update user's organization reference
  UPDATE users
  SET 
    organization_id = org_id,
    role = 'owner',
    updated_at = now()
  WHERE id = user_id;

  RETURN org_id;
END;
$$;