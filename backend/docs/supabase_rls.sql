-- Run ONCE in the Supabase SQL editor (and again after adding new tables).
--
-- Why: Supabase auto-exposes every table in the `public` schema through its
-- REST API (PostgREST) using the public "anon" key. LaunchByte's backend talks
-- to Postgres directly through SQLAlchemy and never uses that API, so nothing
-- should be reachable through it — otherwise anyone holding the anon key could
-- read tables such as `users` (emails + password hashes).
--
-- Enabling Row Level Security with NO policies means: the anon/authenticated
-- API roles see nothing. The `postgres` role your backend connects with is the
-- table owner and bypasses RLS, so the backend is unaffected.
--
-- CAUTION: if you later point the backend at a *non-owner* role, it will also
-- be blocked and you will need to add explicit policies for that role.

DO $$
DECLARE
    t record;
BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    END LOOP;
END $$;

-- Verify: every row should show rowsecurity = true
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
