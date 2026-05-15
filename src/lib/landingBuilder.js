export const LANDING_PAGE_KEY = 'official'
export const LANDING_POINTS_PAGE_KEY = 'points'
export const LANDING_INFLUENCERS_PAGE_KEY = 'influencers'

export const LANDING_PAGE_OPTIONS = [
  {
    key: LANDING_PAGE_KEY,
    label: 'Landing principal',
    route: '/',
    description: 'Home principal con producto, planes y conversion.',
    blockTypes: [
      'navbar',
      'hero',
      'now',
      'albums',
      'exchange_points',
      'how_it_works',
      'influencers',
      'gamification',
      'referral_section',
      'user_plans',
      'business_plans',
      'final_cta',
      'footer',
      'faq',
    ],
  },
  {
    key: LANDING_POINTS_PAGE_KEY,
    label: 'Landing Lugares',
    route: '/puntos',
    description: 'Captacion de lugares, tiendas y comercios aliados.',
    blockTypes: ['exchange_points', 'influencers', 'business_plans', 'final_cta', 'faq'],
  },
  {
    key: LANDING_INFLUENCERS_PAGE_KEY,
    label: 'Landing influencers',
    route: '/influencers',
    description: 'Programa de influencers y adquisicion por performance.',
    blockTypes: [
      'influencer_program_hero',
      'influencer_program_pillars',
      'influencer_program_tiers',
      'influencer_program_steps',
      'faq',
      'influencer_program_cta',
    ],
  },
]

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

