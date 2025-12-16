const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

async function main() {
  try {
    console.log('🔐 Génération du hash du mot de passe...');
    const hash = await bcrypt.hash('Admin@WeBoost123', 12);
    console.log('✅ Hash généré');
    
    console.log('📝 Mise à jour du mot de passe dans la base de données...');
    const sql = `UPDATE users SET password = '${hash}', updated_at = CURRENT_TIMESTAMP WHERE email = 'admin@weboost-il.com';`;
    
    execSync(`sudo -u postgres psql -d weboost -c "${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
    
    console.log('');
    console.log('✅ Mot de passe mis à jour avec succès !');
    console.log('');
    console.log('📋 Identifiants de connexion :');
    console.log('   Email: admin@weboost-il.com');
    console.log('   Password: Admin@WeBoost123');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();



