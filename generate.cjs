const fs = require('fs');
const content = fs.readFileSync('update_pokemon_stickers.js', 'utf8');
const match = content.match(/const stickersList = (\[[\s\S]*?\]);/);
if (match) {
  const stickers = eval(match[1]);
  let sql = 'INSERT INTO album_stickers (album_id, sticker_number, name, team) VALUES\n';
  const albumId = 'a52119be-6b24-4723-a071-a859c9b7fbf3';
  const values = stickers.map(s => {
    return `('${albumId}', '${s.number.replace(/'/g, "''")}', '${s.name.replace(/'/g, "''")}', '${s.rarity.replace(/'/g, "''")}')`;
  });
  sql += values.join(',\n') + ' ON CONFLICT (album_id, sticker_number) DO UPDATE SET name = EXCLUDED.name, team = EXCLUDED.team;';
  fs.writeFileSync('insert_pokemon.sql', sql);
}
