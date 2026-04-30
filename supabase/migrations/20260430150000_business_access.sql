-- Migration for Business Access System

-- 1. Profiles Table Updates
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS business_access boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_status text DEFAULT 'none';

-- 2. Locations Table Updates
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.profiles(id);

-- 3. Location Requests Table
CREATE TABLE IF NOT EXISTS public.location_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    business_name text NOT NULL,
    address text NOT NULL,
    city text,
    department text,
    phone text,
    notes text,
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamptz,
    rejection_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. RLS for location_requests
ALTER TABLE public.location_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own requests"
    ON public.location_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own requests"
    ON public.location_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
    ON public.location_requests FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update requests"
    ON public.location_requests FOR UPDATE
    USING (public.is_admin());

-- 5. RLS for locations (owner)
CREATE POLICY "Owners can update their locations"
    ON public.locations FOR UPDATE
    USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can insert locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.uid() = owner_user_id);
    
CREATE POLICY "Owners can delete their locations"
    ON public.locations FOR DELETE
    USING (auth.uid() = owner_user_id);

-- 6. Trigger for updated_at
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_location_requests_updated_at'
    ) THEN
        CREATE TRIGGER update_location_requests_updated_at
            BEFORE UPDATE ON public.location_requests
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
