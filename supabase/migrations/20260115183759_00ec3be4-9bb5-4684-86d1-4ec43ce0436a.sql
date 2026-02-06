-- Ensure schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Ensure table privileges (RLS still applies)
GRANT INSERT ON TABLE public.leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.leads TO authenticated;

GRANT SELECT ON TABLE public.services TO authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;

-- Also ensure sequences (if any) are usable (no-op for uuid pk, but safe)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;