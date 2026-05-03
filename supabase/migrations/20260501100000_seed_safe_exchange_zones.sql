-- Seed inicial de zonas seguras de intercambio

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='slug') THEN
        ALTER TABLE locations ADD COLUMN slug text UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='category') THEN
        ALTER TABLE locations ADD COLUMN category text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='description') THEN
        ALTER TABLE locations ADD COLUMN description text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='country') THEN
        ALTER TABLE locations ADD COLUMN country text DEFAULT 'Uruguay';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='neighborhood') THEN
        ALTER TABLE locations ADD COLUMN neighborhood text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='address_reference') THEN
        ALTER TABLE locations ADD COLUMN address_reference text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='is_safe_point') THEN
        ALTER TABLE locations ADD COLUMN is_safe_point boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='is_public') THEN
        ALTER TABLE locations ADD COLUMN is_public boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='is_verified') THEN
        ALTER TABLE locations ADD COLUMN is_verified boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='is_seeded') THEN
        ALTER TABLE locations ADD COLUMN is_seeded boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='accepts_exchange') THEN
        ALTER TABLE locations ADD COLUMN accepts_exchange boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='accepts_sales') THEN
        ALTER TABLE locations ADD COLUMN accepts_sales boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='requires_business_owner') THEN
        ALTER TABLE locations ADD COLUMN requires_business_owner boolean DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='seed_priority') THEN
        ALTER TABLE locations ADD COLUMN seed_priority integer DEFAULT 3;
    END IF;
END $$;

-- Asegurar la constraint UNIQUE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'locations_slug_key'
    ) THEN
        ALTER TABLE locations ADD CONSTRAINT locations_slug_key UNIQUE (slug);
    END IF;
END $$;

