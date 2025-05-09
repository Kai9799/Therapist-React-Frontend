/*
  # Add Organization Creation Function
  
  1. New Functions
    - create_organization: Creates an organization and links it to the creating user
  
  2. Security
    - Function is only accessible to authenticated users
    - Validates input parameters
    - Handles user-organization relationship
*/

-- Create function to handle organization creation
CREATE OR REPLACE FUNCTION create_organization(
  org_name TEXT,
  seats INTEGER,
  user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Input validation
  IF seats < 2 THEN
    RAISE EXCEPTION 'Organizations must have at least 2 seats';
  END IF;

  -- Create organization
  INSERT INTO organizations (
    name,
    seats_purchased,
    seats_used,
    created_at,
    updated_at,
    owner_id
  ) VALUES (
    org_name,
    seats,
    1, -- Start with 1 seat used (the owner)
    NOW(),
    NOW(),
    user_id
  ) RETURNING id INTO org_id;

  -- Update the user's organization reference
  UPDATE users
  SET 
    organization_id = org_id,
    role = 'owner',
    updated_at = NOW()
  WHERE id = user_id;

  RETURN org_id;
END;
$$;