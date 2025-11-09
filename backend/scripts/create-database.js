// Version JavaScript alternative (si TypeScript ne fonctionne pas)
const { Pool } = require('pg');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_NAME = process.env.DB_NAME || 'weboost';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';

async function createDatabase() {
  // Se connecter à PostgreSQL sans spécifier de base de données (utilise 'postgres' par défaut)
  const adminPool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres', // Base de données par défaut
    user: DB_USER,
    password: DB_PASSWORD,
  });

  try {
    console.log('🔌 Connexion à PostgreSQL...');
    
    // Vérifier si la base de données existe déjà
    const checkDb = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );

    if (checkDb.rows.length > 0) {
      console.log(`✅ La base de données "${DB_NAME}" existe déjà.`);
      await adminPool.end();
      return;
    }

    // Créer la base de données
    console.log(`📦 Création de la base de données "${DB_NAME}"...`);
    await adminPool.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`✅ Base de données "${DB_NAME}" créée avec succès !`);

    await adminPool.end();
  } catch (error) {
    console.error('❌ Erreur lors de la création de la base de données:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   → PostgreSQL n\'est pas démarré ou les paramètres de connexion sont incorrects');
      console.error(`   → Vérifiez que PostgreSQL est démarré sur ${DB_HOST}:${DB_PORT}`);
    } else if (error.code === '28P01') {
      console.error('   → Identifiants incorrects (utilisateur/mot de passe)');
      console.error(`   → Utilisateur: ${DB_USER}`);
    } else if (error.code === '3D000') {
      console.error('   → La base de données "postgres" n\'existe pas');
    } else {
      console.error(`   → Code d'erreur: ${error.code}`);
      console.error(`   → Message: ${error.message}`);
    }
    
    console.error('\n💡 Vérifiez votre fichier backend/.env avec les bonnes informations:');
    console.error(`   DB_HOST=${DB_HOST}`);
    console.error(`   DB_PORT=${DB_PORT}`);
    console.error(`   DB_USER=${DB_USER}`);
    console.error(`   DB_PASSWORD=${DB_PASSWORD ? '***' : '(non défini)'}`);
    
    await adminPool.end();
    process.exit(1);
  }
}

// Exécuter le script
createDatabase()
  .then(() => {
    console.log('\n✨ Terminé ! Vous pouvez maintenant démarrer le serveur backend.');
    console.log('   Les tables seront créées automatiquement au premier démarrage.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });



