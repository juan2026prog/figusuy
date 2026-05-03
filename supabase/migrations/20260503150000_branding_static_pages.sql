-- create site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY,
    value text,
    type text,
    updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin full site_settings" ON public.site_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'god_admin'))
);

-- initial data for branding
INSERT INTO public.site_settings (key, value, type) VALUES
('header_logo_url', '', 'string'),
('header_logo_alt', 'FigusUY', 'string'),
('header_logo_link', '/', 'string'),
('header_show_logo', 'true', 'boolean'),
('header_bg_color', '#0b0b0b', 'string'),
('header_text_color', '#ffffff', 'string'),
('header_primary_color', '#ff5a00', 'string'),
('header_sticky', 'true', 'boolean'),

('footer_enabled', 'true', 'boolean'),
('footer_text', '© 2026 FigusUY. Todos los derechos reservados.', 'string'),
('footer_bg_color', '#090909', 'string'),
('footer_text_color', '#f5f5f5', 'string'),
('footer_link_color', '#ff5a00', 'string'),

('favicon_url', '', 'string')
ON CONFLICT (key) DO NOTHING;

-- create static_pages
CREATE TABLE IF NOT EXISTS public.static_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    content text,
    status text DEFAULT 'draft',
    show_in_footer boolean DEFAULT false,
    footer_order integer DEFAULT 0,
    seo_title text,
    seo_description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published static_pages" ON public.static_pages FOR SELECT USING (status = 'published');
CREATE POLICY "Admin full static_pages" ON public.static_pages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'god_admin'))
);

-- insert base pages
INSERT INTO public.static_pages (title, slug, content, status, show_in_footer, footer_order) VALUES
('Términos y Condiciones', 'terminos', 'Contenido de Términos...', 'published', true, 1),
('Política de Privacidad', 'privacidad', 'Contenido de Privacidad...', 'published', true, 2),
('Seguridad', 'seguridad', 'Contenido de Seguridad...', 'published', true, 3),
('Contacto', 'contacto', 'Contenido de Contacto...', 'published', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('branding-assets', 'branding-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public Access branding" ON storage.objects FOR SELECT USING ( bucket_id = 'branding-assets' );
CREATE POLICY "Admin Upload branding" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'branding-assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'god_admin'))
);
CREATE POLICY "Admin Update branding" ON storage.objects FOR UPDATE USING (
    bucket_id = 'branding-assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'god_admin'))
);
CREATE POLICY "Admin Delete branding" ON storage.objects FOR DELETE USING (
    bucket_id = 'branding-assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'god_admin'))
);
