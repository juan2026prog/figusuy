const MONTEVIDEO_BARRIOS = [
  'Aduana', 'Aguada', 'Atahualpa', 'Bañados de Carrasco', 'Barrio Sur', 'Belvedere',
  'Brazo Oriental', 'Buceo', 'Capurro', 'Carrasco', 'Carrasco Norte', 'Casabó',
  'Casavalle', 'Centro', 'Cerro', 'Ciudad Vieja', 'Colón', 'Conciliación', 'Cordón',
  'Flor de Maroñas', 'Goes', 'Ituzaingó', 'Jardines del Hipódromo', 'La Blanqueada',
  'La Comercial', 'La Figurita', 'La Teja', 'Larrañaga', 'Las Acacias', 'Lezica',
  'Malvín', 'Malvín Norte', 'Manga', 'Maroñas', 'Melilla', 'Nuevo París', 'Palermo',
  'Parque Batlle', 'Parque Rodó', 'Paso de la Arena', 'Paso de las Duranas',
  'Paso Molino', 'Peñarol', 'Piedras Blancas', 'Pocitos', 'Prado', 'Punta Carretas',
  'Punta de Rieles', 'Punta Gorda', 'Punta Espinillo', 'Reducto', 'Santiago Vázquez',
  'Sayago', 'Tres Cruces', 'Unión', 'Villa Española', 'Villa García', 'Villa Muñoz'
]

const EXTRA_NEIGHBORHOODS = {
  Canelones: {
    'Ciudad de la Costa': [
      'Barra de Carrasco', 'Parque Carrasco', 'Shangrilá', 'San José de Carrasco',
      'Lagomar', 'Solymar', 'Lomas de Solymar', 'Médanos de Solymar', 'El Pinar'
    ],
    Atlántida: ['Atlántida', 'Villa Argentina', 'Estación Atlántida', 'Las Toscas'],
    Salinas: ['Salinas', 'Marindia', 'Pinamar', 'Neptunia'],
  },
  Maldonado: {
    Maldonado: ['Centro', 'La Sonrisa', 'Cerro Pelado', 'San Fernando', 'Pinares'],
    'Punta del Este': ['Península', 'Aidy Grill', 'Cantegril', 'San Rafael', 'Pinares'],
    'Piriápolis': ['Centro', 'Playa Grande', 'San Francisco', 'Punta Colorada'],
  },
  Colonia: {
    'Colonia del Sacramento': ['Barrio Histórico', 'Real de San Carlos', 'El General', 'Ferrando'],
  },
  Rocha: {
    Chuy: ['Chuy', 'Barra del Chuy'],
    'La Paloma': ['La Paloma', 'La Aguada', 'Costa Azul', 'Arachania'],
  },
}

