#!/bin/bash
# Script automatique pour créer .env avec détection automatique
# À exécuter SUR LE SERVEUR

set -e

echo "🔍 Détection automatique de la configuration PostgreSQL..."

cd /var/www/weboost/backend

# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)

# Essayer de détecter les paramètres PostgreSQL depuis les fichiers existants
# ou utiliser les valeurs par défaut
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-weboost}
DB_USER=${DB_USER:-postgres}

# Essayer de récupérer le mot de passe depuis d'anciens fichiers ou demander
if [ -f ".env.backup" ]; then
    DB_PASSWORD=$(grep "DB_PASSWORD=" .env.backup | cut -d '=' -f2)
elif [ -f "../.env" ]; then
    DB_PASSWORD=$(grep "DB_PASSWORD=" ../.env | cut -d '=' -f2)
else
    echo "⚠️  Mot de passe PostgreSQL non trouvé"
    echo "   Vous devrez le configurer manuellement dans .env"
    DB_PASSWORD="CHANGEZ_MOI"
fi

# Créer le fichier .env
cat > .env << EOF
# Base de données PostgreSQL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# Frontend URL
FRONTEND_URL=http://51.15.254.112

# Port du serveur backend
PORT=5000

# Environnement
NODE_ENV=production
EOF

echo "✅ Fichier .env créé!"
echo ""
echo "⚠️  IMPORTANT: Vérifiez et modifiez le mot de passe PostgreSQL si nécessaire:"
echo "   nano .env"
echo ""
echo "   Cherchez DB_PASSWORD et remplacez 'CHANGEZ_MOI' par votre vrai mot de passe PostgreSQL"
echo ""

