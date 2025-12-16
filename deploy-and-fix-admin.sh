#!/bin/bash

# Script complet pour déployer et réinitialiser l'admin
# À exécuter SUR LE SERVEUR

set -e

echo "🚀 Déploiement et réinitialisation de l'admin..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# 1. Build du backend
echo -e "${YELLOW}📦 Build du backend...${NC}"
cd backend
npm install --production
npm run build
cd ..

# 2. Build du frontend
echo -e "${YELLOW}📦 Build du frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# 3. Créer/réinitialiser l'admin
echo -e "${YELLOW}🔐 Création/réinitialisation de l'admin...${NC}"
cd backend
if [ -f "scripts/create-admin-now.js" ]; then
    node scripts/create-admin-now.js
else
    echo -e "${YELLOW}⚠️  Script create-admin-now.js non trouvé, création directe...${NC}"
    node -e "
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
        const check = await pool.query('SELECT id FROM users WHERE email = \$1', [email]);
        if (check.rows.length === 0) {
          await pool.query('INSERT INTO users (email, password, name, role) VALUES (\$1, \$2, \$3, \$4)',
            [email, hashedPassword, 'Administrateur', 'admin']);
          console.log('✅ Admin créé');
        } else {
          await pool.query('UPDATE users SET password = \$1 WHERE email = \$2', [hashedPassword, email]);
          console.log('✅ Mot de passe admin mis à jour');
        }
        console.log('Email: admin@weboost.com');
        console.log('Password: Admin@weBoost123');
        await pool.end();
      } catch (e) {
        console.error('Erreur:', e.message);
        await pool.end();
        process.exit(1);
      }
    })();
    "
fi
cd ..

# 4. Redémarrer PM2
echo -e "${YELLOW}🔄 Redémarrage de PM2...${NC}"
if command -v pm2 &> /dev/null; then
    pm2 restart weboost-backend || pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✅ PM2 redémarré${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 n'est pas installé${NC}"
fi

# 5. Recharger Nginx
echo -e "${YELLOW}🔄 Rechargement de Nginx...${NC}"
sudo systemctl reload nginx
echo -e "${GREEN}✅ Nginx rechargé${NC}"

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo -e "${YELLOW}📝 Identifiants de connexion:${NC}"
echo "   Email: admin@weboost.com"
echo "   Mot de passe: Admin@weBoost123"
echo ""
echo -e "${YELLOW}🌐 URL: http://51.15.254.112${NC}"

