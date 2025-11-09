# Guide de Déploiement - WeBoost Software

Ce guide vous explique comment déployer l'application WeBoost sur votre sous-domaine VANGUS.

## 📋 Prérequis

- Accès SSH à votre serveur VANGUS
- Accès à votre panneau de contrôle VANGUS
- PostgreSQL installé et configuré
- Node.js 18+ installé
- Nginx ou Apache configuré
- Certificat SSL (Let's Encrypt recommandé)

## 🚀 Étapes de Déploiement

### 1. Préparation du Serveur

#### 1.1 Connexion SSH
```bash
ssh votre-utilisateur@votre-serveur-vangus.com
```

#### 1.2 Créer le répertoire de l'application
```bash
mkdir -p /var/www/weboost
cd /var/www/weboost
```

#### 1.3 Cloner ou transférer votre code
```bash
# Option 1: Si vous utilisez Git
git clone votre-repo /var/www/weboost

# Option 2: Transférer via SCP depuis votre machine locale
# Depuis votre machine locale:
scp -r C:\Business\WeBoost\software\* votre-utilisateur@votre-serveur:/var/www/weboost/
```

### 2. Configuration de la Base de Données

#### 2.1 Créer la base de données PostgreSQL
```bash
sudo -u postgres psql
```

Dans PostgreSQL:
```sql
CREATE DATABASE weboost;
CREATE USER weboost_user WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE weboost TO weboost_user;
\q
```

#### 2.2 Configurer les variables d'environnement

Créer le fichier `.env` dans `backend/`:
```bash
cd /var/www/weboost/backend
nano .env
```

Contenu du fichier `.env`:
```env
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weboost
DB_USER=weboost_user
DB_PASSWORD=votre_mot_de_passe_securise

# Serveur
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://votre-sous-domaine.votre-domaine.com

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise_et_long

# API Keys
PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
GOOGLE_CLIENT_ID=662326679571-qcaucdpb5hj3ua1o32q9qr2b0uufiugs.apps.googleusercontent.com

# Email (pour les notifications)
SMTP_HOST=smtp.votre-provider.com
SMTP_PORT=587
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASSWORD=votre_mot_de_passe_email
SMTP_FROM=noreply@votre-domaine.com

# URL de l'API (pour les emails avec logo)
API_URL=https://votre-sous-domaine.votre-domaine.com
```

### 3. Installation des Dépendances

#### 3.1 Backend
```bash
cd /var/www/weboost/backend
npm install --production
npm run build
```

#### 3.2 Frontend
```bash
cd /var/www/weboost/frontend
npm install
npm run build
```

### 4. Configuration Nginx

Créer le fichier de configuration Nginx:
```bash
sudo nano /etc/nginx/sites-available/weboost
```

Contenu:
```nginx
server {
    listen 80;
    server_name votre-sous-domaine.votre-domaine.com;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-sous-domaine.votre-domaine.com;

    # Certificats SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/votre-sous-domaine.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-sous-domaine.votre-domaine.com/privkey.pem;

    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Taille maximale des uploads
    client_max_body_size 10M;

    # Frontend (React)
    location / {
        root /var/www/weboost/frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Fichiers statiques (uploads)
    location /uploads {
        alias /var/www/weboost/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Activer le site:
```bash
sudo ln -s /etc/nginx/sites-available/weboost /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Installation de PM2 (Gestionnaire de Processus)

```bash
sudo npm install -g pm2
```

Créer le fichier de configuration PM2:
```bash
cd /var/www/weboost
nano ecosystem.config.js
```

Contenu:
```javascript
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
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

Créer le répertoire des logs:
```bash
mkdir -p /var/www/weboost/logs
```

Démarrer l'application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Configuration SSL (Let's Encrypt)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-sous-domaine.votre-domaine.com
```

### 7. Configuration des Permissions

```bash
# Donner les permissions au répertoire uploads
sudo chown -R www-data:www-data /var/www/weboost/backend/uploads
sudo chmod -R 755 /var/www/weboost/backend/uploads

# Permissions pour l'application
sudo chown -R votre-utilisateur:votre-utilisateur /var/www/weboost
```

### 8. Configuration du Pare-feu

```bash
# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### 9. Vérification

1. Vérifier que le backend fonctionne:
```bash
pm2 status
pm2 logs weboost-backend
```

2. Vérifier Nginx:
```bash
sudo systemctl status nginx
```

3. Tester l'application:
- Ouvrir https://votre-sous-domaine.votre-domaine.com
- Vérifier que l'interface se charge
- Tester la connexion

### 10. Mise à Jour Future

Pour mettre à jour l'application:

```bash
cd /var/www/weboost

# Pull les dernières modifications (si Git)
git pull

# Rebuild backend
cd backend
npm install --production
npm run build

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Redémarrer PM2
pm2 restart weboost-backend
```

## 🔧 Configuration VANGUS Spécifique

### Si VANGUS utilise cPanel:

1. **Créer le sous-domaine** dans cPanel:
   - Allez dans "Sous-domaines"
   - Créez: `weboost.votre-domaine.com`
   - Point de document: `/public_html/weboost` ou `/home/votre-user/weboost`

2. **Base de données**:
   - Créez une base de données PostgreSQL via cPanel
   - Notez les identifiants

3. **Node.js**:
   - Vérifiez que Node.js est disponible dans cPanel
   - Si non, contactez le support VANGUS

### Si VANGUS utilise Plesk:

1. **Créer le sous-domaine** dans Plesk
2. **Installer Node.js** via l'extension Node.js de Plesk
3. **Configurer** le point d'entrée vers votre application

## 📝 Notes Importantes

- **Sécurité**: Changez tous les mots de passe par défaut
- **Backup**: Configurez des sauvegardes régulières de la base de données
- **Monitoring**: Utilisez PM2 Plus pour le monitoring
- **Logs**: Vérifiez régulièrement les logs dans `/var/www/weboost/logs`

## 🆘 Dépannage

### L'application ne démarre pas:
```bash
pm2 logs weboost-backend --lines 50
```

### Erreur de connexion à la base de données:
- Vérifiez les variables d'environnement dans `.env`
- Vérifiez que PostgreSQL est en cours d'exécution: `sudo systemctl status postgresql`

### Erreur 502 Bad Gateway:
- Vérifiez que le backend fonctionne: `pm2 status`
- Vérifiez les logs Nginx: `sudo tail -f /var/log/nginx/error.log`

## 📞 Support

En cas de problème, vérifiez:
1. Les logs PM2: `pm2 logs`
2. Les logs Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Les logs de l'application: `/var/www/weboost/logs/`



