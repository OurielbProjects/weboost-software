#!/bin/bash

# Script de déploiement VANGUS pour software.weboost-il.com
# À exécuter sur le serveur VANGUS

echo "🚀 Déploiement WeBoost sur VANGUS"
echo "=================================="

# Variables
PROJECT_DIR="/home/software_weboost/software"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$PROJECT_DIR" ]; then
    error "Le répertoire $PROJECT_DIR n'existe pas!"
    exit 1
fi

info "Répertoire projet: $PROJECT_DIR"

# Étape 1: Adapter le code pour MariaDB
info "Étape 1: Adaptation pour MariaDB..."
cd $BACKEND_DIR

# Remplacer la connexion database
if [ -f "src/database/connection-mariadb.ts" ]; then
    info "Remplacement de connection.ts par connection-mariadb.ts"
    cp src/database/connection.ts src/database/connection-postgres.ts.backup
    cp src/database/connection-mariadb.ts src/database/connection.ts
fi

# Remplacer l'initialisation database
if [ -f "src/database/initialize-mariadb.ts" ]; then
    info "Remplacement de initialize.ts par initialize-mariadb.ts"
    cp src/database/initialize.ts src/database/initialize-postgres.ts.backup
    cp src/database/initialize-mariadb.ts src/database/initialize.ts
fi

# Remplacer package.json
if [ -f "package-mariadb.json" ]; then
    info "Remplacement de package.json par package-mariadb.json"
    cp package.json package-postgres.json.backup
    cp package-mariadb.json package.json
fi

# Étape 2: Installer les dépendances
info "Étape 2: Installation des dépendances..."
npm install --production

if [ $? -ne 0 ]; then
    error "Erreur lors de l'installation des dépendances"
    exit 1
fi

# Étape 3: Construire le backend
info "Étape 3: Construction du backend..."
npm run build

if [ $? -ne 0 ]; then
    error "Erreur lors de la construction du backend"
    exit 1
fi

# Étape 4: Vérifier le fichier .env
info "Étape 4: Vérification du fichier .env..."
if [ ! -f "$BACKEND_DIR/.env" ]; then
    warning "Le fichier .env n'existe pas!"
    if [ -f "$BACKEND_DIR/env.vangus.production" ]; then
        info "Copie de env.vangus.production vers .env"
        cp env.vangus.production .env
        warning "⚠️  N'OUBLIEZ PAS DE MODIFIER LE FICHIER .env avec vos informations!"
    else
        error "Aucun fichier .env trouvé. Veuillez le créer manuellement."
        exit 1
    fi
else
    info "Le fichier .env existe"
fi

# Étape 5: Créer les répertoires uploads
info "Étape 5: Création des répertoires uploads..."
mkdir -p $BACKEND_DIR/uploads/logos
mkdir -p $BACKEND_DIR/uploads/contracts
mkdir -p $BACKEND_DIR/uploads/invoices
chmod -R 755 $BACKEND_DIR/uploads

# Étape 6: Initialiser la base de données
info "Étape 6: Initialisation de la base de données..."
warning "Assurez-vous que la base de données est créée et accessible"
read -p "Voulez-vous initialiser la base de données maintenant? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node dist/index.js &
    BACKEND_PID=$!
    sleep 5
    # La base de données sera initialisée au démarrage
    kill $BACKEND_PID 2>/dev/null
    info "Base de données initialisée"
fi

# Étape 7: Construire le frontend
info "Étape 7: Construction du frontend..."
cd $FRONTEND_DIR

npm install

if [ $? -ne 0 ]; then
    error "Erreur lors de l'installation des dépendances du frontend"
    exit 1
fi

npm run build

if [ $? -ne 0 ]; then
    error "Erreur lors de la construction du frontend"
    exit 1
fi

# Étape 8: Copier les fichiers frontend
info "Étape 8: Copie des fichiers frontend..."
# Ajustez le chemin selon votre configuration
PUBLIC_DIR="/home/software_weboost/public_html/software"
if [ -d "$PUBLIC_DIR" ]; then
    cp -r dist/* $PUBLIC_DIR/
    info "Fichiers frontend copiés vers $PUBLIC_DIR"
else
    warning "Le répertoire $PUBLIC_DIR n'existe pas. Veuillez copier manuellement les fichiers."
fi

# Résumé
echo ""
echo "=================================="
info "Déploiement terminé!"
echo "=================================="
echo ""
warning "N'oubliez pas de:"
echo "  1. Vérifier le fichier .env dans $BACKEND_DIR"
echo "  2. Configurer Node.js dans le panel VANGUS"
echo "  3. Démarrez l'application depuis le panel"
echo "  4. Vérifier que la base de données est accessible"
echo ""
info "Bonne chance! 🚀"

