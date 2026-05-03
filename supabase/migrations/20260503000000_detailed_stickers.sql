-- Add flags to albums
ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS has_detailed_stickers boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sticker_codes boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sticker_names boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sticker_images boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS numbering_type text DEFAULT 'standard';

-- Add columns to album_stickers (most are already there, just adding the new ones)
ALTER TABLE public.album_stickers
ADD COLUMN IF NOT EXISTS section text,
ADD COLUMN IF NOT EXISTS sticker_code text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS type text,
ADD COLUMN IF NOT EXISTS rarity text,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