const FALLBACK_TREE = {
  Artigas: {
    Artigas: ['Artigas'],
    'Bella Unión': ['Bella Unión'],
    'Baltasar Brum': ['Baltasar Brum'],
    'Tomás Gomensoro': ['Tomás Gomensoro'],
  },
  Canelones: {
    Canelones: ['Canelones'],
    'Ciudad de la Costa': EXTRA_NEIGHBORHOODS.Canelones['Ciudad de la Costa'],
    'Las Piedras': ['Las Piedras'],
    Pando: ['Pando'],
    'La Paz': ['La Paz'],
    'Santa Lucía': ['Santa Lucía'],
    Progreso: ['Progreso'],
    'Paso Carrasco': ['Paso Carrasco'],
    'Barros Blancos': ['Barros Blancos'],
    'Colonia Nicolich': ['Colonia Nicolich'],
    'San Ramón': ['San Ramón'],
    Salinas: EXTRA_NEIGHBORHOODS.Canelones.Salinas,
    'Parque del Plata': ['Parque del Plata'],
    Atlántida: EXTRA_NEIGHBORHOODS.Canelones.Atlántida,
    Sauce: ['Sauce'],
    Tala: ['Tala'],
    'San Jacinto': ['San Jacinto'],
    Toledo: ['Toledo'],
    'San Bautista': ['San Bautista'],
    'Empalme Olmos': ['Empalme Olmos'],
    Suárez: ['Suárez'],
    Soca: ['Soca'],
    Migues: ['Migues'],
    Montes: ['Montes'],
  },
  'Cerro Largo': {
    Melo: ['Melo'],
    'Río Branco': ['Río Branco'],
    'Fraile Muerto': ['Fraile Muerto'],
    'Isidoro Noblía': ['Isidoro Noblía'],
  },
  Colonia: {
    'Colonia del Sacramento': EXTRA_NEIGHBORHOODS.Colonia['Colonia del Sacramento'],
    Carmelo: ['Carmelo'],
    'Nueva Helvecia': ['Nueva Helvecia'],
    'Juan Lacaze': ['Juan Lacaze'],
    Rosario: ['Rosario'],
    'Nueva Palmira': ['Nueva Palmira'],
    Tarariras: ['Tarariras'],
    'Florencio Sánchez': ['Florencio Sánchez'],
    'Ombúes de Lavalle': ['Ombúes de Lavalle'],
    'Colonia Valdense': ['Colonia Valdense'],
  },
  Durazno: {
    Durazno: ['Durazno'],
    'Sarandí del Yí': ['Sarandí del Yí'],
    'Villa del Carmen': ['Villa del Carmen'],
    'La Paloma': ['La Paloma'],
  },
  Flores: {
    Trinidad: ['Trinidad'],
    'Ismael Cortinas': ['Ismael Cortinas'],
  },
  Florida: {
    Florida: ['Florida'],
    'Sarandí Grande': ['Sarandí Grande'],
    Casupá: ['Casupá'],
    'Fray Marcos': ['Fray Marcos'],
    '25 de Mayo': ['25 de Mayo'],
  },
  Lavalleja: {
    Minas: ['Minas'],
    'José Pedro Varela': ['José Pedro Varela'],
    'Solís de Mataojo': ['Solís de Mataojo'],
    'José Batlle y Ordóñez': ['José Batlle y Ordóñez'],
  },
  Maldonado: {
    Maldonado: EXTRA_NEIGHBORHOODS.Maldonado.Maldonado,
    'Punta del Este': EXTRA_NEIGHBORHOODS.Maldonado['Punta del Este'],
    'San Carlos': ['San Carlos'],
    'Piriápolis': EXTRA_NEIGHBORHOODS.Maldonado['Piriápolis'],
    'Pan de Azúcar': ['Pan de Azúcar'],
    Aiguá: ['Aiguá'],
    'José Ignacio': ['José Ignacio'],
    'La Barra': ['La Barra'],
    Portezuelo: ['Portezuelo'],
    'Punta Ballena': ['Punta Ballena'],
    'Las Flores': ['Las Flores'],
    'Playa Hermosa': ['Playa Hermosa'],
    'Playa Verde': ['Playa Verde'],
  },
  Montevideo: {
    Montevideo: MONTEVIDEO_BARRIOS,
  },
  Paysandú: {
    Paysandú: ['Paysandú'],
    'Nuevo Paysandú': ['Nuevo Paysandú'],
    Guichón: ['Guichón'],
    Quebracho: ['Quebracho'],
    'Piedras Coloradas': ['Piedras Coloradas'],
  },
  'Río Negro': {
    'Fray Bentos': ['Fray Bentos'],
    Young: ['Young'],
    'Nuevo Berlín': ['Nuevo Berlín'],
    'San Javier': ['San Javier'],
  },
  Rivera: {
    Rivera: ['Rivera'],
    Tranqueras: ['Tranqueras'],
    Vichadero: ['Vichadero'],
    'Minas de Corrales': ['Minas de Corrales'],
  },
  Rocha: {
    Rocha: ['Rocha'],
    Chuy: EXTRA_NEIGHBORHOODS.Rocha.Chuy,
    Castillos: ['Castillos'],
    Lascano: ['Lascano'],
    'La Paloma': EXTRA_NEIGHBORHOODS.Rocha['La Paloma'],
    'La Pedrera': ['La Pedrera'],
    'Punta del Diablo': ['Punta del Diablo'],
  },
  Salto: {
    Salto: ['Salto'],
    Constitución: ['Constitución'],
    Belén: ['Belén'],
    'San Antonio': ['San Antonio'],
  },
  'San José': {
    'San José de Mayo': ['San José de Mayo'],
    'Ciudad del Plata': ['Ciudad del Plata'],
    Libertad: ['Libertad'],
    Rodríguez: ['Rodríguez'],
    'Ecilda Paullier': ['Ecilda Paullier'],
  },
  Soriano: {
    Mercedes: ['Mercedes'],
    Dolores: ['Dolores'],
    Cardona: ['Cardona'],
    Palmitas: ['Palmitas'],
    'José Enrique Rodó': ['José Enrique Rodó'],
  },
  Tacuarembó: {
    Tacuarembó: ['Tacuarembó'],
    'Paso de los Toros': ['Paso de los Toros'],
    'San Gregorio de Polanco': ['San Gregorio de Polanco'],
    Ansina: ['Ansina'],
  },
  'Treinta y Tres': {
    'Treinta y Tres': ['Treinta y Tres'],
    Vergara: ['Vergara'],
    'Santa Clara de Olimar': ['Santa Clara de Olimar'],
    'Cerro Chato': ['Cerro Chato'],
  },
}

export const URUGUAY_LOCATIONS = Object.fromEntries(
  Object.entries(FALLBACK_TREE).map(([department, cities]) => [department, Object.keys(cities)])
)

let locationTreePromise = null

function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree))
}

function stripDiacritics(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeKey(value = '') {
  return stripDiacritics(String(value))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function toTitleCase(value = '') {
  return String(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function parseCsvLine(text) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          current += '"'
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

function mergeWithNeighborhoods(department, city) {
  const extra = EXTRA_NEIGHBORHOODS[department]?.[city]
  return extra?.length ? [...extra] : [city]
}

export async function loadUruguayLocationTree() {
  if (!locationTreePromise) {
    // Browser-side fetch to the official catalog is blocked by CORS.
    // Use the local curated tree to keep the form functional without console noise.
    locationTreePromise = Promise.resolve(cloneTree(FALLBACK_TREE))
  }

  return locationTreePromise
}

export function getDepartments(locationTree = FALLBACK_TREE) {
  return Object.keys(locationTree).sort((left, right) => left.localeCompare(right, 'es'))
}

export function getCitiesByDepartment(locationTree = FALLBACK_TREE, department = '') {
  if (!department || !locationTree[department]) return []
  return Object.keys(locationTree[department]).sort((left, right) => left.localeCompare(right, 'es'))
}

export function getNeighborhoodsByDepartmentAndCity(locationTree = FALLBACK_TREE, department = '', city = '') {
  if (!department || !locationTree[department]) return []

  const cities = locationTree[department]
  const cityEntry = Object.keys(cities).find((candidate) => normalizeKey(candidate) === normalizeKey(city))

  if (cityEntry) {
    return [...cities[cityEntry]].sort((left, right) => left.localeCompare(right, 'es'))
  }

  if (city) {
    return [city]
  }

  return []
}

export const URUGUAY_LOCATION_TREE_FALLBACK = FALLBACK_TREE
