export const LANDING_PAGE_KEY = 'official'

export const CTA_STYLE_OPTIONS = [
  { value: 'primary', label: 'Principal' },
  { value: 'secondary', label: 'Secundario' },
  { value: 'ghost', label: 'Ghost' },
]

const toneOptions = [
  { value: 'orange', label: 'Orange' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'neutral', label: 'Neutral' },
]

const ctaGroupFields = [
  { key: 'label', label: 'Texto', type: 'text' },
  { key: 'url', label: 'URL', type: 'text' },
  { key: 'style', label: 'Estilo', type: 'select', options: CTA_STYLE_OPTIONS },
]

const promoFields = [
  { key: 'kicker', label: 'Kicker', type: 'text' },
  { key: 'title', label: 'Titulo', type: 'textarea' },
  { key: 'description', label: 'Descripcion', type: 'textarea' },
  { key: 'image', label: 'Imagen', type: 'url' },
  { key: 'background', label: 'Fondo', type: 'color' },
  { key: 'chips', label: 'Chips', type: 'list', itemLabel: 'Chip', fields: [
    { key: 'label', label: 'Texto', type: 'text' },
    { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
  ] },
  { key: 'cta', label: 'CTA', type: 'group', fields: ctaGroupFields },
]

const planFields = [
  { key: 'kicker', label: 'Kicker', type: 'text' },
  { key: 'title', label: 'Titulo', type: 'textarea' },
  { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
  { key: 'plans', label: 'Planes', type: 'list', itemLabel: 'Plan', fields: [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'price', label: 'Precio', type: 'text' },
    { key: 'badge', label: 'Badge', type: 'text' },
    { key: 'highlight', label: 'Destacado', type: 'toggle' },
    { key: 'benefits', label: 'Beneficios', type: 'simple-list', itemLabel: 'Beneficio' },
    { key: 'cta', label: 'CTA', type: 'group', fields: ctaGroupFields },
  ] },
]

const heroFeed = [
  { title: 'Martin cargo 12 repetidas', detail: 'Abrio nuevas oportunidades', time: 'hace 3 min', tone: 'orange' },
  { title: 'Sofia completo un album', detail: 'Gano reward + badge', time: 'recien', tone: 'green' },
  { title: 'Collectibles validando ahora', detail: '2 albumes en revision', time: 'live', tone: 'blue' },
]

const heroStats = [
  { value: '12', label: 'te faltan hoy' },
  { value: '34', label: 'matches cerca' },
  { value: '78%', label: 'completo' },
]

const nowCards = [
  { title: 'Busquedas activas', description: '14 personas buscando cerrar intercambio ahora.', badge: 'Live', tone: 'orange' },
  { title: 'Cambios completados', description: '6 intercambios validados hoy por la comunidad.', badge: 'Hoy', tone: 'green' },
  { title: 'Zonas calientes', description: 'Pocitos, Centro y Cordon siguen moviendo el mapa.', badge: 'Montevideo', tone: 'blue' },
]

const albumItems = [
  {
    title: 'Mundial 2026',
    label: 'Mas actividad hoy',
    badge: 'Hot',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop',
    highlight: true,
    activityLabel: '324 cruces esta semana',
  },
  {
    title: 'Panini 2026',
    label: 'Base',
    badge: 'Activo',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200&auto=format&fit=crop',
    highlight: false,
    activityLabel: '112 nuevos coleccionistas',
  },
  {
    title: 'Champions',
    label: 'Comunidad',
    badge: 'Subiendo',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop',
    highlight: false,
    activityLabel: 'Nuevo empuje esta semana',
  },
  {
    title: 'Pokemon',
    label: 'Ultimo agregado',
    badge: 'Nuevo',
    image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop',
    highlight: false,
    activityLabel: 'Album recien publicado',
  },
]

const userPlans = [
  {
    name: 'Gratis',
    price: '$0',
    badge: 'Base',
    highlight: false,
    cta: { label: 'Empezar gratis', url: '/login', style: 'secondary' },
    benefits: ['1 album activo', 'Matches limitados por mes', 'Chat inicial', 'Busqueda por barrio'],
  },
  {
    name: 'Plus',
    price: '$290',
    badge: 'Mas elegido',
    highlight: true,
    cta: { label: 'Probar 7 dias', url: '/login', style: 'primary' },
    benefits: ['Mas albumes activos', 'Alertas utiles', 'Mayor visibilidad', 'Mas velocidad para completar'],
  },
  {
    name: 'Pro',
    price: '$490',
    badge: 'Power users',
    highlight: false,
    cta: { label: 'Elegir Pro', url: '/login', style: 'secondary' },
    benefits: ['Albumes ilimitados', 'Prioridad en cruces', 'Radar extendido', 'Automatches'],
  },
]

const businessPlans = [
  {
    name: 'Boost',
    price: '$590',
    badge: 'Entrada',
    highlight: false,
    cta: { label: 'Quiero aparecer', url: '/business/apply', style: 'secondary' },
    benefits: ['Presencia base', 'CTA simple', 'Cobertura local'],
  },
  {
    name: 'Zone',
    price: '$990',
    badge: 'Escala local',
    highlight: false,
    cta: { label: 'Ver plan', url: '/business/apply', style: 'secondary' },
    benefits: ['Mas visibilidad', 'Prioridad en zona', 'Promos locales'],
  },
  {
    name: 'PartnerStore',
    price: '$1490',
    badge: 'Destacado',
    highlight: true,
    cta: { label: 'Hablar con el equipo', url: '/business/apply', style: 'primary' },
    benefits: ['Validacion de intercambios', 'Rewards', 'Badge premium', 'Cobertura extendida'],
  },
]

export const LANDING_BLOCK_LIBRARY = [
  {
    type: 'navbar',
    label: 'Navbar',
    description: 'Encabezado principal con logo, links y CTA.',
    preview: 'Superior',
    fields: [
      { key: 'logoText', label: 'Logo texto', type: 'text' },
      { key: 'logoAccent', label: 'Logo acento', type: 'text' },
      { key: 'logoUrl', label: 'Logo imagen', type: 'url' },
      { key: 'background', label: 'Fondo', type: 'color' },
      { key: 'sticky', label: 'Sticky', type: 'toggle' },
      {
        key: 'links',
        label: 'Links',
        type: 'list',
        itemLabel: 'Link',
        fields: [
          { key: 'label', label: 'Texto', type: 'text' },
          { key: 'url', label: 'URL', type: 'text' },
        ],
      },
      {
        key: 'cta',
        label: 'CTA principal',
        type: 'group',
        fields: [
          { key: 'label', label: 'Texto CTA', type: 'text' },
          { key: 'url', label: 'URL CTA', type: 'text' },
          { key: 'style', label: 'Estilo CTA', type: 'select', options: CTA_STYLE_OPTIONS },
        ],
      },
    ],
  },
  {
    type: 'hero',
    label: 'Hero principal',
    description: 'Hero editorial con stats, live card, chips y feed.',
    preview: 'Portada',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'highlightWord', label: 'Palabra destacada', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      {
        key: 'primaryCta',
        label: 'CTA principal',
        type: 'group',
        fields: [
          { key: 'label', label: 'Texto', type: 'text' },
          { key: 'url', label: 'URL', type: 'text' },
          { key: 'style', label: 'Estilo', type: 'select', options: CTA_STYLE_OPTIONS },
        ],
      },
      {
        key: 'secondaryCta',
        label: 'CTA secundario',
        type: 'group',
        fields: [
          { key: 'label', label: 'Texto', type: 'text' },
          { key: 'url', label: 'URL', type: 'text' },
          { key: 'style', label: 'Estilo', type: 'select', options: CTA_STYLE_OPTIONS },
        ],
      },
      { key: 'chips', label: 'Chips', type: 'list', itemLabel: 'Chip', fields: [
        { key: 'label', label: 'Texto', type: 'text' },
        { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
      ] },
      { key: 'stats', label: 'Metricas', type: 'list', itemLabel: 'Metrica', fields: [
        { key: 'value', label: 'Valor', type: 'text' },
        { key: 'label', label: 'Texto', type: 'text' },
      ] },
      { key: 'feedTitle', label: 'Tarjeta derecha titulo', type: 'text' },
      { key: 'feedSubtitle', label: 'Tarjeta derecha subtitulo', type: 'textarea' },
      { key: 'feedItems', label: 'Feed en vivo', type: 'list', itemLabel: 'Actividad', fields: [
        { key: 'title', label: 'Titulo', type: 'text' },
        { key: 'detail', label: 'Detalle', type: 'text' },
        { key: 'time', label: 'Tiempo', type: 'text' },
        { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
      ] },
      { key: 'wallItems', label: 'Tarjetas visuales', type: 'list', itemLabel: 'Card', fields: [
        { key: 'number', label: 'Numero', type: 'text' },
        { key: 'label', label: 'Badge', type: 'text' },
        { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
      ] },
    ],
  },
  {
    type: 'now',
    label: 'Ahora en FigusUY',
    description: 'Bloque de actividad, chips y tarjetas de movimiento.',
    preview: 'Actividad',
    fields: sharedSectionFields(['liveItems', 'activityItems', 'cards', 'cta']),
  },
  {
    type: 'albums',
    label: 'Albumes en movimiento',
    description: 'Slider editable de albumes destacados.',
    preview: 'Carousel',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'autoplay', label: 'Autoplay', type: 'toggle' },
      { key: 'autoplayMs', label: 'Intervalo autoplay', type: 'number' },
      { key: 'items', label: 'Albumes', type: 'list', itemLabel: 'Album', fields: [
        { key: 'title', label: 'Titulo', type: 'text' },
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'image', label: 'Portada', type: 'url' },
        { key: 'activityLabel', label: 'Actividad', type: 'text' },
        { key: 'highlight', label: 'Destacado', type: 'toggle' },
      ] },
    ],
  },
  {
    type: 'exchange_points',
    label: 'Agregar puntos de intercambio',
    description: 'Bloque promocional para sugerir puntos.',
    preview: 'Promo',
    fields: promoFields,
  },
  {
    type: 'how_it_works',
    label: 'Como funciona',
    description: 'Tres pasos con imagen, texto y CTA opcional.',
    preview: '3 pasos',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'steps', label: 'Pasos', type: 'list', itemLabel: 'Paso', fields: [
        { key: 'image', label: 'Imagen', type: 'url' },
        { key: 'title', label: 'Titulo', type: 'text' },
        { key: 'description', label: 'Descripcion', type: 'textarea' },
        { key: 'ctaLabel', label: 'CTA opcional', type: 'text' },
      ] },
    ],
  },
  {
    type: 'influencers',
    label: 'Influencers',
    description: 'Layout con imagen izquierda y contenido derecha.',
    preview: 'Split',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'description', label: 'Descripcion', type: 'textarea' },
      { key: 'image', label: 'Imagen', type: 'url' },
      { key: 'chips', label: 'Chips', type: 'list', itemLabel: 'Chip', fields: [
        { key: 'label', label: 'Texto', type: 'text' },
        { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
      ] },
      { key: 'benefits', label: 'Beneficios', type: 'simple-list', itemLabel: 'Beneficio' },
      { key: 'primaryCta', label: 'CTA principal', type: 'group', fields: ctaGroupFields },
      { key: 'secondaryCta', label: 'CTA secundaria', type: 'group', fields: ctaGroupFields },
    ],
  },
  {
    type: 'gamification',
    label: 'Gamificacion',
    description: 'Cuatro cards de XP, badges, rewards y logros.',
    preview: 'Rewards',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'cards', label: 'Cards', type: 'list', itemLabel: 'Card', fields: [
        { key: 'image', label: 'Imagen', type: 'url' },
        { key: 'icon', label: 'Icono', type: 'text' },
        { key: 'badge', label: 'Badge', type: 'text' },
        { key: 'title', label: 'Titulo', type: 'text' },
        { key: 'description', label: 'Descripcion', type: 'textarea' },
      ] },
    ],
  },
  {
    type: 'user_plans',
    label: 'Planes usuario',
    description: 'Planes editables para coleccionistas.',
    preview: 'Pricing',
    fields: planFields,
  },
  {
    type: 'business_plans',
    label: 'Planes negocio',
    description: 'Planes editables para tiendas y puntos.',
    preview: 'Pricing',
    fields: planFields,
  },
  {
    type: 'final_cta',
    label: 'CTA final',
    description: 'Cierre de conversion con fondo e imagen opcional.',
    preview: 'Final',
    fields: [
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'background', label: 'Color de fondo', type: 'color' },
      { key: 'image', label: 'Imagen opcional', type: 'url' },
      { key: 'cta', label: 'CTA', type: 'group', fields: ctaGroupFields },
    ],
  },
  {
    type: 'footer',
    label: 'Footer',
    description: 'Links legales, social y CTA final.',
    preview: 'Legal',
    fields: [
      { key: 'logoText', label: 'Logo texto', type: 'text' },
      { key: 'logoAccent', label: 'Logo acento', type: 'text' },
      { key: 'legal', label: 'Legal', type: 'text' },
      { key: 'social', label: 'Social links', type: 'list', itemLabel: 'Social', fields: [
        { key: 'label', label: 'Nombre', type: 'text' },
        { key: 'url', label: 'URL', type: 'text' },
      ] },
      { key: 'links', label: 'Links footer', type: 'list', itemLabel: 'Link', fields: [
        { key: 'label', label: 'Texto', type: 'text' },
        { key: 'url', label: 'URL', type: 'text' },
      ] },
      { key: 'cta', label: 'CTA footer', type: 'group', fields: ctaGroupFields },
    ],
  },
]

