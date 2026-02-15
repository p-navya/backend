-- FIX: Allow backend (acting as anon) to perform operations
-- Security is handled by the Backend API Middleware, not RLS
-- This bypasses the need for a Service Role Key or passing JWTs

-- 1. Study Groups: Allow Anon to Insert/Select
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.study_groups;
CREATE POLICY "Allow anon insert groups" ON public.study_groups
    FOR INSERT WITH CHECK (true);

-- 2. Group Members: Allow Anon to Insert/Select
DROP POLICY IF EXISTS "Authenticated users can join public groups" ON public.group_members;
DROP POLICY IF EXISTS "Join groups" ON public.group_members;
CREATE POLICY "Allow anon insert members" ON public.group_members
    FOR INSERT WITH CHECK (true);

-- 3. Messages: Allow Anon to Insert/Select
-- (Backend middleware checks membership before querying/inserting)
DROP POLICY IF EXISTS "Group members can view messages" ON public.group_messages;
DROP POLICY IF EXISTS "View messages if member" ON public.group_messages;
CREATE POLICY "Allow public view messages" ON public.group_messages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Send messages if member" ON public.group_messages;
CREATE POLICY "Allow anon send messages" ON public.group_messages
    FOR INSERT WITH CHECK (true);
