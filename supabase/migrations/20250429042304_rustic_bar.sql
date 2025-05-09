/*
  # Set up RLS policies for Clerk authentication
  
  1. Changes
    - Drop existing policies
    - Create new policies using Clerk JWT claims
    - Use auth.jwt() -> 'sub' to get Clerk user ID
    
  2. Security
    - Ensure data isolation between users
    - Use Clerk JWT claims for authentication
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
CREATE POLICY "clients_select_policy" ON public.clients
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "clients_insert_policy" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "clients_update_policy" ON public.clients
  FOR UPDATE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "clients_delete_policy" ON public.clients
  FOR DELETE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

-- Create RLS policies for session_plans using Clerk user ID
CREATE POLICY "session_plans_select_policy" ON public.session_plans
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "session_plans_insert_policy" ON public.session_plans
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "session_plans_update_policy" ON public.session_plans
  FOR UPDATE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "session_plans_delete_policy" ON public.session_plans
  FOR DELETE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

-- Create RLS policies for resources using Clerk user ID
CREATE POLICY "resources_select_policy" ON public.resources
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "resources_insert_policy" ON public.resources
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "resources_update_policy" ON public.resources
  FOR UPDATE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'))
  WITH CHECK (user_id = (auth.jwt() ->> 'sub'));

CREATE POLICY "resources_delete_policy" ON public.resources
  FOR DELETE TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub'));