export const LANDING_DEFAULT_BLOCKS = [
  {
    block_type: 'navbar',
    internal_title: 'Navbar principal',
    slug: 'navbar-principal',
    preview_image_url: '',
    draft_content: {
      logoText: 'FIGUS',
      logoAccent: 'UY',
      logoUrl: '',
      background: '#080808',
      sticky: true,
      links: [
        { label: 'Como funciona', url: '#como-funciona' },
        { label: 'Influencers', url: '#influencers' },
        { label: 'Gamificacion', url: '#gamificacion' },
        { label: 'Planes', url: '#planes-usuario' },
        { label: 'Negocios', url: '#planes-negocio' },
      ],
      cta: { label: 'Entrar', url: '/login', style: 'primary' },
    },
  },
  {
    block_type: 'hero',
    internal_title: 'Hero principal',
    slug: 'hero-principal',
    preview_image_url: '',
    draft_content: {
      eyebrow: '4.218 coleccionistas activos ahora',
      title: 'Completa tu album.',
      highlightWord: 'tu',
      subtitle: 'La forma mas rapida de completar tu coleccion, encontrar matches reales, ganar rewards y descubrir donde se esta moviendo el intercambio ahora.',
      primaryCta: { label: 'Empezar gratis', url: '/login', style: 'primary' },
      secondaryCta: { label: 'Ver como funciona', url: '#como-funciona', style: 'ghost' },
      chips: [
        { label: '14 buscando ahora', tone: 'orange' },
        { label: '6 cambios hoy', tone: 'green' },
        { label: 'Pocitos activo', tone: 'blue' },
      ],
      stats: heroStats,
      feedTitle: 'Ahora en FigusUY',
      feedSubtitle: 'Actividad real, albumes, validaciones y oportunidades moviendose ahora.',
      feedItems: heroFeed,
      wallItems: [
        { number: '18', label: 'Match', tone: 'orange' },
        { number: '24', label: 'Tengo', tone: 'green' },
        { number: '45', label: 'Falta', tone: 'neutral' },
        { number: 'M3', label: 'Repetida', tone: 'blue' },
        { number: '7', label: 'Cerca', tone: 'orange' },
        { number: '101', label: 'Hot', tone: 'green' },
      ],
    },
  },
  {
    block_type: 'now',
    internal_title: 'Ahora en FigusUY',
    slug: 'ahora-en-figusuy',
    preview_image_url: '',
    draft_content: {
      kicker: '// ahora en figusuy',
      title: 'La red se mueve en tiempo real',
      subtitle: 'Actividad, albumes, zonas calientes y prueba social para entrar cuando la comunidad esta mas activa.',
      chips: [
        { label: 'Live', tone: 'orange' },
        { label: 'Comunidad activa', tone: 'green' },
        { label: 'Montevideo', tone: 'blue' },
      ],
      liveItems: heroFeed,
      cards: nowCards,
      activityItems: [
        { title: 'Pocitos sigue caliente', detail: 'Nuevas oportunidades en menos de 1 km.', time: 'ahora', tone: 'orange' },
        { title: 'Nuevo reward desbloqueado', detail: 'Badge de reputacion para validadores.', time: 'hoy', tone: 'green' },
      ],
      cta: { label: 'Crear cuenta', url: '/login', style: 'primary' },
    },
  },
  {
    block_type: 'albums',
    internal_title: 'Albumes en movimiento',
    slug: 'albumes-en-movimiento',
    preview_image_url: '',
    draft_content: {
      kicker: '// albumes en movimiento',
      title: 'Descubri donde esta la accion',
      subtitle: 'El admin decide que albumes empujar, cual entra como ultimo agregado y cual esta explotando en actividad.',
      autoplay: true,
      autoplayMs: 4200,
      items: albumItems,
    },
  },
  {
    block_type: 'exchange_points',
    internal_title: 'Agregar puntos de intercambio',
    slug: 'agregar-puntos',
    preview_image_url: '',
    draft_content: {
      kicker: '// descubri',
      title: 'Agrega puntos de intercambio',
      description: 'Sugeri plazas, kioscos, cafes o tiendas donde la comunidad ya se junta. Si se aprueba, ganas visibilidad, XP y ayudas a mover la red.',
      image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=1200&auto=format&fit=crop',
      background: '#111111',
      chips: [
        { label: 'Puntos sugeridos', tone: 'green' },
        { label: 'Aprobacion rapida', tone: 'blue' },
        { label: 'Reward', tone: 'orange' },
      ],
      cta: { label: 'Sugerir punto', url: '/login', style: 'primary' },
    },
  },
  {
    block_type: 'how_it_works',
    internal_title: 'Como funciona',
    slug: 'como-funciona',
    preview_image_url: '',
    draft_content: {
      kicker: '// como funciona',
      title: 'Todo el sistema en una sola app',
      subtitle: 'FigusUY no es solo para cambiar figuritas. Es descubrimiento, comunidad, rewards, validacion y crecimiento en una sola red.',
      steps: [
        {
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop',
          title: 'Carga tu album',
          description: 'Subi faltantes y repetidas en segundos.',
          ctaLabel: '',
        },
        {
          image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1200&auto=format&fit=crop',
          title: 'Encontra matches',
          description: 'Descubri con quien te conviene hablar primero.',
          ctaLabel: '',
        },
        {
          image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
          title: 'Cerra intercambios',
          description: 'Valida, rankea y hace crecer tu reputacion.',
          ctaLabel: '',
        },
      ],
    },
  },
  {
    block_type: 'influencers',
    internal_title: 'Influencers',
    slug: 'influencers',
    preview_image_url: '',
    draft_content: {
      kicker: '// influencers',
      title: 'Influencers que activan la red',
      description: 'Converti tu comunidad en una red activa de coleccionistas. Comparti, activa y gana por mover el ecosistema.',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1400&auto=format&fit=crop',
      chips: [
        { label: 'Codigo propio', tone: 'orange' },
        { label: 'Dashboard', tone: 'green' },
        { label: 'Rewards', tone: 'blue' },
      ],
      benefits: ['Invita amigos', 'Desbloquea dias premium', 'Activa tu zona', 'Conviertete en referencia local'],
      primaryCta: { label: 'Quiero mi codigo', url: '/login', style: 'primary' },
      secondaryCta: { label: 'Ver programa', url: '/affiliate-join/demo', style: 'secondary' },
    },
  },
  {
    block_type: 'gamification',
    internal_title: 'Gamificacion',
    slug: 'gamificacion',
    preview_image_url: '',
    draft_content: {
      kicker: '// gamificacion',
      title: 'Juga mejor. Gana mas.',
      subtitle: 'Cada accion suma: completar, validar, invitar, compartir, rankear y crecer en la comunidad.',
      cards: [
        {
          image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop',
          icon: 'rocket_launch',
          badge: 'XP',
          title: 'XP y niveles',
          description: 'Subi de nivel con actividad real.',
        },
        {
          image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop',
          icon: 'workspace_premium',
          badge: 'Badges',
          title: 'Badges',
          description: 'Confiable, rapido y verificado.',
        },
        {
          image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=1200&auto=format&fit=crop',
          icon: 'redeem',
          badge: 'Rewards',
          title: 'Rewards',
          description: 'Boosts, visibilidad y perks.',
        },
        {
          image: 'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?q=80&w=1200&auto=format&fit=crop',
          icon: 'emoji_events',
          badge: 'Logros',
          title: 'Logros',
          description: 'Desde el comienzo hasta leyenda local.',
        },
      ],
    },
  },
  {
    block_type: 'user_plans',
    internal_title: 'Planes usuario',
    slug: 'planes-usuario',
    preview_image_url: '',
    draft_content: {
      kicker: '// planes usuario',
      title: 'Planes para coleccionistas',
      subtitle: 'No pagas por usar FigusUY. Pagas por completar mas rapido.',
      plans: userPlans,
    },
  },
  {
    block_type: 'business_plans',
    internal_title: 'Planes negocio',
    slug: 'planes-negocio',
    preview_image_url: '',
    draft_content: {
      kicker: '// planes negocio',
      title: 'Planes para tiendas y puntos',
      subtitle: 'Aparece donde ya existe intencion real de compra, intercambio y validacion.',
      plans: businessPlans,
    },
  },
  {
    block_type: 'final_cta',
    internal_title: 'CTA final',
    slug: 'cta-final',
    preview_image_url: '',
    draft_content: {
      title: 'Tu proxima figurita puede estar a pocas cuadras',
      subtitle: 'Crea tu cuenta gratis y empieza a completar hoy.',
      background: '#141414',
      image: '',
      cta: { label: 'Empezar ahora', url: '/login', style: 'primary' },
    },
  },
  {
    block_type: 'footer',
    internal_title: 'Footer',
    slug: 'footer',
    preview_image_url: '',
    draft_content: {
      logoText: 'FIGUS',
      logoAccent: 'UY',
      legal: '© 2026 FigusUY. Todos los derechos reservados.',
      social: [
        { label: 'Instagram', url: 'https://instagram.com' },
        { label: 'TikTok', url: 'https://tiktok.com' },
      ],
      links: [
        { label: 'Terminos', url: '/p/terminos' },
        { label: 'Privacidad', url: '/p/privacidad' },
        { label: 'Seguridad', url: '/p/seguridad' },
      ],
      cta: { label: 'Entrar', url: '/login', style: 'secondary' },
    },
  },
].map((block, index) => ({
  page_key: LANDING_PAGE_KEY,
  internal_title: block.internal_title,
  slug: block.slug,
  block_type: block.block_type,
  preview_image_url: block.preview_image_url,
  draft_content: block.draft_content,
  published_content: block.draft_content,
  draft_visible: true,
  published_visible: true,
  draft_order: index,
  published_order: index,
  is_enabled: true,
}))

