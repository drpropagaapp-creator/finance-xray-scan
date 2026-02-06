-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;

-- Create a PERMISSIVE policy for public lead insertion
CREATE POLICY "Anyone can insert leads" 
ON public.leads 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);