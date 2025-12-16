// Script de diagnostic complet
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

console.log('🔍 Diagnostic complet du système...\n');

// 1. Vérifier .env
console.log('1️⃣  Vérification du fichier .env:');
console.log('   DB_HOST:', process.env.DB_HOST || 'NON DÉFINI');
console.log('   DB_PORT:', process.env.DB_PORT || 'NON DÉFINI');
console.log('   DB_NAME:', process.env.DB_NAME || 'NON DÉFINI');
console.log('   DB_USER:', process.env.DB_USER || 'NON DÉFINI');
console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NON DÉFINI');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'DÉFINI (' + process.env.JWT_SECRET.length + ' caractères)' : 'NON DÉFINI');
console.log('');

// 2. Tester la connexion PostgreSQL
console.log('2️⃣  Test de connexion PostgreSQL...');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
});

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('   ✅ Connexion PostgreSQL réussie\n');
    
    // 3. Vérifier la table users
    console.log('3️⃣  Vérification de la table users...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('   ❌ La table users n\'existe pas!\n');
      await pool.end();
      process.exit(1);
    }
    console.log('   ✅ Table users existe\n');
    
    // 4. Lister tous les utilisateurs
    console.log('4️⃣  Liste de tous les utilisateurs:');
    const allUsers = await pool.query('SELECT id, email, name, role FROM users ORDER BY id');
    if (allUsers.rows.length === 0) {
      console.log('   ⚠️  Aucun utilisateur trouvé\n');
    } else {
      allUsers.rows.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Nom: ${user.name}, Rôle: ${user.role}`);
      });
      console.log('');
    }
    
    // 5. Vérifier/créer l'admin
    console.log('5️⃣  Vérification de l\'utilisateur admin...');
    const email = 'admin@weboost.com';
    const password = 'Admin@weBoost123';
    
    const adminCheck = await pool.query('SELECT id, email, name, role, password FROM users WHERE email = $1', [email]);
    
    if (adminCheck.rows.length === 0) {
      console.log('   ⚠️  Utilisateur admin non trouvé');
      console.log('   📝 Création de l\'utilisateur admin...');
      
      const hashedPassword = await bcrypt.hash(password, 12);
      const result = await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
        [email, hashedPassword, 'Administrateur', 'admin']
      );
      
      console.log('   ✅ Admin créé!');
      console.log(`   ID: ${result.rows[0].id}`);
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
      
      // Tester le mot de passe
      console.log('   🔐 Test du mot de passe...');
      const verifyUser = await pool.query('SELECT password FROM users WHERE email = $1', [email]);
      const isValid = await bcrypt.compare(password, verifyUser.rows[0].password);
      if (isValid) {
        console.log('   ✅ Le mot de passe est valide et fonctionne');
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
    console.log('   2. Vérifiez les logs: pm2 logs weboost-backend --lines 30');
    console.log('   3. Vérifiez que le backend écoute sur le port 5000');
    console.log('   4. Testez l\'API directement: curl http://localhost:5000/api/health');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('   Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 PostgreSQL n\'est pas démarré ou les paramètres sont incorrects.');
      console.error('   Vérifiez: sudo systemctl status postgresql');
    } else if (error.code === '28P01') {
      console.error('\n💡 Identifiants PostgreSQL incorrects.');
      console.error('   Vérifiez DB_USER et DB_PASSWORD dans backend/.env');
    } else if (error.code === '3D000') {
      console.error('\n💡 La base de données n\'existe pas.');
      console.error('   Créez-la avec: cd backend && npm run create-db');
    } else {
      console.error('\n💡 Détails:', error);
    }
    
    await pool.end();
    process.exit(1);
  }
})();

