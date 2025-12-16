const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function updatePassword() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'weboost',
    user: 'weboost_user',
    password: 'postgres',
  });

  try {
    console.log('🔐 Génération du hash...');
    const hash = await bcrypt.hash('Admin@WeBoost123', 12);
    
    console.log('📝 Mise à jour du mot de passe...');
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@weboost-il.com']);
    
    console.log('✅ Mot de passe mis à jour avec succès !');
    
    const result = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', ['admin@weboost-il.com']);
    console.log('\n📋 Utilisateur:');
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Nom: ${result.rows[0].name}`);
    console.log(`   Rôle: ${result.rows[0].role}`);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
    process.exit(1);
  }
}

updatePassword();



