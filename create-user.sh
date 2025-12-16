#!/bin/bash

# Script pour créer l'utilisateur admin avec le bon mot de passe

ssh root@51.15.254.112 << 'ENDSSH'
cd /var/www/weboost/backend

echo "🔐 Génération du hash du mot de passe..."
HASH=$(node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('Admin@WeBoost123', 12).then(h=>console.log(h));" 2>/dev/null | head -1)

if [ -z "$HASH" ]; then
    echo "❌ Erreur lors de la génération du hash"
    exit 1
fi

echo "✅ Hash généré: ${HASH:0:20}..."

echo "👤 Création/Mise à jour de l'utilisateur..."

sudo -u postgres psql -d weboost << SQL
-- Vérifier si l'utilisateur existe
DO \$\$
DECLARE
    user_exists BOOLEAN;
    user_id INT;
BEGIN
    SELECT EXISTS(SELECT 1 FROM users WHERE email = 'admin@weboost-il.com') INTO user_exists;
    
    IF user_exists THEN
        SELECT id INTO user_id FROM users WHERE email = 'admin@weboost-il.com';
        UPDATE users SET password = '$HASH', updated_at = CURRENT_TIMESTAMP WHERE id = user_id;
        RAISE NOTICE 'Mot de passe mis à jour pour admin@weboost-il.com';
    ELSE
        INSERT INTO users (email, password, name, role)
        VALUES ('admin@weboost-il.com', '$HASH', 'Administrateur', 'admin');
        RAISE NOTICE 'Utilisateur admin@weboost-il.com créé';
    END IF;
END \$\$;

-- Afficher les utilisateurs
SELECT id, email, name, role FROM users;
SQL

echo ""
echo "✅ Terminé !"
ENDSSH



