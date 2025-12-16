#!/bin/bash
# Script pour générer et configurer le JWT_SECRET
# À exécuter SUR LE SERVEUR

set -e

echo "🔐 Configuration du JWT_SECRET..."

cd /var/www/weboost/backend

# Vérifier si .env existe
if [ ! -f ".env" ]; then
    echo "📝 Création du fichier .env..."
    touch .env
fi

# Générer un JWT_SECRET sécurisé
JWT_SECRET=$(openssl rand -base64 32)

echo "🔑 Génération d'un nouveau JWT_SECRET..."

# Vérifier si JWT_SECRET existe déjà dans .env
if grep -q "JWT_SECRET=" .env; then
    # Remplacer l'ancien JWT_SECRET
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    fi
    echo "✅ JWT_SECRET mis à jour dans .env"
else
    # Ajouter JWT_SECRET à la fin du fichier
    echo "" >> .env
    echo "JWT_SECRET=$JWT_SECRET" >> .env
    echo "✅ JWT_SECRET ajouté dans .env"
fi

echo ""
echo "✅ JWT_SECRET configuré: $JWT_SECRET"
echo ""
echo "🔄 Redémarrage du backend..."
pm2 restart weboost-backend

echo ""
echo "✅ Configuration terminée!"
echo "   Le backend devrait maintenant démarrer correctement"

