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

# Vérifier PostgreSQL
echo "📦 Vérification de PostgreSQL..."
if ! systemctl is-active --quiet postgresql; then
    echo "📦 Installation de PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
else
    echo "✅ PostgreSQL est déjà installé et actif"
fi

# Créer la base de données
echo "🗄️  Configuration de la base de données..."
read -sp "Mot de passe pour l'utilisateur PostgreSQL weboost_user: " DB_PASSWORD
echo ""

# Vérifier si la base existe déjà
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw weboost; then
    echo "⚠️  La base de données 'weboost' existe déjà"
    read -p "Voulez-vous la recréer ? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS weboost;
DROP USER IF EXISTS weboost_user;
CREATE DATABASE weboost;
CREATE USER weboost_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE weboost TO weboost_user;
\q
EOF
        echo "✅ Base de données recréée"
    else
        echo "✅ Utilisation de la base existante"
    fi
else
    sudo -u postgres psql << EOF
CREATE DATABASE weboost;
CREATE USER weboost_user WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE weboost TO weboost_user;
\q
EOF
    echo "✅ Base de données créée"
fi

echo ""
echo "📝 Notez ce mot de passe : $DB_PASSWORD"
echo "   Vous en aurez besoin pour le fichier .env"

# Installer PM2
echo "📦 Installation de PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✅ PM2 installé"
else
    echo "✅ PM2 est déjà installé"
fi

# Installer Nginx
echo "📦 Installation de Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo "✅ Nginx installé"
else
    echo "✅ Nginx est déjà installé"
fi

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
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads']
  }]
};
EOF

echo "✅ Configuration PM2 créée"

# Créer la configuration Nginx
echo "📝 Création de la configuration Nginx..."
read -p "Nom de domaine (ex: software.weboost-il.com) ou appuyez sur Entrée pour utiliser l'IP: " DOMAIN

if [ -z "$DOMAIN" ]; then
    DOMAIN="51.15.254.112"
fi

cat > /etc/nginx/sites-available/weboost << EOF
server {
    listen 80;
    server_name $DOMAIN;

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

# Installer Certbot pour SSL (optionnel)
echo "📦 Installation de Certbot (pour SSL)..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot installé"
else
    echo "✅ Certbot est déjà installé"
fi

echo ""
echo "=================================================="
echo "✅ Configuration terminée !"
echo "=================================================="
echo ""
echo "📝 Prochaines étapes :"
echo "1. Transférez les fichiers avec deploy-final.sh"
echo "2. Démarrez l'application : pm2 start ecosystem.config.js"
echo "3. Sauvegardez : pm2 save"
if [ "$DOMAIN" != "51.15.254.112" ]; then
    echo "4. Configurez SSL : certbot --nginx -d $DOMAIN"
fi
echo ""
echo "📖 Consultez DEPLOY_MAINTENANT.md pour plus de détails"




