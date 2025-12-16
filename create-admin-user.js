require('dotenv').config({ path: '/var/www/weboost/backend/.env' });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'weboost_user',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function main() {
  try {
    console.log('🔐 Génération du hash...');
    const hash = await bcrypt.hash('Admin@WeBoost123', 12);
    console.log('Hash généré');
    
    console.log('👤 Vérification de l\'utilisateur...');
    const check = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@weboost-il.com']);
    
    if (check.rows.length > 0) {
      console.log('📝 Mise à jour du mot de passe...');
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@weboost-il.com']);
      console.log('✅ Mot de passe mis à jour');
    } else {
      console.log('➕ Création de l\'utilisateur...');
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@weboost-il.com', hash, 'Administrateur', 'admin']
      );
      console.log('✅ Utilisateur créé');
    }
    
    const users = await pool.query('SELECT id, email, name, role FROM users');
    console.log('\n📋 Utilisateurs:');
    users.rows.forEach(u => console.log(`   - ${u.email} (${u.role})`));
    
    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await pool.end();
    process.exit(1);
  }
}

main();

