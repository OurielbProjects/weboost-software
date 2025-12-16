// Script pour réinitialiser le mot de passe admin
// Usage: node backend/scripts/reset-admin-password.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function resetAdminPassword() {
  try {
    console.log('🔍 Vérification de l\'utilisateur admin...');
    
    // Vérifier si l'utilisateur existe
    const userResult = await pool.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      ['admin@weboost.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Utilisateur admin@weboost.com non trouvé');
      console.log('📝 Création d\'un nouvel utilisateur admin...');
      
      const hashedPassword = await bcrypt.hash('Admin@weBoost123', 12);
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@weboost.com', hashedPassword, 'Administrateur', 'admin']
      );
      
      console.log('✅ Utilisateur admin créé avec succès!');
      console.log('   Email: admin@weboost.com');
      console.log('   Mot de passe: Admin@weBoost123');
    } else {
      console.log('✅ Utilisateur trouvé:', userResult.rows[0]);
      console.log('🔄 Réinitialisation du mot de passe...');
      
      const hashedPassword = await bcrypt.hash('Admin@weBoost123', 12);
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, 'admin@weboost.com']
      );
      
      console.log('✅ Mot de passe réinitialisé avec succès!');
      console.log('   Email: admin@weboost.com');
      console.log('   Nouveau mot de passe: Admin@weBoost123');
    }

    // Afficher tous les admins
    const adminsResult = await pool.query(
      'SELECT id, email, name, role FROM users WHERE role = $1',
      ['admin']
    );
    
    console.log('\n📋 Liste des administrateurs:');
    adminsResult.rows.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.name})`);
    });

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

resetAdminPassword();

