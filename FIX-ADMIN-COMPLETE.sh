#!/bin/bash
# Script complet pour réinitialiser l'admin - À exécuter SUR LE SERVEUR
# Usage: bash FIX-ADMIN-COMPLETE.sh

set -e

echo "🔐 Réinitialisation complète de l'admin..."
echo ""

cd /var/www/weboost/backend

# Vérifier que .env existe
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env non trouvé dans /var/www/weboost/backend/"
    echo "   Créez-le d'abord avec les paramètres de connexion PostgreSQL"
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env | grep -v '^#' | xargs)

# Créer le script inline
node << 'EOF'
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

(async () => {
  try {
    console.log('🔍 Connexion à la base de données...');
    await pool.query('SELECT 1');
    console.log('✅ Connexion réussie');
    
    const email = 'admin@weboost.com';
    const password = 'Admin@weBoost123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const check = await pool.query('SELECT id, email, role FROM users WHERE email = $1', [email]);
    
    if (check.rows.length === 0) {
      console.log('📝 Création de l\'utilisateur admin...');
      const result = await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [email, hashedPassword, 'Administrateur', 'admin']
      );
      console.log('✅ Admin créé (ID:', result.rows[0].id + ')');
    } else {
      console.log('🔄 Mise à jour du mot de passe...');
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      console.log('✅ Mot de passe mis à jour');
    }
    
    const verify = await pool.query('SELECT id, email, name, role FROM users WHERE email = $1', [email]);
    console.log('\n📋 Utilisateur admin:');
    console.log('   ID:', verify.rows[0].id);
    console.log('   Email:', verify.rows[0].email);
    console.log('   Nom:', verify.rows[0].name);
    console.log('   Rôle:', verify.rows[0].role);
    
    console.log('\n✅ Identifiants de connexion:');
    console.log('   Email: admin@weboost.com');
    console.log('   Mot de passe: Admin@weBoost123');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   PostgreSQL n\'est pas démarré ou les paramètres sont incorrects');
    } else if (error.code === '28P01') {
      console.error('   Identifiants PostgreSQL incorrects dans .env');
    } else if (error.code === '3D000') {
      console.error('   La base de données n\'existe pas');
    }
    await pool.end();
    process.exit(1);
  }
})();
EOF

echo ""
echo "✅ Réinitialisation terminée!"
echo ""
echo "🔄 Redémarrage du backend..."
pm2 restart weboost-backend || echo "⚠️  PM2 non disponible, redémarrez manuellement"

echo ""
echo "🎉 Terminé! Vous pouvez maintenant vous connecter avec:"
echo "   Email: admin@weboost.com"
echo "   Mot de passe: Admin@weBoost123"

