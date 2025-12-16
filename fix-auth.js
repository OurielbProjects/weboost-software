const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function fixAuth() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'weboost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔐 Génération du hash du mot de passe...');
    const hashedPassword = await bcrypt.hash('Admin@WeBoost123', 12);
    
    console.log('👤 Vérification/Création de l\'utilisateur...');
    
    // Vérifier si l'utilisateur existe
    const checkResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['admin@weboost-il.com']
    );

    if (checkResult.rows.length > 0) {
      // Mettre à jour le mot de passe
      console.log('📝 Mise à jour du mot de passe pour admin@weboost-il.com...');
      await pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [hashedPassword, 'admin@weboost-il.com']
      );
      console.log('✅ Mot de passe mis à jour');
    } else {
      // Créer l'utilisateur
      console.log('➕ Création de l\'utilisateur admin@weboost-il.com...');
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@weboost-il.com', hashedPassword, 'Administrateur', 'admin']
      );
      console.log('✅ Utilisateur créé');
    }

    // Afficher tous les utilisateurs
    const users = await pool.query('SELECT id, email, name, role FROM users');
    console.log('\n📋 Utilisateurs dans la base de données:');
    users.rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });

    await pool.end();
    console.log('\n✅ Terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    await pool.end();
    process.exit(1);
  }
}

fixAuth();