export function getBlockDefinition(type) {
  return LANDING_BLOCK_LIBRARY.find((block) => block.type === type)
}

export function cloneBlockContent(value) {
  return JSON.parse(JSON.stringify(value))
}

export function normalizeLandingBlocks(rows = [], mode = 'published') {
  const orderKey = mode === 'draft' ? 'draft_order' : 'published_order'
  const contentKey = mode === 'draft' ? 'draft_content' : 'published_content'
  const visibleKey = mode === 'draft' ? 'draft_visible' : 'published_visible'

  return [...rows]
    .filter((row) => row?.is_enabled !== false)
    .filter((row) => row?.[visibleKey] !== false)
    .filter((row) => isScheduledNow(row))
    .sort((a, b) => Number(a?.[orderKey] ?? 0) - Number(b?.[orderKey] ?? 0))
    .map((row) => ({
      ...row,
      content: cloneBlockContent(row?.[contentKey] || {}),
    }))
}

export function isScheduledNow(block) {
  const now = Date.now()
  const starts = block?.starts_at ? new Date(block.starts_at).getTime() : null
  const ends = block?.ends_at ? new Date(block.ends_at).getTime() : null

  if (starts && now < starts) return false
  if (ends && now > ends) return false
  return true
}

export function createEmptyBlock(type) {
  const definition = getBlockDefinition(type)
  const base = LANDING_DEFAULT_BLOCKS.find((item) => item.block_type === type)

  return {
    page_key: LANDING_PAGE_KEY,
    block_type: type,
    internal_title: definition?.label || 'Nuevo bloque',
    slug: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    preview_image_url: '',
    draft_content: cloneBlockContent(base?.draft_content || {}),
    published_content: cloneBlockContent(base?.published_content || base?.draft_content || {}),
    draft_visible: true,
    published_visible: false,
    draft_order: 999,
    published_order: 999,
    is_enabled: true,
  }
}

