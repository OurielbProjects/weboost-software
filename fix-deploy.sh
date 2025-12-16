#!/bin/bash

# Script pour corriger le déploiement

ssh root@51.15.254.112 << 'ENDSSH'
set -e

echo "🔧 Correction du déploiement..."

# Créer la base de données et l'utilisateur
echo "📦 Création de la base de données..."
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS weboost;
DROP USER IF EXISTS weboost_user;
CREATE DATABASE weboost;
CREATE USER weboost_user WITH PASSWORD 'Weboost2652@';
GRANT ALL PRIVILEGES ON DATABASE weboost TO weboost_user;
\q
EOF

echo "✅ Base de données créée"

# Mettre à jour le fichier .env
echo "📝 Mise à jour du fichier .env..."
sed -i 's/^DB_USER=.*/DB_USER=weboost_user/' /var/www/weboost/backend/.env
sed -i 's/^DB_PASSWORD=.*/DB_PASSWORD=Weboost2652@/' /var/www/weboost/backend/.env

echo "✅ Fichier .env mis à jour"

# Corriger la configuration Nginx
echo "📝 Correction de la configuration Nginx..."
cat > /etc/nginx/sites-available/weboost << 'NGINXEOF'
server {
    listen 80;
    server_name 51.15.254.112;

    location / {
        root /var/www/weboost/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/weboost/backend/uploads;
    }
}
NGINXEOF

# Activer le site
ln -sf /etc/nginx/sites-available/weboost /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester et redémarrer Nginx
nginx -t
systemctl restart nginx

echo "✅ Nginx configuré"

# Redémarrer le backend
echo "🔄 Redémarrage du backend..."
pm2 restart weboost-backend
sleep 5

echo "✅ Backend redémarré"

# Vérifier les logs
echo "📋 Vérification des logs..."
pm2 logs weboost-backend --lines 10 --nostream

echo ""
echo "✅ Correction terminée !"
echo ""
echo "Vérifiez l'application sur http://51.15.254.112"

ENDSSH




