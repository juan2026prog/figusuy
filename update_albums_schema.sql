-- Add new columns for Album Community Profile
ALTER TABLE albums
ADD COLUMN IF NOT EXISTS public_description TEXT,
ADD COLUMN IF NOT EXISTS secondary_images TEXT[],
ADD COLUMN IF NOT EXISTS pack_images TEXT[],
ADD COLUMN IF NOT EXISTS special_images TEXT[];

-- Update existing albums to have empty arrays instead of null
UPDATE albums
SET 
  secondary_images = COALESCE(secondary_images, '{}'),
  pack_images = COALESCE(pack_images, '{}'),
  special_images = COALESCE(special_images, '{}');
