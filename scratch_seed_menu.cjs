const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if (key && val) acc[key.trim()] = val.trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function seed() {
  const updates = [
    {
      key: 'header_menu_items',
      value: JSON.stringify([
        { label: 'Álbumes', link: '/album' },
        { label: 'Intercambios', link: '/matches' },
        { label: 'Puntos', link: '/stores' }
      ]),
      type: 'json'
    },
    {
      key: 'footer_menu_items',
      value: JSON.stringify([
        { label: 'Términos', link: '/p/terminos' },
        { label: 'Privacidad', link: '/p/privacidad' },
        { label: 'Soporte', link: '/p/soporte' }
      ]),
      type: 'json'
    }
  ];

  const { data, error } = await supabase.from('site_settings').upsert(updates);
  if (error) console.error(error);
  else console.log('Successfully seeded menu items to Supabase.');
}

seed();
