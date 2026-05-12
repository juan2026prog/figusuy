ALTER TABLE public.albums ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
