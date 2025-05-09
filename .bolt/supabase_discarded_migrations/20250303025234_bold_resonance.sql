/*
  # Project Checkpoint Migration

  1. Schema Overview
    - Ensures all core tables exist with proper structure
    - Validates and enforces relationships between tables
    - Sets up proper indexes and constraints
    - Configures RLS policies for security

  2. Tables
    - therapists: Core user profiles for therapists
    - clients: Client records managed by therapists
    - session_notes: Therapy session documentation
    - session_plans: Future session planning
    - resources: Therapy resources and materials
    - practice_settings: Therapist practice configuration

  3. Security
    - Row Level Security (RLS) enabled on all tables
    - Policies ensure therapists can only access their own data
    - Proper authentication checks in place
*/

-- Ensure custom types exist
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('basic', 'premium', 'professional');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE session_type AS ENUM ('individual', 'group', 'family', 'couples');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('worksheet', 'handout', 'exercise', 'assessment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create or update tables
CREATE TABLE IF NOT EXISTS therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  practice_name text,
  professional_title text,
  license_number text,
  subscription_tier subscription_tier DEFAULT 'basic',
  subscription_status text DEFAULT 'active',
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  therapy_type text,
  hobbies text[],
  focus_areas text[],
  short_term_goals text,
  long_term_goals text,
  notes text,
  status text DEFAULT 'active',
  last_session_date timestamptz,
  next_session_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  session_type session_type DEFAULT 'individual',
  template_type text,
  overview text,
  key_topics text[],
  emotional_state text,
  interventions text[],
  progress_notes text,
  plan text,
  homework text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  session_type session_type DEFAULT 'individual',
  topic text NOT NULL,
  overview text,
  structure jsonb,
  techniques jsonb,
  resources jsonb,
  homework text[],
  therapist_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  title text NOT NULL,
  description text,
  type resource_type NOT NULL,
  content jsonb NOT NULL,
  tags text[],
  is_template boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practice_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_therapist_settings UNIQUE (therapist_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_therapists_auth_id ON therapists(auth_id);
CREATE INDEX IF NOT EXISTS idx_therapists_email ON therapists(email);
CREATE INDEX IF NOT EXISTS idx_clients_therapist_id ON clients(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_client_id ON session_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_therapist_id ON session_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_client_id ON session_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_session_plans_therapist_id ON session_plans(therapist_id);
CREATE INDEX IF NOT EXISTS idx_resources_therapist_id ON resources(therapist_id);
CREATE INDEX IF NOT EXISTS idx_resources_client_id ON resources(client_id);

-- Enable Row Level Security
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Therapists can view own profile"
  ON therapists FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Therapists can update own profile"
  ON therapists FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id);

CREATE POLICY "Therapists can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can manage own clients"
  ON clients FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can view own session notes"
  ON session_notes FOR SELECT
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can manage own session notes"
  ON session_notes FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can view own session plans"
  ON session_plans FOR SELECT
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can manage own session plans"
  ON session_plans FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can view own resources"
  ON resources FOR SELECT
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can manage own resources"
  ON resources FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can view own practice settings"
  ON practice_settings FOR SELECT
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Therapists can manage own practice settings"
  ON practice_settings FOR ALL
  TO authenticated
  USING (
    therapist_id IN (
      SELECT id FROM therapists WHERE auth_id = auth.uid()
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_therapists_updated_at ON therapists;
CREATE TRIGGER update_therapists_updated_at
  BEFORE UPDATE ON therapists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_session_notes_updated_at ON session_notes;
CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_session_plans_updated_at ON session_plans;
CREATE TRIGGER update_session_plans_updated_at
  BEFORE UPDATE ON session_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_resources_updated_at ON resources;
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_practice_settings_updated_at ON practice_settings;
CREATE TRIGGER update_practice_settings_updated_at
  BEFORE UPDATE ON practice_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create improved function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Input validation
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;

  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'User email cannot be null';
  END IF;

  -- Start transaction
  BEGIN
    -- Check if therapist already exists
    IF NOT EXISTS (SELECT 1 FROM therapists WHERE auth_id = NEW.id) THEN
      -- Create therapist record
      WITH new_therapist AS (
        INSERT INTO therapists (
          auth_id,
          email,
          full_name,
          subscription_tier,
          subscription_status,
          settings
        ) VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
          'basic',
          'active',
          jsonb_build_object(
            'theme', 'light',
            'notifications', jsonb_build_object(
              'email', true,
              'session_reminders', true
            )
          )
        )
        RETURNING id
      )
      -- Create practice settings
      INSERT INTO practice_settings (
        therapist_id,
        settings
      )
      SELECT 
        id,
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
      FROM new_therapist;
    END IF;

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
      RAISE;
  END;
END;
$$;

-- Create new user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();