function mapDefaultBlocks(pageKey, blocks) {
  return blocks.map((block, index) => ({
    page_key: pageKey,
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
}

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
  { title: 'Collectibles validando ahora', detail: '2 álbumes en revision', time: 'live', tone: 'blue' },
]

const heroStats = [
  { value: '12', label: 'te faltan hoy' },
  { value: '34', label: 'matches cerca' },
  { value: '78%', label: 'completo' },
]

const nowCards = [
  { title: 'Busquedas activas', description: '14 personas buscando cerrar intercambio ahora.', badge: 'Live', tone: 'orange' },
  { title: 'Cambios completados', description: '6 intercambios validados hoy por la comunidad.', badge: 'Hoy', tone: 'green' },
  { title: 'Zonas activas', description: 'Pocitos, Centro y Cordon siguen llenos de intercambios.', badge: 'Montevideo', tone: 'blue' },
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
    name: 'GRATIS',
    price: '$0',
    badge: 'BASE',
    highlight: false,
    cta: { label: 'EMPEZAR GRATIS', url: '/login', style: 'secondary' },
    benefits: ['1 album activo', 'Matches limitados por mes', 'Chat inicial', 'Busqueda por barrio'],
  },
  {
    name: 'PLUS',
    price: '$290',
    badge: 'MAS ELEGIDO',
    highlight: true,
    cta: { label: 'PROBAR 7 DIAS', url: '/login', style: 'primary' },
    benefits: ['Mas álbumes activos', 'Alertas utiles', 'Mayor visibilidad', 'Mas velocidad para completar'],
  },
  {
    name: 'PRO',
    price: '$490',
    badge: 'POWER USERS',
    highlight: false,
    cta: { label: 'ELEGIR PRO', url: '/login', style: 'secondary' },
    benefits: ['Álbumes ilimitados', 'Prioridad en cruces', 'Radar extendido', 'Automatches'],
  },
]

const businessPlans = [
  {
    name: 'BOOST',
    price: '$590',
    badge: 'ENTRADA',
    highlight: false,
    cta: { label: 'QUIERO APARECER', url: '/business/apply', style: 'secondary' },
    benefits: ['Presencia base', 'CTA simple', 'Cobertura local'],
  },
  {
    name: 'RADAR',
    price: '$990',
    badge: 'ESCALA LOCAL',
    highlight: false,
    cta: { label: 'VER PLAN', url: '/business/apply', style: 'secondary' },
    benefits: ['Mas visibilidad', 'Prioridad en zona', 'Promos locales'],
  },
  {
    name: 'PARTNERSTORE',
    price: '$1490',
    badge: 'DESTACADO',
    highlight: true,
    cta: { label: 'HABLAR CON EL EQUIPO', url: '/business/apply', style: 'primary' },
    benefits: ['Validación de intercambios', 'Rewards', 'Badge premium', 'Cobertura extendida'],
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
    type: 'influencer_split',
    label: 'Influencers',
    description: 'Bloque para reclutar influencers con beneficios y CTAs.',
    preview: 'Influencers',
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
      { key: 'primaryCta', label: 'CTA Principal', type: 'group', fields: ctaGroupFields },
      { key: 'secondaryCta', label: 'CTA Secundario', type: 'group', fields: ctaGroupFields },
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
    label: 'Álbumes en movimiento',
    description: 'Slider editable de álbumes destacados.',
    preview: 'Carousel',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'autoplay', label: 'Autoplay', type: 'toggle' },
      { key: 'autoplayMs', label: 'Intervalo autoplay', type: 'number' },
      { key: 'items', label: 'Álbumes', type: 'list', itemLabel: 'Album', fields: [
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
    label: 'Agregar lugares de intercambio',
    description: 'Bloque promocional para sugerir lugares.',
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
    description: 'Planes editables para tiendas y lugares.',
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
    type: 'faq',
    label: 'FAQ',
    description: 'Preguntas frecuentes en formato acordeon o lista.',
    preview: 'FAQ',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      {
        key: 'items',
        label: 'Preguntas',
        type: 'list',
        itemLabel: 'Pregunta',
        fields: [
          { key: 'question', label: 'Pregunta', type: 'textarea' },
          { key: 'answer', label: 'Respuesta', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'influencer_program_hero',
    label: 'Influencer hero',
    description: 'Hero de alto impacto para el programa de influencers.',
    preview: 'Hero',
    fields: [
      { key: 'badge', label: 'Badge', type: 'text' },
      { key: 'titleLineOne', label: 'Titulo linea 1', type: 'text' },
      { key: 'titleLineTwo', label: 'Titulo linea 2', type: 'text' },
      { key: 'accentWord', label: 'Palabra acento', type: 'text' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'scrollTarget', label: 'Anchor saber mas', type: 'text' },
      { key: 'primaryCta', label: 'CTA principal', type: 'group', fields: ctaGroupFields },
      { key: 'secondaryCta', label: 'CTA secundario', type: 'group', fields: ctaGroupFields },
    ],
  },
  {
    type: 'influencer_program_pillars',
    label: 'Influencer pilares',
    description: 'Pilares de performance real del programa.',
    preview: 'Pilares',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      {
        key: 'items',
        label: 'Pilares',
        type: 'list',
        itemLabel: 'Pilar',
        fields: [
          { key: 'tag', label: 'Tag', type: 'text' },
          { key: 'icon', label: 'Icono', type: 'text' },
          { key: 'title', label: 'Titulo', type: 'text' },
          { key: 'description', label: 'Descripcion', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'influencer_program_tiers',
    label: 'Influencer tiers',
    description: 'Resumen de tiers y beneficios del programa.',
    preview: 'Tiers',
    fields: [
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      {
        key: 'items',
        label: 'Tiers',
        type: 'list',
        itemLabel: 'Tier',
        fields: [
          { key: 'name', label: 'Nombre', type: 'text' },
          { key: 'commissionLabel', label: 'Comision', type: 'text' },
          { key: 'isFeatured', label: 'Destacado', type: 'toggle' },
          { key: 'benefits', label: 'Beneficios', type: 'simple-list', itemLabel: 'Beneficio' },
        ],
      },
    ],
  },
  {
    type: 'influencer_program_steps',
    label: 'Influencer pasos',
    description: 'Proceso del programa explicado en pasos.',
    preview: 'Proceso',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      {
        key: 'items',
        label: 'Pasos',
        type: 'list',
        itemLabel: 'Paso',
        fields: [
          { key: 'number', label: 'Numero', type: 'text' },
          { key: 'title', label: 'Titulo', type: 'text' },
          { key: 'description', label: 'Descripcion', type: 'textarea' },
        ],
      },
    ],
  },
  {
    type: 'influencer_program_cta',
    label: 'Influencer CTA final',
    description: 'Cierre del programa de influencers.',
    preview: 'Cierre',
    fields: [
      { key: 'backgroundWord', label: 'Texto de fondo', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
      { key: 'cta', label: 'CTA', type: 'group', fields: ctaGroupFields },
    ],
  },
  {
    type: 'referral_section',
    label: 'Sección de Referidos Premium',
    description: 'Bloque con cards de link y recompensas sociales.',
    preview: 'Referidos',
    fields: [
      { key: 'kicker', label: 'Kicker', type: 'text' },
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'subtitle', label: 'Subtitulo', type: 'textarea' },
    ],
  },
  {
    type: 'referrals',
    label: 'Programa de Referidos',
    description: 'Bloque para promocionar el sistema de invita y gana para usuarios.',
    preview: 'Crecimiento',
    fields: [
      { key: 'title', label: 'Titulo', type: 'textarea' },
      { key: 'description', label: 'Descripcion', type: 'textarea' },
      { key: 'cta', label: 'CTA', type: 'group', fields: ctaGroupFields },
      { key: 'steps', label: 'Pasos del proceso', type: 'list', itemLabel: 'Paso', fields: [
        { key: 'title', label: 'Titulo', type: 'text' },
        { key: 'description', label: 'Descripcion', type: 'textarea' },
      ] },
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

const OFFICIAL_DEFAULT_BLOCKS = mapDefaultBlocks(LANDING_PAGE_KEY, [
  {
    block_type: 'navbar',
    internal_title: 'Navbar principal',
    slug: 'navbar-principal',
    preview_image_url: '',
    draft_content: {
      logoText: '',
      logoAccent: '',
      logoUrl: '/logo.webp',
      background: '#080808',
      sticky: true,
      links: [
        { label: 'Como funciona', url: '/#como-funciona' },
        { label: 'Influencers', url: '/#influencers' },
        { label: 'Referidos', url: '/#invita-y-gana' },
        { label: 'Gamificacion', url: '/#gamificacion' },
        { label: 'Planes', url: '/#planes-usuario' },
        { label: 'Negocios', url: '/#planes-negocio' },
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
      feedSubtitle: 'Actividad real, álbumes, validaciones y oportunidades moviendose ahora.',
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
      subtitle: 'Actividad, álbumes, zonas calientes y prueba social para entrar cuando la comunidad esta mas activa.',
      chips: [
        { label: 'Live', tone: 'orange' },
        { label: 'Comunidad activa', tone: 'green' },
        { label: 'Montevideo', tone: 'blue' },
      ],
      liveItems: heroFeed,
      cards: nowCards,
      activityItems: [
        { title: 'Mucho movimiento en Pocitos', detail: 'Se siguen cerrando intercambios cerca tuyo.', time: 'ahora', tone: 'orange' },
        { title: 'Nueva insignia disponible', detail: 'Nuevo badge para quienes ayudan a mover la comunidad.', time: 'hoy', tone: 'green' },
      ],
      cta: { label: 'Crear cuenta', url: '/login', style: 'primary' },
    },
  },
  {
    block_type: 'albums',
    internal_title: 'Álbumes en movimiento',
    slug: 'álbumes-en-movimiento',
    preview_image_url: '',
    draft_content: {
      kicker: '// álbumes en movimiento',
      title: 'DESCUBRÍ QUÉ SE ESTÁ MOVIENDO AHORA',
      subtitle: 'Descubrí qué álbumes y colecciones están moviendo más intercambios dentro de la comunidad.',
      autoplay: true,
      autoplayMs: 4200,
      items: albumItems,
    },
  },
  {
    block_type: 'exchange_points',
    internal_title: 'Agregar lugares de intercambio',
    slug: 'agregar-puntos',
    preview_image_url: '',
    draft_content: {
      kicker: '// descubri',
      title: 'Agrega lugares de intercambio',
      description: 'Sugeri plazas, kioscos, cafes o tiendas donde la comunidad ya se junta. Si se aprueba, ganas visibilidad, XP y ayudas a mover la red.',
      image: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=1200&auto=format&fit=crop',
      background: '#111111',
      chips: [
        { label: 'Lugares sugeridos', tone: 'green' },
        { label: 'Aprobacion rapida', tone: 'blue' },
        { label: 'Reward', tone: 'orange' },
      ],
      cta: { label: 'Sugerir punto', url: 'action:suggest-point', style: 'primary' },
    },
  },
  {
    block_type: 'how_it_works',
    internal_title: 'Como funciona',
    slug: 'como-funciona',
    preview_image_url: '',
    draft_content: {
      kicker: '// como funciona',
      title: 'LA RED DE LOS COLECCIONISTAS',
      subtitle: 'Subí tus repetidas, encontrá matches, descubrí lugares y conectá con una comunidad activa de coleccionistas.',
      steps: [
        {
          image: '/assets/landing/how_it_works/step1.webp',
          title: 'Carga tu album',
          description: 'Subi faltantes y repetidas en segundos.',
          ctaLabel: '',
        },
        {
          image: '/assets/landing/how_it_works/step2.webp',
          title: 'Encontra matches',
          description: 'Descubri con quien te conviene hablar primero.',
          ctaLabel: '',
        },
        {
          image: '/assets/landing/how_it_works/step3.webp',
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
      primaryCta: { label: 'Quiero mi codigo', url: 'action:influencer-apply', style: 'primary' },
      secondaryCta: { label: 'Ver programa', url: 'action:influencer-info', style: 'secondary' },
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
          description: 'Destacate dentro de la comunidad.',
        },
        {
          image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?q=80&w=1200&auto=format&fit=crop',
          icon: 'redeem',
          badge: 'Rewards',
          title: 'Rewards',
          description: 'Más visibilidad, beneficios y mejores oportunidades.',
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
    block_type: 'influencers',
    internal_title: 'Influencers Promo',
    slug: 'influencers-promo',
    preview_image_url: '',
    draft_content: {
      kicker: '// programa de influencers',
      title: 'Tu audiencia vale mas de lo que pensas',
      description: 'Sumate como partner oficial de FigusUY. No pedimos seguidores, pedimos activaciones reales.',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop',
      chips: [
        { label: 'Tier System', tone: 'orange' },
        { label: 'Real Performance', tone: 'neutral' },
      ],
      benefits: [
        'Dashboard de performance en vivo',
        'Codigos de invitacion unicos',
        'Comisiones por usuarios activos',
        'Pagos mensuales garantizados',
      ],
      primaryCta: { label: 'Quiero mi código', url: 'action:influencer-apply', style: 'primary' },
      secondaryCta: { label: 'Ver programa', url: 'action:influencer-info', style: 'secondary' },
    },
  },
  {
    block_type: 'referral_section',
    internal_title: 'Sección Referidos (Cards)',
    slug: 'invita-y-gana',
    preview_image_url: '',
    draft_content: {
      kicker: '// CRECÉ CON TU RED',
      title: 'INVITÁ AMIGOS. MOVÉ LA COMUNIDAD.',
      subtitle: 'Compartí tu enlace personal. Cuando tu amigo completa su primer intercambio, ambos ganan 3 días de Plus gratis.'
    },
  },
  {
    block_type: 'user_plans',
    internal_title: 'Planes usuario',
    slug: 'planes-usuario',
    preview_image_url: '',
    draft_content: {
      kicker: '// planes',
      title: 'Elige tu nivel de juego',
      subtitle: 'No pagás por usar FigusUY. Pagás por encontrar más rápido las que te faltan.',
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
      title: 'Planes para tiendas y lugares',
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
      logoText: '',
      logoAccent: '',
      logoUrl: '/logo.webp',
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
])

const POINTS_DEFAULT_BLOCKS = mapDefaultBlocks(LANDING_POINTS_PAGE_KEY, [
  {
    block_type: 'exchange_points',
    internal_title: 'Hero lugares',
    slug: 'points-hero',
    preview_image_url: '',
    draft_content: {
      kicker: '// lugares oficiales',
      title: 'Converti tu local en lugar de intercambio',
      description: 'Activa trafico real en tu zona, aparece en el mapa y sumate a la red donde los coleccionistas ya estan buscando ir.',
      image: '/assets/landing/local_intercambio.webp',
      background: '#101010',
      chips: [
        { label: 'Trafico real', tone: 'orange' },
        { label: 'Mapa oficial', tone: 'green' },
        { label: 'Activacion local', tone: 'blue' },
      ],
      cta: { label: 'Quiero ser un lugar oficial', url: 'action:business-apply', style: 'primary' },
    },
  },
  {
    block_type: 'influencers',
    internal_title: 'Programa lugares',
    slug: 'points-program',
    preview_image_url: '',
    draft_content: {
      kicker: '// programa de lugares',
      title: 'Tu tienda puede mover la red',
      description: 'No se trata solo de aparecer. Se trata de convertir tu local en una referencia para intercambios, validaciones y nuevas compras.',
      image: '/assets/landing/tienda_red.webp',
      chips: [
        { label: 'Comercios aliados', tone: 'orange' },
        { label: 'Visibilidad local', tone: 'green' },
        { label: 'Captacion directa', tone: 'blue' },
      ],
      benefits: [
        'Aparece en el mapa oficial',
        'Recibe trafico de coleccionistas cercanos',
        'Destaca promos y beneficios del local',
        'Activa tu zona con demanda real',
      ],
      primaryCta: { label: 'Unirme como lugar oficial', url: 'action:business-apply', style: 'primary' },
      secondaryCta: { label: 'Ver planes', url: '#planes-negocio', style: 'secondary' },
    },
  },
  {
    block_type: 'business_plans',
    internal_title: 'Planes lugares',
    slug: 'planes-negocio',
    preview_image_url: '',
    draft_content: {
      kicker: '// planes negocio',
      title: 'Escala tu presencia en la red',
      subtitle: 'Desde visibilidad local hasta conversion premium, elige el plan segun el nivel de activacion que quieras capturar.',
      plans: businessPlans,
    },
  },
  {
    block_type: 'final_cta',
    internal_title: 'CTA lugares',
    slug: 'points-cta',
    preview_image_url: '',
    draft_content: {
      title: 'Activa tu local donde ya existe intencion real',
      subtitle: 'Postulate hoy y empeza a captar coleccionistas en tu zona.',
      background: '#141414',
      image: '',
      cta: { label: 'Solicitar alta', url: 'action:business-apply', style: 'primary' },
    },
  },
])

const INFLUENCERS_DEFAULT_BLOCKS = mapDefaultBlocks(LANDING_INFLUENCERS_PAGE_KEY, [
  {
    block_type: 'influencer_program_hero',
    internal_title: 'Hero influencers',
    slug: 'influencer-program-hero',
    preview_image_url: '',
    draft_content: {
      badge: 'Influencer Growth Program',
      titleLineOne: 'Tu influencia vale',
      titleLineTwo: 'por resultados.',
      accentWord: 'resultados.',
      subtitle: 'Convertí tu comunidad en resultados reales. Sumate a un programa pensado para impulsar interacción, conversiones y crecimiento constante dentro de la plataforma.',
      scrollTarget: 'performance-real',
      primaryCta: { label: 'Postularme ahora', url: 'action:influencer-apply', style: 'primary' },
      secondaryCta: { label: 'Saber mas', url: '#performance-real', style: 'ghost' },
    },
  },
  {
    block_type: 'influencer_program_pillars',
    internal_title: 'Pilares influencers',
    slug: 'performance-real',
    preview_image_url: '',
    draft_content: {
      kicker: '// performance real',
      title: 'La comunidad es lo que cuenta',
      subtitle: 'En FigusUY priorizamos la actividad real, la participación y el valor que aportás a tus seguidores.',
      items: [
        {
          tag: 'Utility first',
          icon: 'analytics',
          title: 'Metricas reales',
          description: 'Sigue activaciones, conversiones y calidad de usuarios atribuidos a tu codigo.',
        },
        {
          tag: 'Trust based',
          icon: 'shield_with_heart',
          title: 'Reputacion y tiers',
          description: 'Tu progreso depende de resultados sostenidos, no de percepcion ni volumen vacio.',
        },
        {
          tag: 'Network effect',
          icon: 'groups_2',
          title: 'Red de creadores',
          description: 'Accede a beneficios y oportunidades por activar comunidad con valor economico real.',
        },
      ],
    },
  },
  {
    block_type: 'influencer_program_tiers',
    internal_title: 'Tiers influencers',
    slug: 'tiers-influencers',
    preview_image_url: '',
    draft_content: {
      title: 'Niveles de crecimiento',
      subtitle: 'Tu performance define automaticamente el tier y las condiciones del programa.',
      items: [
        {
          name: 'Community',
          commissionLabel: 'Comision base: 5% usuarios / 8% negocios',
          isFeatured: false,
          benefits: ['10+ activaciones validas', '2+ conversiones', 'Dashboard de performance'],
        },
        {
          name: 'Growth',
          commissionLabel: 'Comision: 6-7% usuarios / 10% negocios',
          isFeatured: true,
          benefits: ['40+ activaciones validas', '10+ conversiones', 'Buena retencion y progresion'],
        },
        {
          name: 'Partner',
          commissionLabel: 'Comision: 7-8% usuarios / 12% negocios',
          isFeatured: false,
          benefits: ['100+ activaciones validas', '25+ conversiones', 'Alta calidad sostenida'],
        },
      ],
    },
  },
  {
    block_type: 'influencer_program_steps',
    internal_title: 'Proceso influencers',
    slug: 'proceso-influencers',
    preview_image_url: '',
    draft_content: {
      kicker: '// proceso',
      title: 'Como entras al programa',
      items: [
        { number: '01', title: 'Postulacion', description: 'Completa tu solicitud con tus canales y contexto de comunidad.' },
        { number: '02', title: 'Curacion', description: 'Revisamos fit, autenticidad y capacidad real de activar red.' },
        { number: '03', title: 'Activacion', description: 'Recibes codigo, dashboard y objetivos para empezar a convertir.' },
      ],
    },
  },
  {
    block_type: 'faq',
    internal_title: 'FAQ influencers',
    slug: 'faq-influencers',
    preview_image_url: '',
    draft_content: {
      kicker: '// faq',
      title: 'FAQ y condiciones',
      subtitle: 'Transparencia sobre como funciona el programa y como se liquida.',
      items: [
        {
          question: 'Como se calculan los pagos?',
          answer: 'Las comisiones salen del valor neto de conversiones reales atribuidas a tu codigo. Lo ves reflejado en tu dashboard.',
        },
        {
          question: 'Como subo de tier?',
          answer: 'Subes por activacion, conversion y calidad. El sistema recalcula periodicamente y muestra que te falta para avanzar.',
        },
        {
          question: 'Hay un mínimo de seguidores para aplicar?',
          answer: 'La condición mínima es tener 1500 seguidores en cada plataforma que vayas a utilizar para promocionar la app (Instagram, TikTok y/o YouTube).',
        },
        {
          question: 'Cuando cobro?',
          answer: 'Las liquidaciones se procesan segun la configuracion activa del programa y tu saldo validado.',
        },
      ],
    },
  },
  {
    block_type: 'influencer_program_cta',
    internal_title: 'CTA influencers',
    slug: 'cta-influencers',
    preview_image_url: '',
    draft_content: {
      backgroundWord: 'Join the network',
      title: 'Estas listo?',
      subtitle: 'Unete a los creadores que estan activando el coleccionismo con performance real.',
      cta: { label: 'Enviar mi solicitud', url: 'action:influencer-apply', style: 'primary' },
    },
  },
])

export const LANDING_DEFAULT_BLOCKS_BY_PAGE = {
  [LANDING_PAGE_KEY]: OFFICIAL_DEFAULT_BLOCKS,
  [LANDING_POINTS_PAGE_KEY]: POINTS_DEFAULT_BLOCKS,
  [LANDING_INFLUENCERS_PAGE_KEY]: INFLUENCERS_DEFAULT_BLOCKS,
}

export const LANDING_DEFAULT_BLOCKS = LANDING_DEFAULT_BLOCKS_BY_PAGE[LANDING_PAGE_KEY]

export function getBlockDefinition(type) {
  return LANDING_BLOCK_LIBRARY.find((block) => block.type === type)
}

export function getLandingPageDefinition(pageKey = LANDING_PAGE_KEY) {
  return LANDING_PAGE_OPTIONS.find((page) => page.key === pageKey) || LANDING_PAGE_OPTIONS[0]
}

export function getLandingPageBlockLibrary(pageKey = LANDING_PAGE_KEY) {
  const page = getLandingPageDefinition(pageKey)
  return page.blockTypes
    .map((type) => LANDING_BLOCK_LIBRARY.find((block) => block.type === type))
    .filter(Boolean)
}

export function getDefaultBlocksForPage(pageKey = LANDING_PAGE_KEY) {
  return cloneBlockContent(LANDING_DEFAULT_BLOCKS_BY_PAGE[pageKey] || LANDING_DEFAULT_BLOCKS)
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

export function createEmptyBlock(type, pageKey = LANDING_PAGE_KEY) {
  const definition = getBlockDefinition(type)
  const base = [
    ...(LANDING_DEFAULT_BLOCKS_BY_PAGE[pageKey] || []),
    ...Object.values(LANDING_DEFAULT_BLOCKS_BY_PAGE).flat(),
  ].find((item) => item.block_type === type)

  return {
    page_key: pageKey,
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
