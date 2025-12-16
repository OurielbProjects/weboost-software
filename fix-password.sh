#!/bin/bash

# Script pour mettre à jour le mot de passe de l'utilisateur

ssh root@51.15.254.112 << 'ENDSSH'
cd /var/www/weboost/backend

# Générer le hash du mot de passe
echo "🔐 Génération du hash du mot de passe..."
HASH=$(node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('Admin@WeBoost123', 12).then(h=>console.log(h));" 2>&1 | grep '^\$2a\$' | head -1)

if [ -z "$HASH" ]; then
    echo "❌ Erreur lors de la génération du hash"
    exit 1
fi

echo "✅ Hash généré: ${HASH:0:30}..."

# Mettre à jour le mot de passe via SQL
echo "📝 Mise à jour du mot de passe dans la base de données..."
sudo -u postgres psql -d weboost << SQL
UPDATE users 
SET password = '$HASH', 
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'admin@weboost-il.com';

SELECT id, email, name, role FROM users WHERE email = 'admin@weboost-il.com';
SQL

echo ""
echo "✅ Mot de passe mis à jour !"
ENDSSH



