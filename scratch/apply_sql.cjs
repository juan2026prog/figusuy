const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env file for credentials
const envFile = fs.readFileSync('.env', 'utf-8');
const SUPABASE_URL = envFile.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const SUPABASE_KEY = envFile.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runUpdates() {
  console.log('Starting Supabase updates...');

  // 1. UPDATE "now" block
  console.log('Fetching "now" block...');
  const { data: nowBlocks, error: err1 } = await supabase
    .from('landing_blocks')
    .select('*')
    .eq('block_type', 'now')
    .eq('page_key', 'official');
  
  if (err1) {
    console.error('Error fetching now block:', err1);
    return;
  }

  if (nowBlocks && nowBlocks.length > 0) {
    const nowBlock = nowBlocks[0];
    let draft = nowBlock.draft_content || {};
    let pub = nowBlock.published_content || {};

    // Apply JSON updates equivalent to update_landing_copy.sql
    if (draft.cards && draft.cards[2]) {
      draft.cards[2].title = "Zonas activas";
      draft.cards[2].description = "Pocitos, Centro y Cordon siguen llenos de intercambios.";
    }
    if (draft.activityItems && draft.activityItems[0]) {
      draft.activityItems[0].title = "Mucho movimiento en Pocitos";
      draft.activityItems[0].detail = "Se siguen cerrando intercambios cerca tuyo.";
    }
    if (draft.activityItems && draft.activityItems[1]) {
      draft.activityItems[1].title = "Nueva insignia disponible";
      draft.activityItems[1].detail = "Nuevo badge para quienes ayudan a mover la comunidad.";
    }

    if (pub.cards && pub.cards[2]) {
      pub.cards[2].title = "Zonas activas";
      pub.cards[2].description = "Pocitos, Centro y Cordon siguen llenos de intercambios.";
    }
    if (pub.activityItems && pub.activityItems[0]) {
      pub.activityItems[0].title = "Mucho movimiento en Pocitos";
      pub.activityItems[0].detail = "Se siguen cerrando intercambios cerca tuyo.";
    }
    if (pub.activityItems && pub.activityItems[1]) {
      pub.activityItems[1].title = "Nueva insignia disponible";
      pub.activityItems[1].detail = "Nuevo badge para quienes ayudan a mover la comunidad.";
    }

    const { error: errUpdate } = await supabase
      .from('landing_blocks')
      .update({
        draft_content: draft,
        published_content: pub
      })
      .eq('id', nowBlock.id);
    
    if (errUpdate) console.error('Error updating "now" block:', errUpdate);
    else console.log('Successfully updated "now" block.');
  }

  // 2. RECREATE "referral_section" block
  console.log('Deleting existing referral_section blocks...');
  const { error: errDel } = await supabase
    .from('landing_blocks')
    .delete()
    .eq('block_type', 'referral_section')
    .eq('page_key', 'official');
  
  if (errDel) {
    console.error('Error deleting referral_section:', errDel);
  } else {
    console.log('Inserting new referral_section block...');
    const referralContent = {
      kicker: "// CRECÉ CON TU RED",
      title: "INVITÁ AMIGOS. MOVÉ LA COMUNIDAD.",
      subtitle: "Compartí tu enlace personal. Cuando tu amigo completa su primer intercambio, ambos ganan 3 días de Plus gratis."
    };

    const { error: errIns } = await supabase
      .from('landing_blocks')
      .insert({
        page_key: 'official',
        block_type: 'referral_section',
        internal_title: 'Sección Referidos (Cards Gaming)',
        slug: 'invita-y-gana-section',
        draft_content: referralContent,
        published_content: referralContent,
        draft_order: 75,
        published_order: 75,
        is_enabled: true
      });
    
    if (errIns) console.error('Error inserting referral_section:', errIns);
    else console.log('Successfully inserted referral_section.');
  }

  console.log('Done!');
}

runUpdates();
