/*
  # Fix Organization Seat Tracking
  
  1. Changes
    - Update handle_member_role_change function to properly track seats
    - Update handle_member_removal function to properly decrement seats
    - Add function to recalculate seats for existing organizations
    
  2. Purpose
    - Ensure admins are only counted in admin_count
    - Fix double-counting of seats
    - Maintain accurate seat tracking
*/

-- Update handle_member_role_change function
CREATE OR REPLACE FUNCTION handle_member_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If role changed to/from admin
  IF OLD.role != NEW.role AND (OLD.role = 'admin' OR NEW.role = 'admin') THEN
    IF NEW.role = 'admin' THEN
      -- Converting to admin: decrement seats_used, increment admin_count
      UPDATE organizations
      SET 
        seats_used = GREATEST(seats_used - 1, 0),
        admin_count = admin_count + 1
      WHERE id = NEW.organization_id;
    ELSE
      -- Converting from admin: increment seats_used, decrement admin_count
      -- Only increment seats_used if there are available seats
      IF (
        SELECT seats_used < seats_purchased 
        FROM organizations 
        WHERE id = NEW.organization_id
      ) THEN
        UPDATE organizations
        SET 
          seats_used = seats_used + 1,
          admin_count = GREATEST(admin_count - 1, 1)
        WHERE id = NEW.organization_id;
      ELSE
        RAISE EXCEPTION 'No available seats for converting admin to member';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Update handle_member_removal function
CREATE OR REPLACE FUNCTION handle_member_removal()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'admin' THEN
    -- Removing admin: decrement admin_count
    UPDATE organizations
    SET admin_count = GREATEST(admin_count - 1, 1)
    WHERE id = OLD.organization_id;
  ELSE
    -- Removing regular member: decrement seats_used
    UPDATE organizations
    SET seats_used = GREATEST(seats_used - 1, 0)
    WHERE id = OLD.organization_id;
  END IF;
  
  RETURN OLD;
END;
$$ language 'plpgsql';

-- Function to recalculate seats for existing organizations
CREATE OR REPLACE FUNCTION recalculate_organization_seats()
RETURNS void AS $$
DECLARE
  org_record RECORD;
BEGIN
  -- Loop through each organization
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Update admin count
    UPDATE organizations
    SET admin_count = (
      SELECT COUNT(*)
      FROM organization_members
      WHERE organization_id = org_record.id
      AND role = 'admin'
    )
    WHERE id = org_record.id;
    
    -- Update seats used (non-admin members)
    UPDATE organizations
    SET seats_used = (
      SELECT COUNT(*)
      FROM organization_members
      WHERE organization_id = org_record.id
      AND role != 'admin'
    )
    WHERE id = org_record.id;
  END LOOP;
END;
$$ language 'plpgsql';

-- Recalculate seats for all existing organizations
SELECT recalculate_organization_seats();

-- Drop the recalculation function as it's no longer needed
DROP FUNCTION recalculate_organization_seats();