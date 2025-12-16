// Script pour générer un JWT_SECRET sécurisé
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('base64');
console.log('\n🔐 JWT_SECRET généré :\n');
console.log(secret);
console.log('\n📝 Ajoutez cette ligne à votre fichier .env :');
console.log(`JWT_SECRET=${secret}\n`);



