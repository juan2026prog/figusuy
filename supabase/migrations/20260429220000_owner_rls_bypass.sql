-- Allow the owner's email to always manage user_roles so the frontend fallback can successfully upsert.
DO $$ BEGIN
    CREATE POLICY "Owner can manage user_roles" ON public.user_roles 
    FOR ALL USING ( (auth.jwt() ->> 'email') IN ('juanmacastillo2008@gmail.com', 'admin@figusuy.com') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow owner to insert their own role
DO $$ BEGIN
    CREATE POLICY "Owner can insert user_roles" ON public.user_roles 
    FOR INSERT WITH CHECK ( (auth.jwt() ->> 'email') IN ('juanmacastillo2008@gmail.com', 'admin@figusuy.com') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow owner to update their own role
DO $$ BEGIN
    CREATE POLICY "Owner can update user_roles" ON public.user_roles 
    FOR UPDATE USING ( (auth.jwt() ->> 'email') IN ('juanmacastillo2008@gmail.com', 'admin@figusuy.com') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
