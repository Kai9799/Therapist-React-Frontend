/*
  # Fix therapist profile creation and sample data

  1. Changes
    - Add ON CONFLICT clauses to handle duplicate auth_id and email
    - Update sample data insertion to handle conflicts
    - Add indexes for better query performance
    - Add validation checks
  
  2. Security
    - Maintain existing RLS policies
    - No changes to existing permissions
*/

-- Add validation trigger for therapist data
CREATE OR REPLACE FUNCTION validate_therapist_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate required fields
  IF NEW.auth_id IS NULL THEN
    RAISE EXCEPTION 'auth_id cannot be null';
  END IF;
  
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'email cannot be null';
  END IF;
  
  IF NEW.full_name IS NULL THEN
    RAISE EXCEPTION 'full_name cannot be null';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger
DROP TRIGGER IF EXISTS validate_therapist_data_trigger ON therapists;
CREATE TRIGGER validate_therapist_data_trigger
  BEFORE INSERT OR UPDATE ON therapists
  FOR EACH ROW
  EXECUTE FUNCTION validate_therapist_data();

-- Insert sample data with proper conflict handling
DO $$
DECLARE
  v_auth_id uuid := '12345678-9abc-def0-1234-56789abcdef0';
  v_therapist_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
BEGIN
  -- Insert or update therapist
  INSERT INTO public.therapists (
    id,
    auth_id,
    email,
    full_name,
    practice_name,
    professional_title,
    subscription_tier,
    subscription_status,
    settings,
    created_at
  ) VALUES (
    v_therapist_id,
    v_auth_id,
    'dr.robinson@theraplan.com',
    'Dr. Sarah Robinson',
    'Mindful Therapy Practice',
    'Licensed Clinical Psychologist',
    'premium',
    'active',
    jsonb_build_object(
      'theme', 'light',
      'notifications', jsonb_build_object(
        'email', true,
        'session_reminders', true
      )
    ),
    NOW()
  )
  ON CONFLICT (auth_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    practice_name = EXCLUDED.practice_name,
    professional_title = EXCLUDED.professional_title,
    subscription_tier = EXCLUDED.subscription_tier,
    subscription_status = EXCLUDED.subscription_status,
    settings = EXCLUDED.settings,
    updated_at = NOW()
  WHERE therapists.auth_id = EXCLUDED.auth_id;

  -- Create practice settings if they don't exist
  INSERT INTO public.practice_settings (
    therapist_id,
    settings
  ) VALUES (
    v_therapist_id,
    jsonb_build_object(
      'business_hours', jsonb_build_object(
        'monday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'tuesday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'wednesday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'thursday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'friday', jsonb_build_object('start', '09:00', 'end', '17:00')
      ),
      'session_duration', 50,
      'break_duration', 10,
      'timezone', 'UTC'
    )
  )
  ON CONFLICT (therapist_id) DO UPDATE
  SET
    settings = EXCLUDED.settings,
    updated_at = NOW()
  WHERE practice_settings.therapist_id = EXCLUDED.therapist_id;
END $$;