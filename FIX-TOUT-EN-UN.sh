#!/bin/bash
# Script complet pour tout corriger en une fois
# À exécuter SUR LE SERVEUR

set -e

echo "🔧 Correction complète du serveur..."
echo ""

cd /var/www/weboost/backend

# 1. Créer le fichier .env avec les valeurs par défaut
echo "1️⃣  Création du fichier .env..."

# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)

# Créer .env avec valeurs par défaut (l'utilisateur devra peut-être ajuster le mot de passe)
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weboost
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=PLACEHOLDER
FRONTEND_URL=http://51.15.254.112
PORT=5000
NODE_ENV=production
EOF

# Remplacer le placeholder par le vrai JWT_SECRET
sed -i "s|JWT_SECRET=PLACEHOLDER|JWT_SECRET=$JWT_SECRET|" .env

echo "   ✅ Fichier .env créé"
echo "   ⚠️  Si le mot de passe PostgreSQL n'est pas 'postgres', modifiez DB_PASSWORD dans .env"
echo ""

# 2. Créer/réinitialiser l'admin
echo "2️⃣  Création/réinitialisation de l'admin..."
node << 'NODEEOF'
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || 'postgres'),
});

(async () => {
  try {
    console.log('   🔍 Connexion à la base de données...');
    await pool.query('SELECT 1');
    console.log('   ✅ Connexion réussie');
    
    const email = 'admin@weboost.com';
    const password = 'Admin@weBoost123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (check.rows.length === 0) {
      await pool.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, 'Administrateur', 'admin']);
      console.log('   ✅ Admin créé');
    } else {
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      console.log('   ✅ Mot de passe admin mis à jour');
    }
    
    console.log('   📝 Email: admin@weboost.com');
    console.log('   📝 Password: Admin@weBoost123');
    
    await pool.end();
  } catch (e) {
    console.error('   ❌ Erreur:', e.message);
    if (e.code === '28P01') {
      console.error('   💡 Le mot de passe PostgreSQL est incorrect.');
      console.error('   💡 Modifiez DB_PASSWORD dans le fichier .env');
    }
    await pool.end();
    process.exit(1);
  }
})();
NODEEOF

# 3. Redémarrer le backend
echo ""
echo "3️⃣  Redémarrage du backend..."
pm2 restart weboost-backend
sleep 5

# 4. Vérifier le statut
echo ""
echo "4️⃣  Vérification..."
pm2 status
echo ""
echo "📋 Dernières lignes des logs:"
pm2 logs weboost-backend --lines 5 --nostream

echo ""
echo "✅ Correction terminée!"
echo ""
echo "📝 Identifiants de connexion:"
echo "   Email: admin@weboost.com"
echo "   Mot de passe: Admin@weBoost123"
echo ""
echo "⚠️  Si le backend ne démarre pas, vérifiez:"
echo "   1. Le mot de passe PostgreSQL dans .env (DB_PASSWORD)"
echo "   2. Les logs: pm2 logs weboost-backend"

