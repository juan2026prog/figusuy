const fs = require('fs');
let content = fs.readFileSync('insert_pokemon.sql', 'utf8');
content = content.replace(/'0+(\d+)'/g, "'$1'");
fs.writeFileSync('insert_pokemon.sql', content);
