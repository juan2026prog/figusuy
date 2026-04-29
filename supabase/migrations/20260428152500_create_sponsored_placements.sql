CREATE TABLE sponsored_placements (
    id uuid primary key default extensions.uuid_generate_v4(),
    title text not null,
    description text,
    placement_type text,
    sponsor_type text,
    location_id uuid references locations(id) on delete set null,
    album_id uuid references albums(id) on delete set null,
    target_country text default 'Uruguay',
    target_department text,
    target_neighborhood text,
    starts_at timestamptz,
    ends_at timestamptz,
    is_active boolean default true,
    priority int default 0,
    cta_label text,
    cta_url text,
    whatsapp text,
    created_at timestamptz default now()
);

CREATE TABLE sponsored_images (
    id uuid primary key default extensions.uuid_generate_v4(),
    sponsored_placement_id uuid references sponsored_placements(id) on delete cascade,
    image_url text not null,
    source text,
    sort_order int default 0,
    is_main boolean default false,
    created_at timestamptz default now()
);

CREATE TABLE sponsored_events (
    id uuid primary key default extensions.uuid_generate_v4(),
    sponsored_placement_id uuid references sponsored_placements(id) on delete cascade,
    event_type text not null,
    user_id uuid references profiles(id) on delete set null,
    placement_context text,
    page text,
    created_at timestamptz default now()
);

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS google_place_id text,
ADD COLUMN IF NOT EXISTS use_google_photos boolean default false,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS allows_exchange boolean default false,
ADD COLUMN IF NOT EXISTS sells_stickers boolean default false,
ADD COLUMN IF NOT EXISTS is_sponsored boolean default false,
ADD COLUMN IF NOT EXISTS sponsor_priority int default 0;

-- RLS
ALTER TABLE sponsored_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsored_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sponsored placements" ON sponsored_placements
FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Anyone can view sponsored images" ON sponsored_images
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own events" ON sponsored_events
FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

-- Admin policies
CREATE POLICY "Admins can manage sponsored_placements" ON sponsored_placements
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'superadmin')));

CREATE POLICY "Admins can manage sponsored_images" ON sponsored_images
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'superadmin')));

CREATE POLICY "Admins can view sponsored_events" ON sponsored_events
FOR SELECT USING (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'superadmin')));
