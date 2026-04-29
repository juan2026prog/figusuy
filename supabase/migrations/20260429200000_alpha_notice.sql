-- =============================================
-- Alpha Notice tracking columns on profiles
-- =============================================
-- Tracks whether the user has dismissed the Alpha welcome modal
-- and which version they last dismissed, so it re-appears on new Alpha releases.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS alpha_notice_seen    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS alpha_notice_version text;

-- Allow users to update only their own alpha_notice columns
-- (profiles already has RLS enabled; we just add a narrow policy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'users_update_own_alpha_notice'
  ) THEN
    CREATE POLICY users_update_own_alpha_notice ON profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
