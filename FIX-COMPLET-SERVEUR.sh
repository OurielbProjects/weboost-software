#!/bin/bash
# Script complet pour corriger JWT_SECRET et réinitialiser l'admin
# À exécuter SUR LE SERVEUR

set -e

echo "🔧 Correction complète du serveur..."
echo ""

cd /var/www/weboost/backend

# 1. Générer et configurer JWT_SECRET
echo "1️⃣  Configuration du JWT_SECRET..."
JWT_SECRET=$(openssl rand -base64 32)

if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env..."
    touch .env
fi

if grep -q "JWT_SECRET=" .env; then
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    echo "   ✅ JWT_SECRET mis à jour"
else
    echo "" >> .env
    echo "JWT_SECRET=$JWT_SECRET" >> .env
    echo "   ✅ JWT_SECRET ajouté"
fi

# 2. Créer/réinitialiser l'admin
echo ""
echo "2️⃣  Création/réinitialisation de l'admin..."
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
    
    await pool.end();
  } catch (e) {
    console.error('   ❌ Erreur:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
EOF

# 3. Redémarrer le backend
echo ""
echo "3️⃣  Redémarrage du backend..."
pm2 restart weboost-backend
sleep 3

# 4. Vérifier le statut
echo ""
echo "4️⃣  Vérification du statut..."
pm2 status

echo ""
echo "✅ Correction terminée!"
echo ""
echo "📝 Identifiants de connexion:"
echo "   Email: admin@weboost.com"
echo "   Mot de passe: Admin@weBoost123"
echo ""
echo "🌐 URL: http://51.15.254.112"

