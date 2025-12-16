# 🚀 Guide de Déploiement Scaleway

## 📋 Informations Serveur

- **IP** : `51.15.254.112`
- **User** : `root`
- **SSH** : `ssh root@51.15.254.112`
- **Node.js** : ✅ Installé
- **Base de données** : PostgreSQL (à installer)

---

## 🎯 Déploiement Automatique

### Option 1 : Script Automatique (Recommandé)

1. **Éditez le fichier `.env`** dans `backend/` avec vos vraies valeurs
2. **Exécutez le script** :
   ```bash
   chmod +x deploy-scaleway.sh
   ./deploy-scaleway.sh
   ```

Le script va :
- ✅ Construire le backend et le frontend
- ✅ Créer une archive
- ✅ Transférer sur le serveur
- ✅ Extraire et installer

---

## 📋 Déploiement Manuel (Étape par Étape)

### Étape 1 : Préparer le Projet Localement

1. **Éditez `backend/.env`** avec vos configurations :
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=weboost
   DB_USER=weboost_user
   DB_PASSWORD=votre-mot-de-passe-postgres
   JWT_SECRET=(générez un secret long)
   JWT_EXPIRES_IN=7d
   PORT=5000
   API_URL=http://votre-domaine.com
   FRONTEND_URL=http://votre-domaine.com
   SMTP_HOST=c9.vangus.io
   SMTP_PORT=465
   SMTP_USER=votre-email@weboost-il.com
   SMTP_PASSWORD=votre-mot-de-passe-email
   SMTP_FROM=WeBoost <noreply@weboost-il.com>
   SMTP_SECURE=true
   PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
   NODE_ENV=production
   UPLOADS_DIR=/var/www/weboost/backend/uploads
   ```

2. **Construire le projet** :
   ```bash
   # Backend
   cd backend
   npm install --production
   npm run build
   cd ..
   
   # Frontend
   cd frontend
   npm install
   npm run build
   cd ..
   ```

---

### Étape 2 : Installer PostgreSQL sur le Serveur

**Connectez-vous au serveur** :
```bash
ssh root@51.15.254.112
```

**Installez PostgreSQL** :
```bash
# Ubuntu/Debian
apt update
apt install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
systemctl start postgresql
systemctl enable postgresql
```

**Créez la base de données** :
```bash
# Passer en utilisateur postgres
sudo -u postgres psql

# Dans psql, exécutez :
CREATE DATABASE weboost;
CREATE USER weboost_user WITH PASSWORD 'votre-mot-de-passe';
GRANT ALL PRIVILEGES ON DATABASE weboost TO weboost_user;
\q
```

---

### Étape 3 : Transférer les Fichiers

**Depuis votre machine locale** :
```bash
# Créer l'archive
tar -czf weboost-deploy.tar.gz \
    backend/dist \
    backend/package.json \
    backend/package-lock.json \
    backend/.env \
    frontend/dist \
    --exclude='node_modules'

# Transférer
scp weboost-deploy.tar.gz root@51.15.254.112:/tmp/
```

**Sur le serveur** :
```bash
# Créer le répertoire
mkdir -p /var/www/weboost
cd /var/www/weboost

# Extraire
tar -xzf /tmp/weboost-deploy.tar.gz
rm /tmp/weboost-deploy.tar.gz

# Créer les répertoires
mkdir -p backend/uploads/logos
mkdir -p backend/uploads/contracts
mkdir -p backend/uploads/invoices
chmod -R 755 backend/uploads
```

---

### Étape 4 : Installer les Dépendances

**Sur le serveur** :
```bash
cd /var/www/weboost/backend
npm install --production
```

---

### Étape 5 : Installer et Configurer PM2

**Installez PM2** :
```bash
npm install -g pm2
```

**Créez le fichier de configuration PM2** :
```bash
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
```

**Créez le répertoire de logs** :
```bash
mkdir -p /var/log/weboost
```

**Démarrez l'application** :
```bash
cd /var/www/weboost
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

### Étape 6 : Configurer Nginx

**Installez Nginx** :
```bash
apt install -y nginx
```

**Créez la configuration Nginx** :
```bash
cat > /etc/nginx/sites-available/weboost << 'EOF'
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Frontend
    location / {
        root /var/www/weboost/frontend/dist;
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
        alias /var/www/weboost/backend/uploads;
    }
}
EOF
```

**Activez le site** :
```bash
ln -s /etc/nginx/sites-available/weboost /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

### Étape 7 : Configurer SSL (Let's Encrypt)

**Installez Certbot** :
```bash
apt install -y certbot python3-certbot-nginx
```

**Obtenez le certificat SSL** :
```bash
certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

### Étape 8 : Vérifier le Déploiement

1. **Vérifiez PM2** :
   ```bash
   pm2 status
   pm2 logs weboost-backend
   ```

2. **Vérifiez Nginx** :
   ```bash
   systemctl status nginx
   ```

3. **Testez l'application** :
   - Ouvrez votre navigateur : `http://votre-domaine.com`
   - Connectez-vous : `admin@weboost.com` / `admin123`

---

## 🔧 Commandes Utiles

### PM2
```bash
pm2 status              # Voir le statut
pm2 logs weboost-backend  # Voir les logs
pm2 restart weboost-backend # Redémarrer
pm2 stop weboost-backend   # Arrêter
pm2 delete weboost-backend # Supprimer
```

### Nginx
```bash
nginx -t                # Tester la configuration
systemctl restart nginx # Redémarrer
systemctl status nginx  # Voir le statut
```

### PostgreSQL
```bash
systemctl status postgresql  # Voir le statut
sudo -u postgres psql        # Se connecter
```

---

## 📝 Checklist

- [ ] PostgreSQL installé et configuré
- [ ] Base de données créée
- [ ] Fichiers transférés sur le serveur
- [ ] Dépendances installées
- [ ] PM2 installé et configuré
- [ ] Application démarrée avec PM2
- [ ] Nginx installé et configuré
- [ ] SSL configuré (Let's Encrypt)
- [ ] Application accessible
- [ ] Connexion testée

---

## 🆘 Dépannage

### L'application ne démarre pas
```bash
pm2 logs weboost-backend
# Vérifiez les erreurs dans les logs
```

### Erreur de connexion à la base de données
```bash
# Vérifiez que PostgreSQL est démarré
systemctl status postgresql

# Vérifiez la connexion
sudo -u postgres psql -d weboost
```

### Nginx ne fonctionne pas
```bash
# Vérifiez la configuration
nginx -t

# Vérifiez les logs
tail -f /var/log/nginx/error.log
```

---

## 🎉 Félicitations !

Votre application est maintenant déployée sur Scaleway !

---

**Bon déploiement ! 🚀**




