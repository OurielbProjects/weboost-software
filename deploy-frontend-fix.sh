#!/bin/bash

# Script de déploiement du frontend avec corrections mobile
# À exécuter SUR LE SERVEUR après avoir transféré les fichiers

set -e

echo "🚀 Déploiement du frontend avec corrections mobile..."

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# Aller dans le répertoire frontend
cd frontend

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
fi

# Build du frontend
echo -e "${YELLOW}📦 Build du frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build terminé${NC}"

# Retourner à la racine
cd ..

# Vérifier que le répertoire dist existe
if [ ! -d "frontend/dist" ]; then
    echo -e "${RED}❌ Erreur: Le répertoire frontend/dist n'existe pas${NC}"
    exit 1
fi

# Redémarrer Nginx
echo -e "${YELLOW}🔄 Redémarrage de Nginx...${NC}"
sudo systemctl reload nginx

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx rechargé${NC}"
else
    echo -e "${RED}❌ Erreur lors du rechargement de Nginx${NC}"
    exit 1
fi

# Vérifier le statut
echo -e "${YELLOW}📊 Vérification du statut...${NC}"
sudo systemctl status nginx --no-pager -l | head -n 5

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "   1. Videz le cache de votre navigateur (Ctrl+Shift+R)"
echo "   2. Testez sur mobile"
echo "   3. Le header devrait maintenant être correctement positionné"