export function getAnchorId(block) {
  return block?.slug || block?.block_type
}

export function resolveUrl(url = '') {
  if (!url) return '#'
  return url
}

export function computeBlockMetrics(events = [], slug) {
  const scoped = events.filter((event) => event.block_slug === slug)
  const impressions = scoped.filter((event) => event.event_type === 'impression').length
  const clicks = scoped.filter((event) => event.event_type === 'cta_click').length
  return {
    impressions,
    clicks,
    ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0',
  }
}

function sharedSectionFields(extra = []) {
  const fields = [
    { key: 'kicker', label: 'Kicker', type: 'text' },
    { key: 'title', label: 'Titulo', type: 'textarea' },
    { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
    { key: 'chips', label: 'Chips', type: 'list', itemLabel: 'Chip', fields: [
      { key: 'label', label: 'Texto', type: 'text' },
      { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
    ] },
  ]

  if (extra.includes('liveItems')) {
    fields.push({ key: 'liveItems', label: 'Live items', type: 'list', itemLabel: 'Live item', fields: [
      { key: 'title', label: 'Titulo', type: 'text' },
      { key: 'detail', label: 'Detalle', type: 'text' },
      { key: 'time', label: 'Tiempo', type: 'text' },
      { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
    ] })
  }
  if (extra.includes('cards')) {
    fields.push({ key: 'cards', label: 'Cards', type: 'list', itemLabel: 'Card', fields: [
      { key: 'title', label: 'Titulo', type: 'text' },
      { key: 'description', label: 'Descripcion', type: 'textarea' },
      { key: 'badge', label: 'Badge', type: 'text' },
      { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
    ] })
  }
  if (extra.includes('activityItems')) {
    fields.push({ key: 'activityItems', label: 'Actividad', type: 'list', itemLabel: 'Actividad', fields: [
      { key: 'title', label: 'Titulo', type: 'text' },
      { key: 'detail', label: 'Detalle', type: 'text' },
      { key: 'time', label: 'Tiempo', type: 'text' },
      { key: 'tone', label: 'Tono', type: 'select', options: toneOptions },
    ] })
  }
  if (extra.includes('cta')) {
    fields.push({ key: 'cta', label: 'CTA', type: 'group', fields: ctaGroupFields })
  }
  return fields
}
