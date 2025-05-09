/*
  # Initial Schema Setup

  1. New Tables
    - therapists: Stores therapist profiles
    - clients: Stores client information
    - session_plans: Stores therapy session plans
    - session_notes: Session documentation
    - resources: Therapy resources
    - activity_stats: Usage statistics

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
    - Set up secure defaults
*/

-- Create enums
CREATE TYPE subscription_tier AS ENUM ('basic', 'premium', 'professional');
CREATE TYPE session_type AS ENUM ('individual', 'group', 'family', 'couples');
CREATE TYPE resource_type AS ENUM ('worksheet', 'handout', 'exercise', 'assessment');

-- Create tables
CREATE TABLE IF NOT EXISTS therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  practice_name text,
  professional_title text,
  license_number text,
  settings jsonb DEFAULT '{}'::jsonb,
  subscription_tier subscription_tier DEFAULT 'basic'::subscription_tier,
  subscription_status text DEFAULT 'active',
  subscription_start_date timestamptz DEFAULT now(),
  subscription_end_date timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(auth_id),
  UNIQUE(email)
);

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  therapy_type text DEFAULT 'Cognitive Behavioral Therapy',
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

CREATE TABLE IF NOT EXISTS session_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  session_type session_type DEFAULT 'individual'::session_type,
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

CREATE TABLE IF NOT EXISTS session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  session_date timestamptz NOT NULL,
  session_type session_type DEFAULT 'individual'::session_type,
  template_type text,
  overview text,
  key_topics text[],
  emotional_state text,
  interventions text[],
  progress_notes text,
  plan text,
  homework text[],
  summary text,
  section_markers jsonb DEFAULT '[]'::jsonb,
  formatted_content jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  title text NOT NULL,
  type resource_type NOT NULL,
  description text,
  content jsonb NOT NULL,
  tags text[],
  is_template boolean DEFAULT false,
  formatted_content jsonb DEFAULT '{}'::jsonb,
  section_markers jsonb[] DEFAULT '{}'::jsonb[],
  summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE,
  session_plans integer DEFAULT 0,
  resources integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(therapist_id)
);

-- Enable RLS
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Therapists can view own profile"
  ON therapists
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

CREATE POLICY "Therapists can update own profile"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

CREATE POLICY "Therapists can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Therapists can manage own session plans"
  ON session_plans
  FOR ALL
  TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Therapists can manage own session notes"
  ON session_notes
  FOR ALL
  TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Therapists can manage own resources"
  ON resources
  FOR ALL
  TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Therapists can manage own stats"
  ON activity_stats
  FOR ALL
  TO authenticated
  USING (therapist_id IN (
    SELECT id FROM therapists WHERE auth_id = auth.uid()
  ));

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_activity_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_stats (therapist_id)
  VALUES (NEW.id)
  ON CONFLICT (therapist_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_activity_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'session_plans' THEN
    UPDATE activity_stats
    SET session_plans = session_plans + 1
    WHERE therapist_id = NEW.therapist_id;
  ELSIF TG_TABLE_NAME = 'resources' THEN
    UPDATE activity_stats
    SET resources = resources + 1
    WHERE therapist_id = NEW.therapist_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_therapists_updated_at
  BEFORE UPDATE ON therapists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_session_plans_updated_at
  BEFORE UPDATE ON session_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_activity_stats_updated_at
  BEFORE UPDATE ON activity_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ensure_therapist_stats
  AFTER INSERT ON therapists
  FOR EACH ROW
  EXECUTE FUNCTION ensure_activity_stats();

CREATE TRIGGER increment_session_plans_stats
  AFTER INSERT ON session_plans
  FOR EACH ROW
  EXECUTE FUNCTION increment_activity_stats();

CREATE TRIGGER increment_resources_stats
  AFTER INSERT ON resources
  FOR EACH ROW
  EXECUTE FUNCTION increment_activity_stats();