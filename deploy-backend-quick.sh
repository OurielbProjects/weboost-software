#!/bin/bash

# Script de déploiement rapide du backend uniquement
# Usage: bash deploy-backend-quick.sh

set -e

SERVER_IP="51.15.254.112"
SERVER_USER="root"
BACKEND_DIR="/var/www/weboost/backend"

echo "🚀 Déploiement Backend WeBoost"
echo "==============================="

# Vérifier que le build existe
if [ ! -d "backend/dist" ]; then
    echo "❌ Le répertoire backend/dist n'existe pas. Compilez d'abord avec 'npm run build'"
    exit 1
fi

echo "✅ Backend compilé trouvé"

# Créer l'archive
echo "📦 Création de l'archive..."
cd backend
tar -czf ../weboost-backend-deploy.tar.gz \
    dist \
    package.json \
    package-lock.json \
    .env \
    --exclude='node_modules' \
    --exclude='*.log'
cd ..

echo "✅ Archive créée"

# Transférer
echo "📤 Transfert vers le serveur..."
scp weboost-backend-deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:/tmp/

echo "✅ Fichiers transférés"

# Déployer et redémarrer
echo "🚀 Déploiement et redémarrage sur le serveur..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

BACKEND_DIR="/var/www/weboost/backend"

echo "📦 Extraction de l'archive..."
cd "$BACKEND_DIR"
tar -xzf /tmp/weboost-backend-deploy.tar.gz
rm /tmp/weboost-backend-deploy.tar.gz

echo "📦 Installation des dépendances..."
npm install --production

echo "🔄 Redémarrage du backend..."
pm2 restart weboost-backend || pm2 start ecosystem.config.js
pm2 save

echo "✅ Déploiement terminé !"
echo ""
echo "📋 Statut PM2:"
pm2 status
echo ""
echo "📋 Derniers logs (15 lignes):"
pm2 logs weboost-backend --lines 15 --nostream || true
ENDSSH

# Nettoyer
rm -f weboost-backend-deploy.tar.gz

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📋 Pour voir les logs en temps réel:"
echo "   ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs weboost-backend'"



