// Script pour réinitialiser tous les verrouillages de compte
// Ce script doit être exécuté pendant que le serveur backend tourne

const http = require('http');

// Configuration - ajustez selon votre environnement
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // Optionnel si vous avez une route admin

console.log('Réinitialisation des verrouillages de compte...');

// Note: Comme les verrouillages sont stockés en mémoire, 
// le moyen le plus simple est de redémarrer le serveur backend.
// Sinon, vous pouvez ajouter une route admin dans auth.ts pour appeler resetAllLockouts()

console.log('⚠️  Les verrouillages sont stockés en mémoire.');
console.log('Pour réinitialiser, vous devez:');
console.log('1. Redémarrer le serveur backend, OU');
console.log('2. Utiliser la route admin /api/auth/reset-lockouts (si configurée)');

// Si vous voulez une solution immédiate, redémarrez simplement le serveur backend
process.exit(0);

