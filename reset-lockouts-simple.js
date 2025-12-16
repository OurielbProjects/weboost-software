// Script simple pour réinitialiser les verrouillages
// IMPORTANT: Ce script nécessite que le serveur backend soit redémarré
// car les verrouillages sont stockés en mémoire

console.log('═══════════════════════════════════════════════════════');
console.log('  RÉINITIALISATION DES VERROUILLAGES DE COMPTE');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('⚠️  Les verrouillages sont stockés en mémoire.');
console.log('');
console.log('Pour réinitialiser les verrouillages:');
console.log('');
console.log('OPTION 1 - Redémarrer le serveur backend:');
console.log('  1. Arrêtez le serveur backend (Ctrl+C)');
console.log('  2. Redémarrez-le avec: npm start (dans backend/)');
console.log('');
console.log('OPTION 2 - Utiliser la route admin (si vous êtes connecté en admin):');
console.log('  POST /api/auth/reset-lockouts');
console.log('  Headers: Authorization: Bearer <votre_token_admin>');
console.log('');
console.log('═══════════════════════════════════════════════════════');

