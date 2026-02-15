-- Allow public read access to resources
DROP POLICY IF EXISTS "Allow authenticated view" ON public.resources;
CREATE POLICY "Allow public view" ON public.resources
    FOR SELECT USING (true);

-- Allow authenticated users to upload (insert)
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.resources;
CREATE POLICY "Allow authenticated insert" ON public.resources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own resources
CREATE POLICY "Allow individual update" ON public.resources
    FOR UPDATE USING (auth.uid() = uploader_id);

-- Allow deletion by owner or admin
DROP POLICY IF EXISTS "Allow owner or admin delete" ON public.resources;
CREATE POLICY "Allow owner or admin delete" ON public.resources
    FOR DELETE USING (
        auth.uid() = uploader_id OR 
        (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
    );
