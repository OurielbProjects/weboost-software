#!/bin/bash

# Script de configuration complète du serveur Scaleway
# À exécuter SUR LE SERVEUR après la connexion SSH

set -e

echo "🚀 Configuration du serveur Scaleway pour WeBoost"
echo "=================================================="

# Mettre à jour le système
echo "📦 Mise à jour du système..."
apt update
apt upgrade -y

# Installer les outils de base
echo "📦 Installation des outils de base..."
apt install -y curl wget git build-essential

# Installer PostgreSQL
echo "📦 Installation de PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Créer la base de données
echo "🗄️  Configuration de la base de données..."
read -p "Mot de passe pour l'utilisateur PostgreSQL weboost_user: " DB_PASSWORD

sudo -u postgres psql << EOF
CREATE DATABASE weboost;
CREATE USER weboost_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE weboost TO weboost_user;
\q
EOF

echo "✅ Base de données créée"

# Installer PM2
echo "📦 Installation de PM2..."
npm install -g pm2

# Installer Nginx
echo "📦 Installation de Nginx..."
apt install -y nginx

# Créer les répertoires
echo "📁 Création des répertoires..."
mkdir -p /var/www/weboost
mkdir -p /var/log/weboost
chown -R $USER:$USER /var/www/weboost
chown -R $USER:$USER /var/log/weboost

# Créer le fichier ecosystem.config.js
echo "📝 Création de la configuration PM2..."
cat > /var/www/weboost/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'weboost-backend',
    script: './backend/dist/index.js',
    cwd: '/var/www/weboost',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/weboost/error.log',
    out_file: '/var/log/weboost/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

echo "✅ Configuration PM2 créée"

# Créer la configuration Nginx
echo "📝 Création de la configuration Nginx..."
read -p "Nom de domaine (ex: software.weboost-il.com): " DOMAIN

cat > /etc/nginx/sites-available/weboost << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend
    location / {
        root /var/www/weboost/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /var/www/weboost/backend/uploads;
    }
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/weboost /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
nginx -t

# Redémarrer Nginx
systemctl restart nginx
systemctl enable nginx

echo "✅ Nginx configuré"

# Installer Certbot pour SSL
echo "📦 Installation de Certbot..."
apt install -y certbot python3-certbot-nginx

echo ""
echo "=================================================="
echo "✅ Configuration terminée !"
echo "=================================================="
echo ""
echo "📝 Prochaines étapes :"
echo "1. Transférez les fichiers avec deploy-scaleway.sh"
echo "2. Configurez le fichier .env dans /var/www/weboost/backend/"
echo "3. Démarrez l'application : pm2 start ecosystem.config.js"
echo "4. Configurez SSL : certbot --nginx -d $DOMAIN"
echo ""
echo "📖 Consultez DEPLOY_SCALEWAY.md pour plus de détails"




