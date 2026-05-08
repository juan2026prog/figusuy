ALTER TABLE public.albums
ADD COLUMN IF NOT EXISTS editorial text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'Uruguay',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'deportes',
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS cover_url text,
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS special_codes jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS has_detailed_stickers boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sticker_codes boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sticker_names boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sticker_images boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS numbering_type text DEFAULT 'standard';

ALTER TABLE public.albums
ALTER COLUMN images SET DEFAULT '{}'::text[],
ALTER COLUMN special_codes SET DEFAULT '{}'::jsonb;

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'albums'
      AND policyname = 'Public can read active albums'
  ) THEN
    CREATE POLICY "Public can read active albums"
    ON public.albums
    FOR SELECT
    USING (
      is_active = true
      OR (
        auth.role() = 'authenticated'
        AND EXISTS (
          SELECT 1
          FROM public.user_roles
          WHERE user_roles.user_id = auth.uid()
            AND user_roles.role IN ('admin', 'god_admin')
        )
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'albums'
      AND policyname = 'Admins can insert albums'
  ) THEN
    CREATE POLICY "Admins can insert albums"
    ON public.albums
    FOR INSERT
    WITH CHECK (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'god_admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'albums'
      AND policyname = 'Admins can update albums'
  ) THEN
    CREATE POLICY "Admins can update albums"
    ON public.albums
    FOR UPDATE
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'god_admin')
      )
    )
    WITH CHECK (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'god_admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'albums'
      AND policyname = 'Admins can delete albums'
  ) THEN
    CREATE POLICY "Admins can delete albums"
    ON public.albums
    FOR DELETE
    USING (
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'god_admin')
      )
    );
  END IF;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('albums', 'albums', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public can view album covers'
  ) THEN
    CREATE POLICY "Public can view album covers"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'albums');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload album covers'
  ) THEN
    CREATE POLICY "Admins can upload album covers"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'albums'
      AND auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'god_admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update album covers'
  ) THEN
    CREATE POLICY "Admins can update album covers"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'albums'
      AND auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'god_admin')
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete album covers'
  ) THEN
    CREATE POLICY "Admins can delete album covers"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'albums'
      AND auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
          AND user_roles.role IN ('admin', 'god_admin')
      )
    );
  END IF;
END $$;
