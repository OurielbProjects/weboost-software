// Script direct pour créer/réinitialiser l'admin
// À exécuter directement sur le serveur ou localement avec les bonnes variables d'environnement

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function createAdmin() {
  try {
    console.log('🔍 Connexion à la base de données...');
    
    const email = 'admin@weboost.com';
    const password = 'Admin@weBoost123';
    
    // Vérifier si l'utilisateur existe
    const checkResult = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (checkResult.rows.length === 0) {
      console.log('📝 Création de l\'utilisateur admin...');
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, 'Administrateur', 'admin']
      );
      console.log('✅ Utilisateur admin créé avec succès!');
    } else {
      console.log('🔄 Mise à jour du mot de passe admin...');
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      console.log('✅ Mot de passe admin mis à jour avec succès!');
    }
    
    // Vérifier
    const verifyResult = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
    console.log('\n📋 Utilisateur admin:');
    console.log('   ID:', verifyResult.rows[0].id);
    console.log('   Email:', verifyResult.rows[0].email);
    console.log('   Nom:', verifyResult.rows[0].name);
    console.log('   Rôle:', verifyResult.rows[0].role);
    
    console.log('\n✅ Identifiants de connexion:');
    console.log('   Email: admin@weboost.com');
    console.log('   Mot de passe: Admin@weBoost123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();

