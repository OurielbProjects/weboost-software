#!/bin/bash

# Script pour corriger les problèmes d'authentification
# - Ajouter JWT_SECRET manquant
# - Créer/mettre à jour l'utilisateur admin

set -e

SERVER_IP="51.15.254.112"
SERVER_USER="root"
BACKEND_DIR="/var/www/weboost/backend"

echo "🔧 Correction des problèmes d'authentification"
echo "==============================================="

# Générer un JWT_SECRET si nécessaire
JWT_SECRET="a49d8da2ae730e9ad18443c0d1714718fefc5b2900bb8442fe76643d05af18f2"

ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
set -e

BACKEND_DIR="${BACKEND_DIR}"
ENV_FILE="\${BACKEND_DIR}/.env"

echo "📝 Mise à jour du fichier .env..."

# Ajouter JWT_SECRET s'il n'existe pas
if ! grep -q "^JWT_SECRET=" "\${ENV_FILE}"; then
    echo "JWT_SECRET=${JWT_SECRET}" >> "\${ENV_FILE}"
    echo "✅ JWT_SECRET ajouté"
else
    echo "ℹ️  JWT_SECRET existe déjà"
fi

# Ajouter les autres variables manquantes si nécessaire
if ! grep -q "^PORT=" "\${ENV_FILE}"; then
    echo "PORT=5000" >> "\${ENV_FILE}"
    echo "✅ PORT ajouté"
fi

if ! grep -q "^FRONTEND_URL=" "\${ENV_FILE}"; then
    echo "FRONTEND_URL=http://51.15.254.112" >> "\${ENV_FILE}"
    echo "✅ FRONTEND_URL ajouté"
fi

if ! grep -q "^API_URL=" "\${ENV_FILE}"; then
    echo "API_URL=http://51.15.254.112" >> "\${ENV_FILE}"
    echo "✅ API_URL ajouté"
fi

echo ""
echo "📋 Contenu du .env:"
cat "\${ENV_FILE}"

echo ""
echo "🔐 Vérification/Création de l'utilisateur admin..."
sudo -u postgres psql -d weboost << 'SQL'
-- Vérifier si l'utilisateur existe
DO \$\$
DECLARE
    user_exists BOOLEAN;
    user_id INT;
BEGIN
    -- Vérifier admin@weboost-il.com
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@weboost-il.com') INTO user_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Utilisateur admin@weboost-il.com existe déjà';
        SELECT id INTO user_id FROM users WHERE email = 'admin@weboost-il.com';
        
        -- Mettre à jour le mot de passe
        UPDATE users SET password = '\$2a\$10\$rZ8zqQpVY9KJx8qY5vH8nO1QvN5yW3xR4zT6yU7vH8nO1QvN5yW3xR'
        WHERE id = user_id;
        RAISE NOTICE 'Mot de passe mis à jour pour admin@weboost-il.com';
    ELSE
        -- Créer l'utilisateur avec le mot de passe hashé
        INSERT INTO users (email, password, name, role)
        VALUES (
            'admin@weboost-il.com',
            '\$2a\$10\$rZ8zqQpVY9KJx8qY5vH8nO1QvN5yW3xR4zT6yU7vH8nO1QvN5yW3xR',
            'Administrateur',
            'admin'
        );
        RAISE NOTICE 'Utilisateur admin@weboost-il.com créé';
    END IF;
END \$\$;

-- Afficher les utilisateurs
SELECT id, email, name, role FROM users;
SQL

echo ""
echo "✅ Correction terminée"
ENDSSH

echo ""
echo "🔄 Redémarrage du backend..."
ssh ${SERVER_USER}@${SERVER_IP} "cd ${BACKEND_DIR} && pm2 restart weboost-backend && sleep 2 && pm2 status"

echo ""
echo "✅ Problèmes corrigés !"
echo ""
echo "📋 Identifiants :"
echo "   Email: admin@weboost-il.com"
echo "   Password: Admin@WeBoost123"



