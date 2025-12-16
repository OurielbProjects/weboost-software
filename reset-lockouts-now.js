// Script pour réinitialiser immédiatement tous les verrouillages
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const SECRET = 'RESET_LOCKOUTS_2024';

console.log('🔄 Réinitialisation des verrouillages de compte...');
console.log(`📍 URL du backend: ${BACKEND_URL}`);

const postData = JSON.stringify({ secret: SECRET });

const options = {
  hostname: new URL(BACKEND_URL).hostname,
  port: new URL(BACKEND_URL).port || (BACKEND_URL.includes('https') ? 443 : 80),
  path: '/api/auth/emergency-reset-lockouts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const protocol = BACKEND_URL.startsWith('https') ? require('https') : http;

const req = protocol.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Succès! Tous les verrouillages ont été réinitialisés.');
      console.log('📝 Réponse:', JSON.parse(data).message);
      console.log('');
      console.log('Vous pouvez maintenant vous connecter normalement.');
    } else {
      console.error('❌ Erreur:', res.statusCode);
      console.error('📝 Réponse:', data);
      try {
        const error = JSON.parse(data);
        console.error('💡 Message:', error.error);
      } catch (e) {
        console.error('💡 Réponse brute:', data);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur de connexion:', error.message);
  console.error('');
  console.error('💡 Vérifiez que:');
  console.error('   1. Le serveur backend est en cours d\'exécution');
  console.error('   2. L\'URL du backend est correcte (BACKEND_URL)');
  console.error('   3. Le port est correct (par défaut: 5000)');
  process.exit(1);
});

req.write(postData);
req.end();

