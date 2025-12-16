// Script pour créer/réinitialiser l'admin - À exécuter sur le serveur
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

async function createAdmin() {
  try {
    console.log('🔍 Connexion à la base de données...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'weboost'}`);
    
    const email = 'admin@weboost.com';
    const password = 'Admin@weBoost123';
    
    // Vérifier la connexion
    await pool.query('SELECT 1');
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier si l'utilisateur existe
    const checkResult = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    if (checkResult.rows.length === 0) {
      console.log('📝 Création de l\'utilisateur admin...');
      const result = await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [email, hashedPassword, 'Administrateur', 'admin']
      );
      console.log('✅ Utilisateur admin créé avec succès!');
      console.log('   ID:', result.rows[0].id);
    } else {
      console.log('🔄 Mise à jour du mot de passe admin...');
      console.log('   Utilisateur existant trouvé (ID:', checkResult.rows[0].id + ')');
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      console.log('✅ Mot de passe admin mis à jour avec succès!');
    }
    
    // Vérification finale
    const verifyResult = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
    const user = verifyResult.rows[0];
    
    console.log('\n📋 Informations de l\'utilisateur admin:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Nom:', user.name);
    console.log('   Rôle:', user.role);
    
    console.log('\n✅ Identifiants de connexion:');
    console.log('   Email: admin@weboost.com');
    console.log('   Mot de passe: Admin@weBoost123');
    console.log('\n🎉 Vous pouvez maintenant vous connecter!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   La connexion à la base de données a été refusée.');
      console.error('   Vérifiez que PostgreSQL est démarré et que les paramètres dans .env sont corrects.');
    } else if (error.code === '28P01') {
      console.error('   Identifiants de connexion PostgreSQL incorrects.');
      console.error('   Vérifiez DB_USER et DB_PASSWORD dans le fichier .env');
    } else if (error.code === '3D000') {
      console.error('   La base de données n\'existe pas.');
      console.error('   Créez-la d\'abord avec: npm run create-db');
    } else {
      console.error('   Détails:', error);
    }
    await pool.end();
    process.exit(1);
  }
}

createAdmin();

