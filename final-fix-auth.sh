#!/bin/bash
# Script complet pour fixer l'authentification

ssh root@51.15.254.112 << 'ENDSCRIPT'
set -e

cd /var/www/weboost/backend

echo "🔐 Génération du hash du mot de passe Admin@WeBoost123..."
HASH=$(node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('Admin@WeBoost123', 12).then(h=>console.log(h));")

if [ -z "$HASH" ] || [ ! "${HASH:0:4}" = "\$2a\$" ]; then
    echo "❌ Erreur lors de la génération du hash"
    exit 1
fi

echo "✅ Hash généré avec succès"
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
echo ""
echo "🔄 Redémarrage du backend..."
pm2 restart weboost-backend
sleep 2
pm2 status

echo ""
echo "✅ Tout est prêt !"
echo "   Email: admin@weboost-il.com"
echo "   Password: Admin@WeBoost123"
ENDSCRIPT



