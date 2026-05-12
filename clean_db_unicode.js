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

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text.normalize('NFC');
}

function needsSanitization(text) {
  if (typeof text !== 'string') return false;
  return text !== text.normalize('NFC');
}

async function cleanTable(tableName, textColumns, idColumn = 'id') {
  console.log(`\n--- Cleaning table: ${tableName} ---`);
  
  const { data: records, error: fetchError } = await supabase
    .from(tableName)
    .select(`${idColumn}, ${textColumns.join(', ')}`);

  if (fetchError) {
    console.error(`Error fetching from ${tableName}:`, fetchError.message);
    return;
  }

  if (!records || records.length === 0) {
    console.log(`No records found in ${tableName}.`);
    return;
  }

  let updatedCount = 0;

  for (const record of records) {
    let needsUpdate = false;
    const updates = {};

    for (const col of textColumns) {
      if (record[col] && needsSanitization(record[col])) {
        updates[col] = sanitizeText(record[col]);
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idColumn, record[idColumn]);

      if (updateError) {
        console.error(`Error updating record ${record[idColumn]} in ${tableName}:`, updateError.message);
      } else {
        console.log(`Updated record ${record[idColumn]} in ${tableName}`);
        updatedCount++;
      }
    }
  }

  console.log(`Finished cleaning ${tableName}. Updated ${updatedCount} records.`);
}

async function run() {
  console.log("Starting DB Unicode Cleanup...");
  
  await cleanTable('albums', ['name', 'description', 'editorial', 'country', 'category', 'public_description']);
  await cleanTable('profiles', ['name', 'city', 'department', 'country', 'neighborhood', 'username']);
  
  console.log("\nCleanup complete.");
}

run();
