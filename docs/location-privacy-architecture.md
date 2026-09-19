# FIGUSUY — Arquitectura de Privacidad de Ubicación y Mapas

## 1. Principio Fundamental
En FigusUY existe una separación estricta e innegociable entre:
- **Coleccionistas / Personas**: Coordenadas GPS exactas **privadas**, utilizadas exclusivamente para cálculos internos en servidor de distancias. Nunca se retornan a otros clientes ni se almacenan en tablas públicas.
- **Comercios / Puntos Seguros**: Coordenadas exactas **públicas**, utilizadas para geolocalización de locales comerciales, navegación y marcadores precisos en mapa.

---

## 2. Modelo de Base de Datos y RLS

### Tabla `user_locations_private`
```sql
CREATE TABLE public.user_locations_private (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  source TEXT DEFAULT 'gps', -- 'gps' | 'manual_approx'
  precision_level TEXT DEFAULT 'precise', -- 'precise' | 'neighborhood' | 'city'
  consent_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### Políticas RLS (Deny-by-default)
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

### Tabla `profiles` (Metadatos públicos aproximados)
Solo almacena:
- `department`: Departamento de residencia (ej: Montevideo, Canelones).
- `city`: Ciudad / Localidad.
- `neighborhood`: Barrio (ej: Pocitos, Cordón).
- `location_visibility`: Nivel de visibilidad (`full`, `city`, `none`).
- `location_precision`: Precisión visual (`neighborhood`, `city`).

---

## 3. Algoritmo de Cálculo Interno (`find-matches`)
1. Autenticación obligatoria mediante JWT (`Authorization: Bearer <token>`).
2. Filtro bilateral de usuarios bloqueados (`user_blocks`).
3. Consulta interna de coordenadas privadas (`user_locations_private`) para el usuario y candidatos.
4. Cálculo de distancia Haversine del lado del servidor.
5. Generación de punto aproximado con jitter determinístico a nivel de radio de barrio (~800m).
6. **Stripping de seguridad**: Se eliminan todos los campos `latitude`, `longitude` crudos de los candidatos antes de devolver el payload JSON.

---

## 4. Componente de Mapas (`FigusMap`)
- Implementado con Leaflet y capa OpenStreetMap con atribución oficial visible.
- Soporta marcadores de tipo `store` y `safe_point` (pins exactos interactivos) y de tipo `person` (círculos difusos de área con radio aproximado).
- Sincronización bidireccional entre la lista de locales y los pines del mapa en `/stores`.
- Toggle de vista `[ LISTA ] [ MAPA ]` en `/matches` y `/stores`.
