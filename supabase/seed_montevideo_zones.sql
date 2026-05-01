-- Migration to add seed_priority to locations
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'seed_priority') THEN
        ALTER TABLE public.locations ADD COLUMN seed_priority integer DEFAULT 0;
    END IF;
END $$;

-- Seed script for Safe Exchange Zones in Montevideo
-- Format: name, slug, type, description, country, department, neighborhood, address_reference, lat, lng, seed_priority, metadata

INSERT INTO public.locations (
    id, name, type, lat, lng, address, is_active, metadata, seed_priority, allows_exchange, sells_stickers
) VALUES
-- POCITOS
(gen_random_uuid(), 'Zona Montevideo Shopping', 'safe_exchange_zone', -34.9036, -56.1365, 'Cerca de la entrada principal, zona de alto tránsito.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Pocitos", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Plaza Tomás Gomensoro', 'safe_exchange_zone', -34.9142, -56.1478, 'Plaza pública abierta con buena visibilidad.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Pocitos", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 2, true, false),
(gen_random_uuid(), 'Rambla Pocitos (Kibón)', 'safe_exchange_zone', -34.9085, -56.1355, 'Zona abierta en la rambla, muy concurrida.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Pocitos", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Zona WTC Montevideo', 'safe_exchange_zone', -34.9045, -56.1355, 'Explanada frente a las torres WTC.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Pocitos", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),

-- PUNTA CARRETAS
(gen_random_uuid(), 'Zona Punta Carretas Shopping', 'safe_exchange_zone', -34.9235, -56.1585, 'Entrada principal sobre calle Ellauri.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Punta Carretas", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Plaza Villa Biarritz', 'safe_exchange_zone', -34.9195, -56.1555, 'Zona de juegos y bancos centrales.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Punta Carretas", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 2, true, false),
(gen_random_uuid(), 'Rambla Punta Carretas', 'safe_exchange_zone', -34.9300, -56.1600, 'Cerca de la zona del faro, lugar visible.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Punta Carretas", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 2, true, false),
(gen_random_uuid(), 'Parque Rodó (zona castillo)', 'safe_exchange_zone', -34.9145, -56.1665, 'Frente al castillo del parque, zona iluminada.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Parque Rodó", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),

-- TRES CRUCES
(gen_random_uuid(), 'Explanada Tres Cruces', 'safe_exchange_zone', -34.8945, -56.1645, 'Explanada exterior de la terminal de ómnibus.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Tres Cruces", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Plaza de la Bandera', 'safe_exchange_zone', -34.8935, -56.1655, 'Cerca del mástil central, zona muy visible.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Tres Cruces", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 2, true, false),

-- CENTRO / CORDÓN
(gen_random_uuid(), 'Explanada Intendencia', 'safe_exchange_zone', -34.9060, -56.1855, 'Frente a la IMM por Av. 18 de Julio.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Centro", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Plaza Cagancha', 'safe_exchange_zone', -34.9060, -56.1915, 'Plaza central en Av. 18 de Julio.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Centro", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Plaza Independencia', 'safe_exchange_zone', -34.9065, -56.1995, 'Zona cerca del monumento a Artigas.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Centro", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Plaza Líber Seregni', 'safe_exchange_zone', -34.8985, -56.1745, 'Sector de bancos centrales y juegos.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Cordón", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 2, true, false),

-- CARRASCO
(gen_random_uuid(), 'Plaza Arocena', 'safe_exchange_zone', -34.8885, -56.0585, 'Plaza central de Carrasco comercial.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Carrasco", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Zona Portones Shopping', 'safe_exchange_zone', -34.8815, -56.0825, 'Cerca de la entrada principal de Portones Shopping.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Carrasco", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),

-- BUCEO / MALVÍN
(gen_random_uuid(), 'Rambla Buceo (Puertito)', 'safe_exchange_zone', -34.9045, -56.1305, 'Zona de la explanada del puertito.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Buceo", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 2, true, false),
(gen_random_uuid(), 'Plaza de los Olímpicos', 'safe_exchange_zone', -34.8945, -56.1155, 'Plaza central del barrio Malvín.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Malvín", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 2, true, false),

-- PRADO / OTROS
(gen_random_uuid(), 'Rosedal del Prado', 'safe_exchange_zone', -34.8595, -56.2025, 'Cerca de la entrada principal, zona abierta.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Prado", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Mercado Agrícola (Exterior)', 'safe_exchange_zone', -34.8825, -56.1845, 'Explanada sobre calle José L. Terra.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Goes", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false),
(gen_random_uuid(), 'Zona Nuevocentro', 'safe_exchange_zone', -34.8725, -56.1745, 'Vereda exterior del shopping sobre Bvar. Artigas.', true, 
 '{"category": "public_zone", "is_safe_point": true, "is_public": true, "is_verified": true, "is_seeded": true, "neighborhood": "Jacinto Vera", "department": "Montevideo", "country": "Uruguay"}'::jsonb, 1, true, false)

ON CONFLICT (name) DO NOTHING;