INSERT INTO locations (
  name, slug, type, category, description, country, department, neighborhood, address_reference, 
  lat, lng, is_safe_point, is_public, is_verified, is_seeded, accepts_exchange, 
  accepts_sales, requires_business_owner, is_active, seed_priority
) VALUES 
('Zona Montevideo Shopping', 'zona-montevideo-shopping-pocitos', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Pocitos', 'Zona Montevideo Shopping', -34.9026, -56.1362, true, true, true, true, true, false, false, true, 1),
('Plaza Tomás Gomensoro', 'plaza-tomas-gomensoro-pocitos', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Pocitos', 'Plaza Tomás Gomensoro', -34.9157, -56.1517, true, true, true, true, true, false, false, true, 2),
('Rambla Pocitos (Kibón)', 'rambla-pocitos-kibon-pocitos', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Pocitos', 'Rambla Pocitos (Kibón)', -34.9126, -56.136, true, true, true, true, true, false, false, true, 1),
('Zona WTC Montevideo', 'zona-wtc-montevideo-pocitos', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Pocitos', 'Zona WTC Montevideo', -34.9038, -56.1352, true, true, true, true, true, false, false, true, 1),
('Zona Punta Carretas Shopping', 'zona-punta-carretas-shopping-punta-carretas', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Punta Carretas', 'Zona Punta Carretas Shopping', -34.9228, -56.1587, true, true, true, true, true, false, false, true, 1),
('Plaza Villa Biarritz', 'plaza-villa-biarritz-punta-carretas', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Punta Carretas', 'Plaza Villa Biarritz', -34.9189, -56.1545, true, true, true, true, true, false, false, true, 2),
('Rambla Punta Carretas', 'rambla-punta-carretas-punta-carretas', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Punta Carretas', 'Rambla Punta Carretas', -34.9282, -56.1601, true, true, true, true, true, false, false, true, 2),
('Club de Golf (Exterior)', 'club-de-golf-exterior-punta-carretas', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Punta Carretas', 'Club de Golf (Exterior)', -34.9213, -56.1624, true, true, true, true, true, false, false, true, 3),
('Explanada Tres Cruces', 'explanada-tres-cruces-tres-cruces', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Tres Cruces', 'Explanada Tres Cruces', -34.8943, -56.1663, true, true, true, true, true, false, false, true, 1),
('Bulevar Artigas y 18', 'bulevar-artigas-y-18-tres-cruces', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Tres Cruces', 'Bulevar Artigas y 18', -34.8967, -56.1668, true, true, true, true, true, false, false, true, 2),
('Plaza de la Bandera', 'plaza-de-la-bandera-tres-cruces', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Tres Cruces', 'Plaza de la Bandera', -34.8927, -56.1664, true, true, true, true, true, false, false, true, 2),
('Explanada Intendencia', 'explanada-intendencia-cordon', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Cordón', 'Explanada Intendencia', -34.9055, -56.1866, true, true, true, true, true, false, false, true, 1),
('Plaza Cagancha', 'plaza-cagancha-cordon', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Cordón', 'Plaza Cagancha', -34.9058, -56.1915, true, true, true, true, true, false, false, true, 1),
('Universidad de la República', 'universidad-de-la-republica-cordon', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Cordón', 'Universidad de la República', -34.9028, -56.1764, true, true, true, true, true, false, false, true, 1),
('Bvar España y Tristán Narvaja', 'bvar-espana-y-tristan-narvaja-cordon', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Cordón', 'Bvar España y Tristán Narvaja', -34.9042, -56.1755, true, true, true, true, true, false, false, true, 2),
('Plaza Independencia', 'plaza-independencia-centro', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Centro', 'Plaza Independencia', -34.9065, -56.1996, true, true, true, true, true, false, false, true, 1),
('Plaza Fabini', 'plaza-fabini-centro', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Centro', 'Plaza Fabini', -34.9056, -56.1953, true, true, true, true, true, false, false, true, 1),
('Puerta de la Ciudadela', 'puerta-de-la-ciudadela-centro', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Centro', 'Puerta de la Ciudadela', -34.9065, -56.2007, true, true, true, true, true, false, false, true, 2),
('Parque Rodó (Zona Lago)', 'parque-rodo-zona-lago-parque-rodo', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Parque Rodó', 'Parque Rodó (Zona Lago)', -34.9142, -56.1667, true, true, true, true, true, false, false, true, 1),
('Castillo del Parque Rodó', 'castillo-del-parque-rodo-parque-rodo', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Parque Rodó', 'Castillo del Parque Rodó', -34.9135, -56.1664, true, true, true, true, true, false, false, true, 2),
('Explanada Teatro de Verano', 'explanada-teatro-de-verano-parque-rodo', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Parque Rodó', 'Explanada Teatro de Verano', -34.9192, -56.1659, true, true, true, true, true, false, false, true, 2),
('Rambla Parque Rodó', 'rambla-parque-rodo-parque-rodo', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Parque Rodó', 'Rambla Parque Rodó', -34.9181, -56.1678, true, true, true, true, true, false, false, true, 2),
('Plaza Arocena', 'plaza-arocena-carrasco', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Carrasco', 'Plaza Arocena', -34.8878, -56.0594, true, true, true, true, true, false, false, true, 1),
('Rambla Carrasco', 'rambla-carrasco-carrasco', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Carrasco', 'Rambla Carrasco', -34.8912, -56.0592, true, true, true, true, true, false, false, true, 2),
('Zona Portones Shopping', 'zona-portones-shopping-carrasco', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Carrasco', 'Zona Portones Shopping', -34.8797, -56.0811, true, true, true, true, true, false, false, true, 1),
('Rambla Buceo', 'rambla-buceo-buceo', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Buceo', 'Rambla Buceo', -34.8995, -56.1265, true, true, true, true, true, false, false, true, 2),
('Plaza Armenia', 'plaza-armenia-buceo', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Buceo', 'Plaza Armenia', -34.9022, -56.1221, true, true, true, true, true, false, false, true, 2),
('Puertito del Buceo', 'puertito-del-buceo-buceo', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Buceo', 'Puertito del Buceo', -34.9052, -56.1299, true, true, true, true, true, false, false, true, 1),
('Rambla Malvín', 'rambla-malvin-malvin', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Malvín', 'Rambla Malvín', -34.8981, -56.1032, true, true, true, true, true, false, false, true, 2),
('Plaza de los Olímpicos', 'plaza-de-los-olimpicos-malvin', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Malvín', 'Plaza de los Olímpicos', -34.8912, -56.1045, true, true, true, true, true, false, false, true, 2),
('Playa Malvín', 'playa-malvin-malvin', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Malvín', 'Playa Malvín', -34.897, -56.0968, true, true, true, true, true, false, false, true, 1),
('Plaza Virgilio', 'plaza-virgilio-punta-gorda', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Punta Gorda', 'Plaza Virgilio', -34.8984, -56.0792, true, true, true, true, true, false, false, true, 1),
('Rambla Punta Gorda', 'rambla-punta-gorda-punta-gorda', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Punta Gorda', 'Rambla Punta Gorda', -34.8967, -56.0835, true, true, true, true, true, false, false, true, 2),
('Estadio Centenario (Exterior)', 'estadio-centenario-exterior-la-blanqueada', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'La Blanqueada', 'Estadio Centenario (Exterior)', -34.8942, -56.1528, true, true, true, true, true, false, false, true, 1),
('Av. Italia y Centenario', 'av-italia-y-centenario-la-blanqueada', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'La Blanqueada', 'Av. Italia y Centenario', -34.892, -56.150, true, true, true, true, true, false, false, true, 2),
('Monumento a la Carreta', 'monumento-a-la-carreta-parque-batlle', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Parque Batlle', 'Monumento a la Carreta', -34.8953, -56.1558, true, true, true, true, true, false, false, true, 1),
('Velódromo (Exterior)', 'velodromo-exterior-parque-batlle', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Parque Batlle', 'Velódromo (Exterior)', -34.8972, -56.1534, true, true, true, true, true, false, false, true, 2),
('Zona Nuevocentro Shopping', 'zona-nuevocentro-shopping-jacinto-vera', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Jacinto Vera', 'Zona Nuevocentro Shopping', -34.869, -56.1706, true, true, true, true, true, false, false, true, 1),
('Plaza Líber Seregni', 'plaza-liber-seregni-la-comercial', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'La Comercial', 'Plaza Líber Seregni', -34.8988, -56.1729, true, true, true, true, true, false, false, true, 1),
('Mercado Agrícola (Exterior)', 'mercado-agricola-exterior-goes', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Goes', 'Mercado Agrícola (Exterior)', -34.8814, -56.1818, true, true, true, true, true, false, false, true, 1),
('Plaza Goes', 'plaza-goes-goes', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Goes', 'Plaza Goes', -34.8798, -56.1785, true, true, true, true, true, false, false, true, 2),
('Rosedal del Prado', 'rosedal-del-prado-prado', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Prado', 'Rosedal del Prado', -34.8622, -56.2017, true, true, true, true, true, false, false, true, 1),
('Jardín Botánico', 'jardin-botanico-prado', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Prado', 'Jardín Botánico', -34.8587, -56.2023, true, true, true, true, true, false, false, true, 2),
('Plaza del Prado', 'plaza-del-prado-prado', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Prado', 'Plaza del Prado', -34.8645, -56.1989, true, true, true, true, true, false, false, true, 2),
('Rural del Prado (Exterior)', 'rural-del-prado-exterior-prado', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Prado', 'Rural del Prado (Exterior)', -34.8631, -56.2066, true, true, true, true, true, false, false, true, 2),
('Plaza Atahualpa', 'plaza-atahualpa-atahualpa', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Atahualpa', 'Plaza Atahualpa', -34.858, -56.189, true, true, true, true, true, false, false, true, 2),
('Plaza de las Pioneras', 'plaza-de-las-pioneras-aguada', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Aguada', 'Plaza de las Pioneras', -34.8842, -56.1895, true, true, true, true, true, false, false, true, 1),
('Torre de las Telecomunicaciones', 'torre-de-las-telecomunicaciones-aguada', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Aguada', 'Torre de las Telecomunicaciones', -34.8913, -56.1945, true, true, true, true, true, false, false, true, 2),
('Plaza Matriz', 'plaza-matriz-ciudad-vieja', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Ciudad Vieja', 'Plaza Matriz', -34.9066, -56.2032, true, true, true, true, true, false, false, true, 1),
('Plaza Zabala', 'plaza-zabala-ciudad-vieja', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Ciudad Vieja', 'Plaza Zabala', -34.9079, -56.2064, true, true, true, true, true, false, false, true, 2),
('Peatonal Sarandí', 'peatonal-sarandi-ciudad-vieja', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Ciudad Vieja', 'Peatonal Sarandí', -34.9064, -56.2037, true, true, true, true, true, false, false, true, 1),
('Plaza España', 'plaza-espana-ciudad-vieja', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Ciudad Vieja', 'Plaza España', -34.9103, -56.1992, true, true, true, true, true, false, false, true, 2),
('Plaza Unión', 'plaza-union-union', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Unión', 'Plaza Unión', -34.8767, -56.1368, true, true, true, true, true, false, false, true, 1),
('8 de Octubre y Comercio', '8-de-octubre-y-comercio-union', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Unión', '8 de Octubre y Comercio', -34.8763, -56.1385, true, true, true, true, true, false, false, true, 2),
('Paso Molino Centro', 'paso-molino-centro-paso-molino', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Paso Molino', 'Paso Molino Centro', -34.8572, -56.2205, true, true, true, true, true, false, false, true, 1),
('Fortaleza del Cerro (Exterior)', 'fortaleza-del-cerro-exterior-cerro', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Cerro', 'Fortaleza del Cerro (Exterior)', -34.8895, -56.2589, true, true, true, true, true, false, false, true, 1),
('Rambla del Cerro', 'rambla-del-cerro-cerro', 'safe_exchange_zone', 'public_zone', 'Punto sugerido para coordinar intercambios en una zona pública, visible y de fácil referencia.', 'Uruguay', 'Montevideo', 'Cerro', 'Rambla del Cerro', -34.892, -56.251, true, true, true, true, true, false, false, true, 2)
ON CONFLICT (slug) DO NOTHING;
