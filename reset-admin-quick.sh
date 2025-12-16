#!/bin/bash

# Script bash pour réinitialiser rapidement le mot de passe admin
# Usage: ./reset-admin-quick.sh

SERVER_URL="http://51.15.254.112"
SECRET="RESET_ADMIN_2024"
EMAIL="admin@weboost.com"
PASSWORD="Admin@weBoost123"

echo "🔐 Réinitialisation du mot de passe admin..."
echo ""

response=$(curl -s -X POST "$SERVER_URL/api/auth/emergency-reset-admin" \
  -H "Content-Type: application/json" \
  -d "{
    \"secret\": \"$SECRET\",
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Succès!"
  echo "$response" | grep -o '"message":"[^"]*"' | sed 's/"message":"\(.*\)"/\1/'
  echo ""
  echo "📝 Vos identifiants:"
  echo "   Email: $EMAIL"
  echo "   Mot de passe: $PASSWORD"
  echo ""
  echo "🔒 N'oubliez pas de changer le secret dans .env après!"
else
  echo ""
  echo "❌ Erreur lors de la connexion au serveur"
  echo ""
  echo "💡 Vérifiez que:"
  echo "   1. Le serveur backend est en cours d'exécution"
  echo "   2. L'URL du serveur est correcte"
  echo "   3. Vous avez accès au réseau"
fi

