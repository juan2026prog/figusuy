import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabase = createClient(envVars['VITE_SUPABASE_URL'], envVars['VITE_SUPABASE_ANON_KEY']);

async function getTables() {
  const tables = ['albums', 'user_albums', 'profiles', 'badges', 'stickers', 'business_profiles', 'products'];
  for (const t of tables) {
    const { data } = await supabase.from(t).select('*').limit(1);
    console.log(t, data ? Object.keys(data[0] || {}) : 'not found');
  }
}
getTables();
