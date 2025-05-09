/*
  # Sample Data Migration

  1. Changes
    - Creates sample auth user
    - Inserts sample therapist data
    - Inserts sample clients
    - Inserts sample session notes
    - Inserts sample session plans
    - Inserts sample resources

  2. Security
    - Uses RLS-compliant data insertion
    - Maintains referential integrity
*/

DO $$
DECLARE
  v_auth_id uuid := '12345678-9abc-def0-1234-56789abcdef0';
  v_therapist_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  v_client_id_1 uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
  v_client_id_2 uuid := 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
BEGIN
  -- Create sample auth user
  INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    created_at
  ) VALUES (
    v_auth_id,
    'dr.robinson@theraplan.com',
    jsonb_build_object(
      'full_name', 'Dr. Sarah Robinson'
    ),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert sample therapist data
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
  ) ON CONFLICT (id) DO NOTHING;

  -- Verify therapist was created
  IF EXISTS (SELECT 1 FROM public.therapists WHERE id = v_therapist_id) THEN
    -- Insert sample clients
    INSERT INTO public.clients (
      id,
      therapist_id,
      name,
      email,
      therapy_type,
      hobbies,
      focus_areas,
      short_term_goals,
      long_term_goals,
      notes,
      status,
      created_at
    ) VALUES
    (
      v_client_id_1,
      v_therapist_id,
      'Sarah Johnson',
      'sarah.j@example.com',
      'Cognitive Behavioral Therapy',
      ARRAY['Reading', 'Yoga', 'Gardening'],
      ARRAY['Anxiety', 'Work Stress', 'Self-esteem'],
      'Develop coping strategies for workplace anxiety',
      'Build resilience and improve self-confidence',
      'Responds well to structured approaches and homework assignments',
      'active',
      NOW()
    ),
    (
      v_client_id_2,
      v_therapist_id,
      'Michael Chen',
      'michael.c@example.com',
      'Psychodynamic Therapy',
      ARRAY['Photography', 'Hiking', 'Cooking'],
      ARRAY['Depression', 'Relationship Issues'],
      'Process recent life changes',
      'Develop healthier relationship patterns',
      'Shows good insight but needs support with emotional expression',
      'active',
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert sample session notes
    INSERT INTO public.session_notes (
      id,
      client_id,
      therapist_id,
      session_date,
      session_type,
      template_type,
      overview,
      key_topics,
      emotional_state,
      interventions,
      progress_notes,
      homework,
      created_at
    ) VALUES
    (
      'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      v_client_id_1,
      v_therapist_id,
      NOW(),
      'individual',
      'progress',
      'Client showed significant progress in implementing anxiety management techniques',
      ARRAY['Workplace stress', 'Coping strategies', 'Boundary setting'],
      'Calm and engaged throughout session',
      ARRAY['Deep breathing exercises', 'Cognitive restructuring', 'Role-playing'],
      'Client successfully used breathing techniques during stressful meeting',
      ARRAY['Practice deep breathing 2x daily', 'Complete thought record'],
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert sample session plans
    INSERT INTO public.session_plans (
      id,
      client_id,
      therapist_id,
      session_date,
      session_type,
      topic,
      overview,
      structure,
      techniques,
      homework,
      therapist_notes,
      created_at
    ) VALUES
    (
      'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
      v_client_id_1,
      v_therapist_id,
      NOW() + INTERVAL '1 week',
      'individual',
      'Building Workplace Resilience',
      'Focus on developing strategies for managing workplace stress',
      jsonb_build_object(
        'sections', jsonb_build_array(
          jsonb_build_object(
            'title', 'Check-in and Review',
            'duration', '10 minutes',
            'description', 'Review progress and homework from last session'
          ),
          jsonb_build_object(
            'title', 'Skill Building',
            'duration', '30 minutes',
            'description', 'Practice new coping strategies'
          ),
          jsonb_build_object(
            'title', 'Action Planning',
            'duration', '10 minutes',
            'description', 'Develop specific action steps'
          )
        )
      ),
      jsonb_build_array(
        'Progressive Muscle Relaxation',
        'Cognitive Restructuring',
        'Mindfulness'
      ),
      ARRAY['Practice PMR daily', 'Complete stress log'],
      'Focus on practical application of techniques in workplace settings',
      NOW()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert sample resources
    INSERT INTO public.resources (
      id,
      therapist_id,
      client_id,
      title,
      description,
      type,
      content,
      tags,
      is_template,
      created_at
    ) VALUES
    (
      'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
      v_therapist_id,
      v_client_id_1,
      'Anxiety Management Worksheet',
      'Worksheet for tracking and managing anxiety triggers',
      'worksheet',
      jsonb_build_object(
        'sections', jsonb_build_array(
          jsonb_build_object(
            'title', 'Trigger Identification',
            'type', 'text',
            'content', 'List situations that trigger anxiety'
          ),
          jsonb_build_object(
            'title', 'Physical Symptoms',
            'type', 'checklist',
            'items', array['Racing heart', 'Sweating', 'Tension']
          ),
          jsonb_build_object(
            'title', 'Coping Strategies',
            'type', 'text',
            'content', 'Document effective coping strategies'
          )
        )
      ),
      ARRAY['anxiety', 'coping', 'workplace'],
      false,
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;