/*
  # Fix RLS Policies for Clerk Auth Integration
  
  1. Changes
    - Drop existing policies
    - Create new policies using Clerk JWT sub claim
    - Add proper error handling for policy creation
    
  2. Security
    - Maintain data isolation between users
    - Use Clerk JWT claims for authentication
    - Ensure proper access control
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

DROP POLICY IF EXISTS "session_plans_select_policy" ON public.session_plans;
DROP POLICY IF EXISTS "session_plans_insert_policy" ON public.session_plans;
DROP POLICY IF EXISTS "session_plans_update_policy" ON public.session_plans;
DROP POLICY IF EXISTS "session_plans_delete_policy" ON public.session_plans;

DROP POLICY IF EXISTS "resources_select_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_insert_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_update_policy" ON public.resources;
DROP POLICY IF EXISTS "resources_delete_policy" ON public.resources;

-- Create RLS policies for clients using Clerk user ID
DO $$ 
BEGIN
  CREATE POLICY "clients_select_policy" ON public.clients
    FOR SELECT TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "clients_insert_policy" ON public.clients
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "clients_update_policy" ON public.clients
    FOR UPDATE TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'))
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "clients_delete_policy" ON public.clients
    FOR DELETE TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  -- Create RLS policies for session_plans using Clerk user ID
  CREATE POLICY "session_plans_select_policy" ON public.session_plans
    FOR SELECT TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "session_plans_insert_policy" ON public.session_plans
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "session_plans_update_policy" ON public.session_plans
    FOR UPDATE TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'))
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "session_plans_delete_policy" ON public.session_plans
    FOR DELETE TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  -- Create RLS policies for resources using Clerk user ID
  CREATE POLICY "resources_select_policy" ON public.resources
    FOR SELECT TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "resources_insert_policy" ON public.resources
    FOR INSERT TO authenticated
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "resources_update_policy" ON public.resources
    FOR UPDATE TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'))
    WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

  CREATE POLICY "resources_delete_policy" ON public.resources
    FOR DELETE TO authenticated
    USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

EXCEPTION WHEN others THEN
  -- Log error details
  RAISE NOTICE 'Error creating policies: %', SQLERRM;
  -- Re-raise the error
  RAISE;
END $$;