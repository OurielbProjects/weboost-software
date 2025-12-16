// Script de diagnostic et correction complète pour l'admin
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

console.log('🔍 Diagnostic et correction de l\'admin...\n');

// Afficher les paramètres de connexion (sans le mot de passe)
console.log('📋 Paramètres de connexion:');
console.log('   DB_HOST:', process.env.DB_HOST || 'localhost (défaut)');
console.log('   DB_PORT:', process.env.DB_PORT || '5432 (défaut)');
console.log('   DB_NAME:', process.env.DB_NAME || 'weboost (défaut)');
console.log('   DB_USER:', process.env.DB_USER || 'postgres (défaut)');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'non défini');
console.log('');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function diagnoseAndFix() {
  try {
    // 1. Tester la connexion
    console.log('1️⃣  Test de connexion à PostgreSQL...');
    await pool.query('SELECT 1');
    console.log('   ✅ Connexion réussie\n');

    // 2. Vérifier que la table users existe
    console.log('2️⃣  Vérification de la table users...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ❌ La table users n\'existe pas!');
      console.log('   💡 Exécutez d\'abord: npm run create-db');
      await pool.end();
      process.exit(1);
    }
    console.log('   ✅ Table users existe\n');

    // 3. Lister tous les utilisateurs
    console.log('3️⃣  Liste des utilisateurs existants:');
    const allUsers = await pool.query('SELECT id, email, name, role FROM users ORDER BY id');
    if (allUsers.rows.length === 0) {
      console.log('   ⚠️  Aucun utilisateur trouvé dans la base de données');
    } else {
      allUsers.rows.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Nom: ${user.name}, Rôle: ${user.role}`);
      });
    }
    console.log('');

    // 4. Vérifier/créer l'admin
    const email = 'admin@weboost.com';
    const password = 'Admin@weBoost123';
    
    console.log('4️⃣  Vérification de l\'utilisateur admin...');
    const adminCheck = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
    
    if (adminCheck.rows.length === 0) {
      console.log('   ⚠️  Utilisateur admin non trouvé');
      console.log('   📝 Création de l\'utilisateur admin...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [email, hashedPassword, 'Administrateur', 'admin']
      );
      
      console.log('   ✅ Utilisateur admin créé avec succès!');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Nom: ${result.rows[0].name}`);
      console.log(`   Rôle: ${result.rows[0].role}`);
    } else {
      console.log('   ✅ Utilisateur admin trouvé');
      console.log(`   ID: ${adminCheck.rows[0].id}`);
      console.log(`   Email: ${adminCheck.rows[0].email}`);
      console.log(`   Nom: ${adminCheck.rows[0].name}`);
      console.log(`   Rôle: ${adminCheck.rows[0].role}`);
      
      console.log('   🔄 Mise à jour du mot de passe...');
      const hashedPassword = await bcrypt.hash(password, 12);
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      console.log('   ✅ Mot de passe mis à jour');
      
      // Vérifier que le mot de passe fonctionne
      console.log('   🔐 Test du mot de passe...');
      const verifyUser = await pool.query('SELECT password FROM users WHERE email = $1', [email]);
      const isValid = await bcrypt.compare(password, verifyUser.rows[0].password);
      if (isValid) {
        console.log('   ✅ Le mot de passe est valide');
      } else {
        console.log('   ❌ ERREUR: Le mot de passe ne correspond pas!');
      }
    }
    
    console.log('');
    console.log('✅ DIAGNOSTIC TERMINÉ');
    console.log('');
    console.log('📝 Identifiants de connexion:');
    console.log('   Email: admin@weboost.com');
    console.log('   Mot de passe: Admin@weBoost123');
    console.log('');
    console.log('💡 Si la connexion ne fonctionne toujours pas:');
    console.log('   1. Vérifiez que le backend est démarré: pm2 status');
    console.log('   2. Vérifiez les logs: pm2 logs weboost-backend');
    console.log('   3. Redémarrez le backend: pm2 restart weboost-backend');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL n\'est pas démarré ou les paramètres sont incorrects.');
      console.error('   Vérifiez que PostgreSQL est démarré: sudo systemctl status postgresql');
      console.error('   Vérifiez les paramètres dans backend/.env');
    } else if (error.code === '28P01') {
      console.error('\n💡 Identifiants PostgreSQL incorrects.');
      console.error('   Vérifiez DB_USER et DB_PASSWORD dans backend/.env');
    } else if (error.code === '3D000') {
      console.error('\n💡 La base de données n\'existe pas.');
      console.error('   Créez-la avec: cd backend && npm run create-db');
    } else if (error.code === '42P01') {
      console.error('\n💡 La table users n\'existe pas.');
      console.error('   Démarrez le backend une fois pour créer les tables automatiquement');
    } else {
      console.error('\n💡 Détails de l\'erreur:');
      console.error(error);
    }
    
    await pool.end();
    process.exit(1);
  }
}

diagnoseAndFix();

