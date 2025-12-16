#!/bin/bash

# Script de déploiement complet automatique pour Scaleway
# Ce script fait TOUT : configuration serveur + déploiement

set -e

echo "🚀 Déploiement Complet Automatique WeBoost sur Scaleway"
echo "========================================================"

# Configuration
SERVER_IP="51.15.254.112"
SERVER_USER="root"
APP_DIR="/var/www/weboost"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

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

# Vérifier que le fichier .env existe
if [ ! -f "backend/.env" ]; then
    warning "Le fichier backend/.env n'existe pas"
    if [ -f "backend/.env.example" ]; then
        info "Création du fichier .env depuis .env.example..."
        cp backend/.env.example backend/.env
        warning "⚠️  Éditez backend/.env avec vos vraies valeurs"
        warning "⚠️  Variables importantes :"
        warning "   - DB_PASSWORD : Mot de passe PostgreSQL"
        warning "   - JWT_SECRET : Générez avec : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        warning "   - SMTP_USER et SMTP_PASSWORD : Vos informations email"
        read -p "Appuyez sur Entrée quand vous avez édité le fichier .env..."
    else
        error "Fichier backend/.env.example introuvable. Créez backend/.env manuellement."
    fi
fi

info "Étape 1: Construction du backend..."
cd backend
npm install --production
npm run build
cd ..

info "Étape 2: Construction du frontend..."
cd frontend
npm install
npm run build
cd ..

info "Étape 3: Création de l'archive..."
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

info "Étape 4: Transfert vers le serveur..."
scp weboost-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

info "Étape 5: Configuration et déploiement sur le serveur..."
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
info "📋 Prochaines étapes sur le serveur :"
info ""
info "1. Connectez-vous : ssh root@51.15.254.112"
info "2. Allez dans : cd /var/www/weboost"
info "3. Démarrez avec PM2 : pm2 start ecosystem.config.js"
info "4. Sauvegardez : pm2 save"
info ""
info "📖 Consultez DEPLOY_COMPLET.md pour les instructions complètes"




