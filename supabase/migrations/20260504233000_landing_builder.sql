create table if not exists public.landing_blocks (
  id uuid primary key default gen_random_uuid(),
  page_key text not null default 'official',
  block_type text not null,
  internal_title text not null,
  slug text not null unique,
  preview_image_url text,
  draft_content jsonb not null default '{}'::jsonb,
  published_content jsonb not null default '{}'::jsonb,
  draft_visible boolean not null default true,
  published_visible boolean not null default true,
  draft_order integer not null default 0,
  published_order integer not null default 0,
  is_enabled boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists landing_blocks_page_draft_idx on public.landing_blocks(page_key, draft_order);
create index if not exists landing_blocks_page_published_idx on public.landing_blocks(page_key, published_order);

alter table public.landing_blocks enable row level security;

drop policy if exists "Admin full landing blocks" on public.landing_blocks;
create policy "Admin full landing blocks"
on public.landing_blocks
for all
using (
  exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista')
  )
)
with check (
  exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista')
  )
);

create table if not exists public.landing_block_events (
  id uuid primary key default gen_random_uuid(),
  page_key text not null default 'official',
  block_slug text not null,
  block_type text not null,
  event_type text not null,
  cta_id text,
  session_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists landing_block_events_page_idx on public.landing_block_events(page_key, created_at desc);
create index if not exists landing_block_events_slug_idx on public.landing_block_events(block_slug, created_at desc);

alter table public.landing_block_events enable row level security;

drop policy if exists "Public insert landing events" on public.landing_block_events;
create policy "Public insert landing events"
on public.landing_block_events
for insert
with check (true);

drop policy if exists "Admin read landing events" on public.landing_block_events;
create policy "Admin read landing events"
on public.landing_block_events
for select
using (
  exists (
    select 1
    from public.user_roles
    where user_roles.user_id = auth.uid()
      and user_roles.role in ('god_admin', 'admin', 'moderator', 'support', 'comercial', 'analista')
  )
);

drop function if exists public.get_public_landing_blocks(text);
create or replace function public.get_public_landing_blocks(target_page_key text default 'official')
returns table (
  id uuid,
  page_key text,
  block_type text,
  internal_title text,
  slug text,
  preview_image_url text,
  published_content jsonb,
  published_visible boolean,
  published_order integer,
  is_enabled boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    lb.id,
    lb.page_key,
    lb.block_type,
    lb.internal_title,
    lb.slug,
    lb.preview_image_url,
    lb.published_content,
    lb.published_visible,
    lb.published_order,
    lb.is_enabled,
    lb.starts_at,
    lb.ends_at,
    lb.published_at,
    lb.created_at,
    lb.updated_at
  from public.landing_blocks lb
  where lb.page_key = target_page_key
    and lb.is_enabled = true
    and lb.published_visible = true
    and (lb.starts_at is null or lb.starts_at <= now())
    and (lb.ends_at is null or lb.ends_at >= now())
  order by lb.published_order asc;
$$;

grant execute on function public.get_public_landing_blocks(text) to anon, authenticated;

insert into public.landing_blocks (
  page_key,
  block_type,
  internal_title,
  slug,
  draft_content,
  published_content,
  draft_visible,
  published_visible,
  draft_order,
  published_order,
  is_enabled
)
values
(
  'official', 'navbar', 'Navbar principal', 'navbar-principal',
  $${
    "logoText":"FIGUS","logoAccent":"UY","logoUrl":"","background":"#080808","sticky":true,
    "links":[
      {"label":"Como funciona","url":"#como-funciona"},
      {"label":"Influencers","url":"#influencers"},
      {"label":"Gamificacion","url":"#gamificacion"},
      {"label":"Planes","url":"#planes-usuario"},
      {"label":"Negocios","url":"#planes-negocio"}
    ],
    "cta":{"label":"Entrar","url":"/login","style":"primary"}
  }$$::jsonb,
  $${
    "logoText":"FIGUS","logoAccent":"UY","logoUrl":"","background":"#080808","sticky":true,
    "links":[
      {"label":"Como funciona","url":"#como-funciona"},
      {"label":"Influencers","url":"#influencers"},
      {"label":"Gamificacion","url":"#gamificacion"},
      {"label":"Planes","url":"#planes-usuario"},
      {"label":"Negocios","url":"#planes-negocio"}
    ],
    "cta":{"label":"Entrar","url":"/login","style":"primary"}
  }$$::jsonb,
  true, true, 0, 0, true
),
(
  'official', 'hero', 'Hero principal', 'hero-principal',
  $${
    "eyebrow":"4.218 coleccionistas activos ahora",
    "title":"Completa tu album.",
    "highlightWord":"tu",
    "subtitle":"La forma mas rapida de completar tu coleccion, encontrar matches reales, ganar rewards y descubrir donde se esta moviendo el intercambio ahora.",
    "primaryCta":{"label":"Empezar gratis","url":"/login","style":"primary"},
    "secondaryCta":{"label":"Ver como funciona","url":"#como-funciona","style":"ghost"},
    "chips":[
      {"label":"14 buscando ahora","tone":"orange"},
      {"label":"6 cambios hoy","tone":"green"},
      {"label":"Pocitos activo","tone":"blue"}
    ],
    "stats":[
      {"value":"12","label":"te faltan hoy"},
      {"value":"34","label":"matches cerca"},
      {"value":"78%","label":"completo"}
    ],
    "feedTitle":"Ahora en FigusUY",
    "feedSubtitle":"Actividad real, albumes, validaciones y oportunidades moviendose ahora.",
    "feedItems":[
      {"title":"Martin cargo 12 repetidas","detail":"Abrio nuevas oportunidades","time":"hace 3 min","tone":"orange"},
      {"title":"Sofia completo un album","detail":"Gano reward + badge","time":"recien","tone":"green"},
      {"title":"Collectibles validando ahora","detail":"2 albumes en revision","time":"live","tone":"blue"}
    ],
    "wallItems":[
      {"number":"18","label":"Match","tone":"orange"},
      {"number":"24","label":"Tengo","tone":"green"},
      {"number":"45","label":"Falta","tone":"neutral"},
      {"number":"M3","label":"Repetida","tone":"blue"},
      {"number":"7","label":"Cerca","tone":"orange"},
      {"number":"101","label":"Hot","tone":"green"}
    ]
  }$$::jsonb,
  $${
    "eyebrow":"4.218 coleccionistas activos ahora",
    "title":"Completa tu album.",
    "highlightWord":"tu",
    "subtitle":"La forma mas rapida de completar tu coleccion, encontrar matches reales, ganar rewards y descubrir donde se esta moviendo el intercambio ahora.",
    "primaryCta":{"label":"Empezar gratis","url":"/login","style":"primary"},
    "secondaryCta":{"label":"Ver como funciona","url":"#como-funciona","style":"ghost"},
    "chips":[
      {"label":"14 buscando ahora","tone":"orange"},
      {"label":"6 cambios hoy","tone":"green"},
      {"label":"Pocitos activo","tone":"blue"}
    ],
    "stats":[
      {"value":"12","label":"te faltan hoy"},
      {"value":"34","label":"matches cerca"},
      {"value":"78%","label":"completo"}
    ],
    "feedTitle":"Ahora en FigusUY",
    "feedSubtitle":"Actividad real, albumes, validaciones y oportunidades moviendose ahora.",
    "feedItems":[
      {"title":"Martin cargo 12 repetidas","detail":"Abrio nuevas oportunidades","time":"hace 3 min","tone":"orange"},
      {"title":"Sofia completo un album","detail":"Gano reward + badge","time":"recien","tone":"green"},
      {"title":"Collectibles validando ahora","detail":"2 albumes en revision","time":"live","tone":"blue"}
    ],
    "wallItems":[
      {"number":"18","label":"Match","tone":"orange"},
      {"number":"24","label":"Tengo","tone":"green"},
      {"number":"45","label":"Falta","tone":"neutral"},
      {"number":"M3","label":"Repetida","tone":"blue"},
      {"number":"7","label":"Cerca","tone":"orange"},
      {"number":"101","label":"Hot","tone":"green"}
    ]
  }$$::jsonb,
  true, true, 1, 1, true
),
(
  'official', 'now', 'Ahora en FigusUY', 'ahora-en-figusuy',
  $${
    "kicker":"// ahora en figusuy",
    "title":"La red se mueve en tiempo real",
    "subtitle":"Actividad, albumes, zonas calientes y prueba social para entrar cuando la comunidad esta mas activa.",
    "chips":[
      {"label":"Live","tone":"orange"},
      {"label":"Comunidad activa","tone":"green"},
      {"label":"Montevideo","tone":"blue"}
    ],
    "liveItems":[
      {"title":"Martin cargo 12 repetidas","detail":"Abrio nuevas oportunidades","time":"hace 3 min","tone":"orange"},
      {"title":"Sofia completo un album","detail":"Gano reward + badge","time":"recien","tone":"green"},
      {"title":"Collectibles validando ahora","detail":"2 albumes en revision","time":"live","tone":"blue"}
    ],
    "cards":[
      {"title":"Busquedas activas","description":"14 personas buscando cerrar intercambio ahora.","badge":"Live","tone":"orange"},
      {"title":"Cambios completados","description":"6 intercambios validados hoy por la comunidad.","badge":"Hoy","tone":"green"},
      {"title":"Zonas calientes","description":"Pocitos, Centro y Cordon siguen moviendo el mapa.","badge":"Montevideo","tone":"blue"}
    ],
    "activityItems":[
      {"title":"Pocitos sigue caliente","detail":"Nuevas oportunidades en menos de 1 km.","time":"ahora","tone":"orange"},
      {"title":"Nuevo reward desbloqueado","detail":"Badge de reputacion para validadores.","time":"hoy","tone":"green"}
    ],
    "cta":{"label":"Crear cuenta","url":"/login","style":"primary"}
  }$$::jsonb,
  $${
    "kicker":"// ahora en figusuy",
    "title":"La red se mueve en tiempo real",
    "subtitle":"Actividad, albumes, zonas calientes y prueba social para entrar cuando la comunidad esta mas activa.",
    "chips":[
      {"label":"Live","tone":"orange"},
      {"label":"Comunidad activa","tone":"green"},
      {"label":"Montevideo","tone":"blue"}
    ],
    "liveItems":[
      {"title":"Martin cargo 12 repetidas","detail":"Abrio nuevas oportunidades","time":"hace 3 min","tone":"orange"},
      {"title":"Sofia completo un album","detail":"Gano reward + badge","time":"recien","tone":"green"},
      {"title":"Collectibles validando ahora","detail":"2 albumes en revision","time":"live","tone":"blue"}
    ],
    "cards":[
      {"title":"Busquedas activas","description":"14 personas buscando cerrar intercambio ahora.","badge":"Live","tone":"orange"},
      {"title":"Cambios completados","description":"6 intercambios validados hoy por la comunidad.","badge":"Hoy","tone":"green"},
      {"title":"Zonas calientes","description":"Pocitos, Centro y Cordon siguen moviendo el mapa.","badge":"Montevideo","tone":"blue"}
    ],
    "activityItems":[
      {"title":"Pocitos sigue caliente","detail":"Nuevas oportunidades en menos de 1 km.","time":"ahora","tone":"orange"},
      {"title":"Nuevo reward desbloqueado","detail":"Badge de reputacion para validadores.","time":"hoy","tone":"green"}
    ],
    "cta":{"label":"Crear cuenta","url":"/login","style":"primary"}
  }$$::jsonb,
  true, true, 2, 2, true
),
(
  'official', 'albums', 'Albumes en movimiento', 'albumes-en-movimiento',
  $${
    "kicker":"// albumes en movimiento",
    "title":"Descubri donde esta la accion",
    "subtitle":"El admin decide que albumes empujar, cual entra como ultimo agregado y cual esta explotando en actividad.",
    "autoplay":true,
    "autoplayMs":4200,
    "items":[
      {"title":"Mundial 2026","label":"Mas actividad hoy","badge":"Hot","image":"https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop","highlight":true,"activityLabel":"324 cruces esta semana"},
      {"title":"Panini 2026","label":"Base","badge":"Activo","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop","highlight":false,"activityLabel":"112 nuevos coleccionistas"},
      {"title":"Champions","label":"Comunidad","badge":"Subiendo","image":"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop","highlight":false,"activityLabel":"Nuevo empuje esta semana"},
      {"title":"Pokemon","label":"Ultimo agregado","badge":"Nuevo","image":"https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop","highlight":false,"activityLabel":"Album recien publicado"}
    ]
  }$$::jsonb,
  $${
    "kicker":"// albumes en movimiento",
    "title":"Descubri donde esta la accion",
    "subtitle":"El admin decide que albumes empujar, cual entra como ultimo agregado y cual esta explotando en actividad.",
    "autoplay":true,
    "autoplayMs":4200,
    "items":[
      {"title":"Mundial 2026","label":"Mas actividad hoy","badge":"Hot","image":"https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop","highlight":true,"activityLabel":"324 cruces esta semana"},
      {"title":"Panini 2026","label":"Base","badge":"Activo","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop","highlight":false,"activityLabel":"112 nuevos coleccionistas"},
      {"title":"Champions","label":"Comunidad","badge":"Subiendo","image":"https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop","highlight":false,"activityLabel":"Nuevo empuje esta semana"},
      {"title":"Pokemon","label":"Ultimo agregado","badge":"Nuevo","image":"https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop","highlight":false,"activityLabel":"Album recien publicado"}
    ]
  }$$::jsonb,
  true, true, 3, 3, true
),
(
  'official', 'exchange_points', 'Agregar puntos de intercambio', 'agregar-puntos',
  $${
    "kicker":"// descubri",
    "title":"Agrega puntos de intercambio",
    "description":"Sugeri plazas, kioscos, cafes o tiendas donde la comunidad ya se junta. Si se aprueba, ganas visibilidad, XP y ayudas a mover la red.",
    "image":"https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=1200&auto=format&fit=crop",
    "background":"#111111",
    "chips":[
      {"label":"Puntos sugeridos","tone":"green"},
      {"label":"Aprobacion rapida","tone":"blue"},
      {"label":"Reward","tone":"orange"}
    ],
    "cta":{"label":"Sugerir punto","url":"/login","style":"primary"}
  }$$::jsonb,
  $${
    "kicker":"// descubri",
    "title":"Agrega puntos de intercambio",
    "description":"Sugeri plazas, kioscos, cafes o tiendas donde la comunidad ya se junta. Si se aprueba, ganas visibilidad, XP y ayudas a mover la red.",
    "image":"https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=1200&auto=format&fit=crop",
    "background":"#111111",
    "chips":[
      {"label":"Puntos sugeridos","tone":"green"},
      {"label":"Aprobacion rapida","tone":"blue"},
      {"label":"Reward","tone":"orange"}
    ],
    "cta":{"label":"Sugerir punto","url":"/login","style":"primary"}
  }$$::jsonb,
  true, true, 4, 4, true
),
(
  'official', 'how_it_works', 'Como funciona', 'como-funciona',
  $${
    "kicker":"// como funciona",
    "title":"Todo el sistema en una sola app",
    "subtitle":"FigusUY no es solo para cambiar figuritas. Es descubrimiento, comunidad, rewards, validacion y crecimiento en una sola red.",
    "steps":[
      {"image":"https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop","title":"Carga tu album","description":"Subi faltantes y repetidas en segundos.","ctaLabel":""},
      {"image":"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop","title":"Encontra matches","description":"Descubri con quien te conviene hablar primero.","ctaLabel":""},
      {"image":"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop","title":"Cerra intercambios","description":"Valida, rankea y hace crecer tu reputacion.","ctaLabel":""}
    ]
  }$$::jsonb,
  $${
    "kicker":"// como funciona",
    "title":"Todo el sistema en una sola app",
    "subtitle":"FigusUY no es solo para cambiar figuritas. Es descubrimiento, comunidad, rewards, validacion y crecimiento en una sola red.",
    "steps":[
      {"image":"https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop","title":"Carga tu album","description":"Subi faltantes y repetidas en segundos.","ctaLabel":""},
      {"image":"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop","title":"Encontra matches","description":"Descubri con quien te conviene hablar primero.","ctaLabel":""},
      {"image":"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop","title":"Cerra intercambios","description":"Valida, rankea y hace crecer tu reputacion.","ctaLabel":""}
    ]
  }$$::jsonb,
  true, true, 5, 5, true
),
(
  'official', 'influencers', 'Influencers', 'influencers',
  $${
    "kicker":"// influencers",
    "title":"Influencers que activan la red",
    "description":"Converti tu comunidad en una red activa de coleccionistas. Comparti, activa y gana por mover el ecosistema.",
    "image":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop",
    "chips":[
      {"label":"Codigo propio","tone":"orange"},
      {"label":"Dashboard","tone":"green"},
      {"label":"Rewards","tone":"blue"}
    ],
    "benefits":["Invita amigos","Desbloquea dias premium","Activa tu zona","Conviertete en referencia local"],
    "primaryCta":{"label":"Quiero mi codigo","url":"/login","style":"primary"},
    "secondaryCta":{"label":"Ver programa","url":"/affiliate-join/demo","style":"secondary"}
  }$$::jsonb,
  $${
    "kicker":"// influencers",
    "title":"Influencers que activan la red",
    "description":"Converti tu comunidad en una red activa de coleccionistas. Comparti, activa y gana por mover el ecosistema.",
    "image":"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop",
    "chips":[
      {"label":"Codigo propio","tone":"orange"},
      {"label":"Dashboard","tone":"green"},
      {"label":"Rewards","tone":"blue"}
    ],
    "benefits":["Invita amigos","Desbloquea dias premium","Activa tu zona","Conviertete en referencia local"],
    "primaryCta":{"label":"Quiero mi codigo","url":"/login","style":"primary"},
    "secondaryCta":{"label":"Ver programa","url":"/affiliate-join/demo","style":"secondary"}
  }$$::jsonb,
  true, true, 6, 6, true
),
(
  'official', 'gamification', 'Gamificacion', 'gamificacion',
  $${
    "kicker":"// gamificacion",
    "title":"Juga mejor. Gana mas.",
    "subtitle":"Cada accion suma: completar, validar, invitar, compartir, rankear y crecer en la comunidad.",
    "cards":[
      {"image":"https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop","icon":"rocket_launch","badge":"XP","title":"XP y niveles","description":"Subi de nivel con actividad real."},
      {"image":"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop","icon":"workspace_premium","badge":"Badges","title":"Badges","description":"Confiable, rapido y verificado."},
      {"image":"https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=1200&auto=format&fit=crop","icon":"redeem","badge":"Rewards","title":"Rewards","description":"Boosts, visibilidad y perks."},
      {"image":"https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=1200&auto=format&fit=crop","icon":"emoji_events","badge":"Logros","title":"Logros","description":"Desde el comienzo hasta leyenda local."}
    ]
  }$$::jsonb,
  $${
    "kicker":"// gamificacion",
    "title":"Juga mejor. Gana mas.",
    "subtitle":"Cada accion suma: completar, validar, invitar, compartir, rankear y crecer en la comunidad.",
    "cards":[
      {"image":"https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop","icon":"rocket_launch","badge":"XP","title":"XP y niveles","description":"Subi de nivel con actividad real."},
      {"image":"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop","icon":"workspace_premium","badge":"Badges","title":"Badges","description":"Confiable, rapido y verificado."},
      {"image":"https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=1200&auto=format&fit=crop","icon":"redeem","badge":"Rewards","title":"Rewards","description":"Boosts, visibilidad y perks."},
      {"image":"https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=1200&auto=format&fit=crop","icon":"emoji_events","badge":"Logros","title":"Logros","description":"Desde el comienzo hasta leyenda local."}
    ]
  }$$::jsonb,
  true, true, 7, 7, true
),
(
  'official', 'user_plans', 'Planes usuario', 'planes-usuario',
  $${
    "kicker":"// planes usuario",
    "title":"Planes para coleccionistas",
    "subtitle":"No pagas por usar FigusUY. Pagas por completar mas rapido.",
    "plans":[
      {"name":"GRATIS","price":"$0","badge":"BASE","highlight":false,"cta":{"label":"EMPEZAR GRATIS","url":"/login","style":"secondary"},"benefits":["1 album activo","Matches limitados por mes","Chat inicial","Busqueda por barrio"]},
      {"name":"PLUS","price":"$290","badge":"MAS ELEGIDO","highlight":true,"cta":{"label":"PROBAR 7 DIAS","url":"/login","style":"primary"},"benefits":["Mas albumes activos","Alertas utiles","Mayor visibilidad","Mas velocidad para completar"]},
      {"name":"PRO","price":"$490","badge":"POWER USERS","highlight":false,"cta":{"label":"ELEGIR PRO","url":"/login","style":"secondary"},"benefits":["Albumes ilimitados","Prioridad en cruces","Radar extendido","Automatches"]}
    ]
  }$$::jsonb,
  $${
    "kicker":"// planes usuario",
    "title":"Planes para coleccionistas",
    "subtitle":"No pagas por usar FigusUY. Pagas por completar mas rapido.",
    "plans":[
      {"name":"GRATIS","price":"$0","badge":"BASE","highlight":false,"cta":{"label":"EMPEZAR GRATIS","url":"/login","style":"secondary"},"benefits":["1 album activo","Matches limitados por mes","Chat inicial","Busqueda por barrio"]},
      {"name":"PLUS","price":"$290","badge":"MAS ELEGIDO","highlight":true,"cta":{"label":"PROBAR 7 DIAS","url":"/login","style":"primary"},"benefits":["Mas albumes activos","Alertas utiles","Mayor visibilidad","Mas velocidad para completar"]},
      {"name":"PRO","price":"$490","badge":"POWER USERS","highlight":false,"cta":{"label":"ELEGIR PRO","url":"/login","style":"secondary"},"benefits":["Albumes ilimitados","Prioridad en cruces","Radar extendido","Automatches"]}
    ]
  }$$::jsonb,
  true, true, 8, 8, true
),
(
  'official', 'business_plans', 'Planes negocio', 'planes-negocio',
  $${
    "kicker":"// planes negocio",
    "title":"Planes para tiendas y puntos",
    "subtitle":"Aparece donde ya existe intencion real de compra, intercambio y validacion.",
    "plans":[
      {"name":"BOOST","price":"$590","badge":"ENTRADA","highlight":false,"cta":{"label":"QUIERO APARECER","url":"/business/apply","style":"secondary"},"benefits":["Presencia base","CTA simple","Cobertura local"]},
      {"name":"ZONE","price":"$990","badge":"ESCALA LOCAL","highlight":false,"cta":{"label":"VER PLAN","url":"/business/apply","style":"secondary"},"benefits":["Mas visibilidad","Prioridad en zona","Promos locales"]},
      {"name":"PARTNERSTORE","price":"$1490","badge":"DESTACADO","highlight":true,"cta":{"label":"HABLAR CON EL EQUIPO","url":"/business/apply","style":"primary"},"benefits":["Validacion de intercambios","Rewards","Badge premium","Cobertura extendida"]}
    ]
  }$$::jsonb,
  $${
    "kicker":"// planes negocio",
    "title":"Planes para tiendas y puntos",
    "subtitle":"Aparece donde ya existe intencion real de compra, intercambio y validacion.",
    "plans":[
      {"name":"BOOST","price":"$590","badge":"ENTRADA","highlight":false,"cta":{"label":"QUIERO APARECER","url":"/business/apply","style":"secondary"},"benefits":["Presencia base","CTA simple","Cobertura local"]},
      {"name":"ZONE","price":"$990","badge":"ESCALA LOCAL","highlight":false,"cta":{"label":"VER PLAN","url":"/business/apply","style":"secondary"},"benefits":["Mas visibilidad","Prioridad en zona","Promos locales"]},
      {"name":"PARTNERSTORE","price":"$1490","badge":"DESTACADO","highlight":true,"cta":{"label":"HABLAR CON EL EQUIPO","url":"/business/apply","style":"primary"},"benefits":["Validacion de intercambios","Rewards","Badge premium","Cobertura extendida"]}
    ]
  }$$::jsonb,
  true, true, 9, 9, true
),
(
  'official', 'final_cta', 'CTA final', 'cta-final',
  $${
    "title":"Tu proxima figurita puede estar a pocas cuadras",
    "subtitle":"Crea tu cuenta gratis y empieza a completar hoy.",
    "background":"#141414",
    "image":"",
    "cta":{"label":"Empezar ahora","url":"/login","style":"primary"}
  }$$::jsonb,
  $${
    "title":"Tu proxima figurita puede estar a pocas cuadras",
    "subtitle":"Crea tu cuenta gratis y empieza a completar hoy.",
    "background":"#141414",
    "image":"",
    "cta":{"label":"Empezar ahora","url":"/login","style":"primary"}
  }$$::jsonb,
  true, true, 10, 10, true
),
(
  'official', 'footer', 'Footer', 'footer',
  $${
    "logoText":"FIGUS","logoAccent":"UY","legal":"© 2026 FigusUY. Uruguay.",
    "links":[{"label":"Términos","url":"/p/terminos"},{"label":"Privacidad","url":"/p/privacidad"},{"label":"Seguridad","url":"/p/seguridad"}]
  }$$::jsonb,
  $${
    "logoText":"FIGUS","logoAccent":"UY","legal":"© 2026 FigusUY. Uruguay.",
    "links":[{"label":"Términos","url":"/p/terminos"},{"label":"Privacidad","url":"/p/privacidad"},{"label":"Seguridad","url":"/p/seguridad"}]
  }$$::jsonb,
  true, true, 11, 11, true
)
on conflict (slug) do nothing;
