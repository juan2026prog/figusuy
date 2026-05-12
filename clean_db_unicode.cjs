require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or service role key if available

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to sanitize text using NFC normalization
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text.normalize('NFC');
}

// Function to check if text needs sanitization
function needsSanitization(text) {
  if (typeof text !== 'string') return false;
  return text !== text.normalize('NFC');
}

async function cleanTable(tableName, textColumns, idColumn = 'id') {
  console.log(`\n--- Cleaning table: ${tableName} ---`);
  
  // 1. Fetch all records
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

  // 2. Iterate and update if necessary
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
      // If we are updating slugs, we should be careful. The prompt says: "NO modificar slugs válidos salvo que estén corruptos."
      // `needsSanitization` already checks if the text changes when normalized. If it changes, it was corrupt (e.g. NFD instead of NFC).
      
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
  
  // Tables and their text columns to check
  // based on requirements: albums, collections, cards, descriptions, badges, labels, titles
  
  await cleanTable('albums', ['title', 'description', 'publisher', 'slug']);
  await cleanTable('badges', ['name', 'description', 'title']);
  await cleanTable('profiles', ['full_name', 'username', 'bio']);
  // Add other tables as needed based on the schema...
  
  // You might want to run a quick schema query to get all tables and text columns
  
  console.log("\nCleanup complete.");
}

run();
