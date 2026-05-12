import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const albumId = 'a52119be-6b24-4723-a071-a859c9b7fbf3';

const stickersList = [
    { number: '001', name: 'Bulbasaur', rarity: 'Common' },
    { number: '002', name: 'Ivysaur', rarity: 'Uncommon' },
    { number: '003', name: 'Venusaur', rarity: 'Rare' },
    { number: '004', name: 'Charmander', rarity: 'Common' },
    { number: '005', name: 'Charmeleon', rarity: 'Uncommon' },
    { number: '006', name: 'Charizard', rarity: 'Rare' },
    { number: '007', name: 'Ponyta', rarity: 'Common' },
    { number: '008', name: 'Rapidash', rarity: 'Uncommon' },
    { number: '009', name: 'Litwick', rarity: 'Common' },
    { number: '010', name: 'Lampent', rarity: 'Uncommon' },
    { number: '011', name: 'Chandelure', rarity: 'Rare' },
    { number: '012', name: 'Squirtle', rarity: 'Common' },
    { number: '013', name: 'Wartortle', rarity: 'Uncommon' },
    { number: '014', name: 'Blastoise', rarity: 'Rare' },
    { number: '015', name: 'Staryu', rarity: 'Common' },
    { number: '016', name: 'Starmie', rarity: 'Rare' },
    { number: '017', name: 'Mega Starmie ex', rarity: 'Double Rare' },
    { number: '018', name: 'Psyduck', rarity: 'Common' },
    { number: '019', name: 'Golduck', rarity: 'Uncommon' },
    { number: '020', name: 'Poliwag', rarity: 'Common' },
    { number: '021', name: 'Poliwhirl', rarity: 'Uncommon' },
    { number: '022', name: 'Poliwrath', rarity: 'Rare' },
    { number: '023', name: 'Oddish', rarity: 'Common' },
    { number: '024', name: 'Gloom', rarity: 'Uncommon' },
    { number: '025', name: 'Vileplume', rarity: 'Rare' },
    { number: '026', name: 'Clefairy', rarity: 'Common' },
    { number: '027', name: 'Clefable', rarity: 'Rare' },
    { number: '028', name: 'Mega Clefable ex', rarity: 'Double Rare' },
    { number: '029', name: 'Abra', rarity: 'Common' },
    { number: '030', name: 'Kadabra', rarity: 'Uncommon' },
    { number: '031', name: 'Alakazam', rarity: 'Rare' },
    { number: '032', name: 'Gastly', rarity: 'Common' },
    { number: '033', name: 'Haunter', rarity: 'Uncommon' },
    { number: '034', name: 'Gengar', rarity: 'Rare' },
    { number: '035', name: 'Drowzee', rarity: 'Common' },
    { number: '036', name: 'Hypno', rarity: 'Uncommon' },
    { number: '037', name: 'Meowth ex', rarity: 'Double Rare' },
    { number: '038', name: 'Zubat', rarity: 'Common' },
    { number: '039', name: 'Golbat', rarity: 'Uncommon' },
    { number: '040', name: 'Crobat', rarity: 'Rare' },
    { number: '041', name: 'Magnemite', rarity: 'Common' },
    { number: '042', name: 'Magneton', rarity: 'Uncommon' },
    { number: '043', name: 'Magnezone', rarity: 'Rare' },
    { number: '044', name: 'Skarmory', rarity: 'Rare' },
    { number: '045', name: 'Mega Skarmory ex', rarity: 'Double Rare' },
    { number: '046', name: 'Aron', rarity: 'Common' },
    { number: '047', name: 'Lairon', rarity: 'Uncommon' },
    { number: '048', name: 'Aggron', rarity: 'Rare' },
    { number: '049', name: 'Dratini', rarity: 'Common' },
    { number: '050', name: 'Dragonair', rarity: 'Uncommon' },
    { number: '051', name: 'Dragonite', rarity: 'Rare' },
    { number: '052', name: 'Zygarde', rarity: 'Rare' },
    { number: '053', name: 'Mega Zygarde ex', rarity: 'Double Rare' },
    { number: '054', name: 'Eevee', rarity: 'Common' },
    { number: '055', name: 'Snorlax', rarity: 'Rare' },
    { number: '056', name: 'Pidgey', rarity: 'Common' },
    { number: '057', name: 'Pidgeotto', rarity: 'Uncommon' },
    { number: '058', name: 'Pidgeot', rarity: 'Rare' },
    { number: '059', name: 'Tyrunt', rarity: 'Common' },
    { number: '060', name: 'Tyrantrum', rarity: 'Rare' },
    { number: '061', name: 'Riolu', rarity: 'Common' },
    { number: '062', name: 'Lucario', rarity: 'Rare' },
    { number: '063', name: 'Chansey', rarity: 'Common' },
    { number: '064', name: 'Blissey', rarity: 'Rare' },
    { number: '065', name: 'Professor Sycamore', rarity: 'Uncommon' },
    { number: '066', name: 'Rosa’s Encouragement', rarity: 'Uncommon' },
    { number: '067', name: 'Jacinthe', rarity: 'Uncommon' },
    { number: '068', name: 'Mega Evolution Device', rarity: 'Trainer' },
    { number: '069', name: 'Rare Candy', rarity: 'Trainer' },
    { number: '070', name: 'Ultra Ball', rarity: 'Trainer' },
    { number: '071', name: 'Switch', rarity: 'Trainer' },
    { number: '072', name: 'Buddy-Buddy Poffin', rarity: 'Trainer' },
    { number: '073', name: 'Night Stretcher', rarity: 'Trainer' },
    { number: '074', name: 'Super Rod', rarity: 'Trainer' },
    { number: '075', name: 'Counter Gain', rarity: 'Trainer' },
    { number: '076', name: 'Town Map', rarity: 'Trainer' },
    { number: '077', name: 'Lumiose City', rarity: 'Stadium' },
    { number: '078', name: 'Mega Stadium', rarity: 'Stadium' },
    { number: '079', name: 'Basic Grass Energy', rarity: 'Energy' },
    { number: '080', name: 'Basic Fire Energy', rarity: 'Energy' },
    { number: '081', name: 'Basic Water Energy', rarity: 'Energy' },
    { number: '082', name: 'Basic Lightning Energy', rarity: 'Energy' },
    { number: '083', name: 'Basic Psychic Energy', rarity: 'Energy' },
    { number: '084', name: 'Basic Fighting Energy', rarity: 'Energy' },
    { number: '085', name: 'Basic Darkness Energy', rarity: 'Energy' },
    { number: '086', name: 'Basic Metal Energy', rarity: 'Energy' },
    { number: '087', name: 'Basic Dragon Energy', rarity: 'Energy' },
    { number: '088', name: 'Double Turbo Energy', rarity: 'Special Energy' },
    { number: '089', name: 'Clefairy', rarity: 'Illustration Rare' },
    { number: '090', name: 'Tyrunt', rarity: 'Illustration Rare' },
    { number: '091', name: 'Riolu', rarity: 'Illustration Rare' },
    { number: '092', name: 'Dragonair', rarity: 'Illustration Rare' },
    { number: '093', name: 'Snorlax', rarity: 'Illustration Rare' },
    { number: '094', name: 'Clefairy', rarity: 'Illustration Rare' },
    { number: '095', name: 'Gengar', rarity: 'Illustration Rare' },
    { number: '096', name: 'Chandelure', rarity: 'Illustration Rare' },
    { number: '097', name: 'Lucario', rarity: 'Illustration Rare' },
    { number: '098', name: 'Dragonite', rarity: 'Illustration Rare' },
    { number: '099', name: 'Mega Starmie ex', rarity: 'Ultra Rare' },
    { number: '100', name: 'Mega Clefable ex', rarity: 'Ultra Rare' },
    { number: '101', name: 'Mega Skarmory ex', rarity: 'Ultra Rare' },
    { number: '102', name: 'Mega Zygarde ex', rarity: 'Ultra Rare' },
    { number: '103', name: 'Meowth ex', rarity: 'Ultra Rare' },
    { number: '104', name: 'Mega Starmie ex', rarity: 'Special Illustration Rare' },
    { number: '105', name: 'Mega Clefable ex', rarity: 'Special Illustration Rare' },
    { number: '106', name: 'Mega Zygarde ex', rarity: 'Special Illustration Rare' },
    { number: '107', name: 'Meowth ex', rarity: 'Special Illustration Rare' },
    { number: '108', name: 'Rosa’s Encouragement', rarity: 'Special Illustration Rare' },
    { number: '109', name: 'Jacinthe', rarity: 'Special Illustration Rare' },
    { number: '110', name: 'Mega Evolution Device', rarity: 'Hyper Rare' },
    { number: '111', name: 'Ultra Ball', rarity: 'Hyper Rare' },
    { number: '112', name: 'Rare Candy', rarity: 'Hyper Rare' },
    { number: '113', name: 'Buddy-Buddy Poffin', rarity: 'Hyper Rare' },
    { number: '114', name: 'Mega Starmie ex', rarity: 'Gold Hyper Rare' },
    { number: '115', name: 'Mega Clefable ex', rarity: 'Gold Hyper Rare' },
    { number: '116', name: 'Mega Skarmory ex', rarity: 'Gold Hyper Rare' },
    { number: '117', name: 'Mega Zygarde ex', rarity: 'Gold Hyper Rare' },
    { number: '118', name: 'Mega Starmie ex', rarity: 'SIR' },
    { number: '119', name: 'Mega Clefable ex', rarity: 'SIR' },
    { number: '120', name: 'Mega Zygarde ex', rarity: 'SIR' },
    { number: '121', name: 'Meowth ex', rarity: 'SIR' },
    { number: '122', name: 'Jacinthe', rarity: 'SIR' },
    { number: '123', name: 'Rosa’s Encouragement', rarity: 'SIR' },
    { number: '124', name: 'Mega Zygarde ex', rarity: 'Mega Hyper Rare' }
];

async function updateAlbum() {
    // 1. Update album to mark it as having detailed stickers and set count to 124
    const { error: albumError } = await supabase
        .from('albums')
        .update({
            has_detailed_stickers: true,
            total_stickers: 124
        })
        .eq('id', albumId);
        
    if (albumError) {
        console.error('Error updating album:', albumError);
        return;
    }
    
    // 2. Clear existing stickers for this album (to avoid duplicates or messy merges)
    await supabase.from('album_stickers').delete().eq('album_id', albumId);
    
    // 3. Insert new stickers
    const stickersToInsert = stickersList.map(s => ({
        album_id: albumId,
        sticker_number: parseInt(s.number, 10).toString(),
        name: s.name,
        team: s.rarity, // Reusing team column for rarity as commonly done in this app if a rarity column is missing
        
        
    }));
    
    const { error: stickersError } = await supabase
        .from('album_stickers')
        .insert(stickersToInsert);
        
    if (stickersError) {
        console.error('Error inserting stickers:', stickersError);
    } else {
        console.log('Successfully updated album and stickers');
    }
}

updateAlbum();
