# 🚀 Guide de Déploiement VANGUS - WeBoost Software

## Guide Spécifique pour VANGUS

Ce guide est adapté pour déployer WeBoost sur un sous-domaine VANGUS.

## 📋 Prérequis VANGUS

- Accès à votre panneau de contrôle VANGUS (cPanel ou Plesk)
- Accès SSH (si disponible)
- Sous-domaine créé (ex: `weboost.votre-domaine.com`)
- PostgreSQL disponible
- Node.js disponible (vérifier dans le panneau)

## 🎯 Étapes de Déploiement

### Étape 1: Préparer le Sous-domaine

1. **Dans votre panneau VANGUS:**
   - Allez dans "Sous-domaines" ou "Domaines"
   - Créez: `weboost.votre-domaine.com`
   - Document Root: `/home/votre-user/public_html/weboost` ou `/home/votre-user/weboost`

### Étape 2: Transférer les Fichiers

#### Option A: Via FTP/SFTP (FileZilla, WinSCP)

1. Connectez-vous à votre serveur VANGUS via FTP
2. Naviguez vers le répertoire du sous-domaine
3. Transférez tous les fichiers du projet

#### Option B: Via SSH (si disponible)

```bash
# Depuis votre machine Windows (PowerShell)
cd C:\Business\WeBoost\software
scp -r * votre-user@votre-serveur-vangus:/home/votre-user/weboost/
```

### Étape 3: Créer la Base de Données PostgreSQL

1. **Dans cPanel/Plesk:**
   - Allez dans "Bases de données PostgreSQL"
   - Créez une nouvelle base: `weboost_db`
   - Créez un utilisateur: `weboost_user`
   - Donnez tous les privilèges à l'utilisateur
   - Notez les identifiants

### Étape 4: Configurer les Variables d'Environnement

1. **Créer le fichier `.env` dans `backend/`:**

```bash
cd /home/votre-user/weboost/backend
nano .env
```

2. **Contenu du fichier `.env`:**

```env
# Base de données PostgreSQL VANGUS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weboost_db
DB_USER=weboost_user
DB_PASSWORD=votre_mot_de_passe_vangus

# Serveur
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://weboost.votre-domaine.com

# JWT Secret (générez un secret fort)
JWT_SECRET=votre_secret_jwt_tres_securise_et_long_au_moins_32_caracteres

# API Keys
PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
GOOGLE_CLIENT_ID=662326679571-qcaucdpb5hj3ua1o32q9qr2b0uufiugs.apps.googleusercontent.com

# Email SMTP
SMTP_HOST=smtp.votre-provider.com
SMTP_PORT=587
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASSWORD=votre_mot_de_passe_email
SMTP_FROM=noreply@votre-domaine.com

# URL de l'API
API_URL=https://weboost.votre-domaine.com
```

### Étape 5: Installer Node.js (si nécessaire)

**Dans cPanel:**
- Allez dans "Node.js Selector" ou "Setup Node.js App"
- Créez une nouvelle application Node.js
- Version: Node.js 18+ ou 20+
- Application Root: `/home/votre-user/weboost/backend`
- Application URL: `weboost.votre-domaine.com`
- Application Startup File: `dist/index.js`

**Dans Plesk:**
- Allez dans "Node.js"
- Créez une nouvelle application
- Configurez comme ci-dessus

### Étape 6: Build de l'Application

**Via SSH ou Terminal du panneau:**

