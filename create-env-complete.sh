#!/bin/bash
# Script pour créer le fichier .env complet
# À exécuter SUR LE SERVEUR

set -e

echo "📝 Création du fichier .env..."

cd /var/www/weboost/backend

# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)

# Demander les informations PostgreSQL
echo ""
echo "🔍 Configuration de la base de données PostgreSQL..."
echo "   (Appuyez sur Entrée pour utiliser les valeurs par défaut)"
echo ""

read -p "DB_HOST [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "DB_PORT [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "DB_NAME [weboost]: " DB_NAME
DB_NAME=${DB_NAME:-weboost}

read -p "DB_USER [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "DB_PASSWORD: " DB_PASSWORD
echo ""

read -p "FRONTEND_URL [http://51.15.254.112]: " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-http://51.15.254.112}

# Créer le fichier .env
cat > .env << EOF
# Base de données PostgreSQL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Secret (généré automatiquement)
JWT_SECRET=$JWT_SECRET

# Frontend URL
FRONTEND_URL=$FRONTEND_URL

# Port du serveur backend
PORT=5000

# Environnement
NODE_ENV=production
EOF

echo ""
echo "✅ Fichier .env créé avec succès!"
echo ""
echo "🔄 Redémarrage du backend..."
pm2 restart weboost-backend

echo ""
echo "✅ Configuration terminée!"

