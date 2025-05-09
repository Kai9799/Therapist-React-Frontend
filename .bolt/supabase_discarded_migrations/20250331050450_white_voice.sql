/*
  # Add Company Creation Policies
  
  1. Changes
    - Add INSERT policy for companies table
    - Add UPDATE policy for companies table
    - Add policy for company creation during signup
    
  2. Security
    - Allow authenticated users to create companies
    - Allow company owners to update their company
    - Maintain existing view policies
*/

-- Add policy to allow company creation during signup
CREATE POLICY "Enable company creation during signup"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add policy to allow company owners to update their company
CREATE POLICY "Company owners can update their company"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (id IN (
    SELECT t.company_id 
    FROM therapists t 
    WHERE t.auth_id = auth.uid()
    AND t.company_id IS NOT NULL
  ))
  WITH CHECK (id IN (
    SELECT t.company_id 
    FROM therapists t 
    WHERE t.auth_id = auth.uid()
    AND t.company_id IS NOT NULL
  ));

-- Add policy to allow company creation during signup
CREATE POLICY "Enable therapist company linking"
  ON therapists
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());