```bash
cd /home/votre-user/weboost

# Backend
cd backend
npm install --production
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

### Étape 7: Configurer Nginx/Apache

#### Si VANGUS utilise Nginx:

Créer/modifier le fichier de configuration dans cPanel ou via SSH:

```nginx
server {
    listen 80;
    server_name weboost.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name weboost.votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/weboost.votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/weboost.votre-domaine.com/privkey.pem;

    client_max_body_size 10M;

    # Frontend
    location / {
        root /home/votre-user/weboost/frontend/dist;
        try_files $uri $uri/ /index.html;
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

    # Uploads
    location /uploads {
        alias /home/votre-user/weboost/backend/uploads;
        expires 30d;
    }
}
```

#### Si VANGUS utilise Apache (.htaccess):

Créer `.htaccess` dans le répertoire du sous-domaine:

```apache
RewriteEngine On

# Redirection HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^ /index.html [L]

# Proxy API
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]
```

### Étape 8: Démarrer l'Application

**Via cPanel Node.js Selector:**
- Démarrez l'application Node.js depuis le panneau

**Via SSH (si PM2 disponible):**
```bash
cd /home/votre-user/weboost
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

### Étape 9: Configurer SSL (Let's Encrypt)

**Dans cPanel:**
- Allez dans "SSL/TLS Status"
- Activez SSL pour `weboost.votre-domaine.com`
- Utilisez "AutoSSL" ou "Let's Encrypt"

**Via SSH:**
```bash
sudo certbot --nginx -d weboost.votre-domaine.com
```

### Étape 10: Permissions

```bash
# Permissions pour uploads
chmod -R 755 /home/votre-user/weboost/backend/uploads
chown -R votre-user:votre-user /home/votre-user/weboost/backend/uploads
```

## 🔧 Configuration Spécifique VANGUS

### Si VANGUS utilise cPanel:

1. **Node.js Selector:**
   - Créez l'application Node.js
   - Définissez le répertoire: `/home/votre-user/weboost/backend`
   - Startup File: `dist/index.js`
   - Port: `5000` (ou celui assigné par VANGUS)

2. **Cron Jobs (pour les notifications):**
   - Les notifications sont gérées par `node-cron` dans l'application
   - Pas besoin de cron externe

### Si VANGUS utilise Plesk:

1. **Extension Node.js:**
   - Installez l'extension Node.js
   - Créez l'application
   - Configurez comme ci-dessus

## 📝 Checklist de Déploiement

- [ ] Sous-domaine créé dans VANGUS
- [ ] Fichiers transférés sur le serveur
- [ ] Base de données PostgreSQL créée
- [ ] Fichier `.env` configuré dans `backend/`
- [ ] Node.js installé et configuré
- [ ] Backend buildé (`npm run build` dans `backend/`)
- [ ] Frontend buildé (`npm run build` dans `frontend/`)
- [ ] Application Node.js démarrée
- [ ] Nginx/Apache configuré
- [ ] SSL configuré
- [ ] Permissions des dossiers `uploads/` configurées
- [ ] Test de l'application: https://weboost.votre-domaine.com

## 🆘 Dépannage VANGUS

### L'application ne démarre pas:
- Vérifiez les logs dans cPanel/Plesk
- Vérifiez que le port est correct
- Vérifiez les variables d'environnement

### Erreur 502 Bad Gateway:
- Vérifiez que l'application Node.js est démarrée
- Vérifiez la configuration du proxy dans Nginx/Apache
- Vérifiez que le port backend est correct

### Erreur de base de données:
- Vérifiez les identifiants PostgreSQL dans `.env`
- Vérifiez que PostgreSQL est actif
- Vérifiez les permissions de l'utilisateur

## 📞 Support VANGUS

Si vous avez besoin d'aide:
1. Contactez le support VANGUS pour:
   - Installation de Node.js
   - Configuration PostgreSQL
   - Accès SSH (si nécessaire)
   - Configuration SSL

2. Vérifiez la documentation VANGUS pour:
   - Node.js Selector
   - PostgreSQL
   - SSL/TLS

## 🔄 Mise à Jour Future

Pour mettre à jour l'application:

```bash
cd /home/votre-user/weboost

# Pull les modifications (si Git)
git pull

# Rebuild
cd backend && npm install --production && npm run build
cd ../frontend && npm install && npm run build

# Redémarrer (via cPanel ou PM2)
# Dans cPanel: Redémarrer l'application Node.js
# Ou via SSH: pm2 restart weboost-backend
```



