#!/bin/bash

# Script de déploiement automatique pour Scaleway
# Usage: ./deploy-scaleway.sh

set -e

echo "🚀 Déploiement WeBoost sur Scaleway"
echo "===================================="

# Configuration
SERVER_IP="51.15.254.112"
SERVER_USER="root"
APP_DIR="/var/www/weboost"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
NGINX_DIR="/etc/nginx/sites-available"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Exécutez ce script depuis la racine du projet"
fi

info "Préparation du déploiement..."

# Créer le fichier .env si il n'existe pas
if [ ! -f "backend/.env" ]; then
    warning "Le fichier backend/.env n'existe pas. Création d'un template..."
    cat > backend/.env << EOF
# Configuration Production Scaleway
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weboost
DB_USER=weboost_user
DB_PASSWORD=CHANGEZ_MOI
JWT_SECRET=CHANGEZ_MOI_PAR_UN_SECRET_LONG_ET_SECURISE
JWT_EXPIRES_IN=7d
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost
SMTP_HOST=c9.vangus.io
SMTP_PORT=465
SMTP_USER=votre-email@weboost-il.com
SMTP_PASSWORD=votre-mot-de-passe
SMTP_FROM=WeBoost <noreply@weboost-il.com>
SMTP_SECURE=true
PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
NODE_ENV=production
UPLOADS_DIR=$BACKEND_DIR/uploads
EOF
    warning "⚠️  Éditez backend/.env avec vos vraies valeurs avant de continuer"
    read -p "Appuyez sur Entrée quand vous avez édité le fichier .env..."
fi

info "Construction du backend..."
cd backend
npm install --production
npm run build
cd ..

info "Construction du frontend..."
cd frontend
npm install
npm run build
cd ..

info "Création de l'archive..."
tar -czf weboost-deploy.tar.gz \
    backend/dist \
    backend/package.json \
    backend/package-lock.json \
    backend/.env \
    frontend/dist \
    ecosystem.config.js \
    --exclude='node_modules' \
    --exclude='*.log' \
    --exclude='.git'

info "Transfert vers le serveur..."
scp weboost-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

info "Déploiement sur le serveur..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

APP_DIR="/var/www/weboost"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

echo "📦 Extraction de l'archive..."
mkdir -p $APP_DIR
cd $APP_DIR
tar -xzf /tmp/weboost-deploy.tar.gz
rm /tmp/weboost-deploy.tar.gz

echo "📦 Installation des dépendances backend..."
cd $BACKEND_DIR
npm install --production

echo "📁 Création des répertoires uploads..."
mkdir -p uploads/logos uploads/contracts uploads/invoices
chmod -R 755 uploads

echo "✅ Déploiement terminé !"
ENDSSH

# Nettoyer l'archive locale
rm weboost-deploy.tar.gz

info "✅ Déploiement terminé !"
info ""
info "Prochaines étapes sur le serveur :"
info "1. Configurer PostgreSQL"
info "2. Configurer Nginx"
info "3. Configurer PM2"
info "4. Démarrer l'application"
info ""
info "Consultez DEPLOY_SCALEWAY.md pour les instructions complètes"

