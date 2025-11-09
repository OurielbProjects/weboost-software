#!/bin/bash

# Script de déploiement automatique
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement de WeBoost Software..."

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# Build Backend
echo -e "${YELLOW}📦 Build du backend...${NC}"
cd backend
npm install --production
npm run build
cd ..

# Build Frontend
echo -e "${YELLOW}📦 Build du frontend...${NC}"
cd frontend
npm install
npm run build
cd ..

# Redémarrer PM2
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Redémarrage de PM2...${NC}"
    pm2 restart weboost-backend || pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✅ Application redémarrée${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 n'est pas installé. Installez-le avec: npm install -g pm2${NC}"
fi

echo -e "${GREEN}✅ Déploiement terminé!${NC}"



