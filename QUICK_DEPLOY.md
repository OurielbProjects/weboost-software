# 🚀 Déploiement Rapide - VANGUS

## Guide Express pour VANGUS

### Option 1: Si vous avez accès SSH complet

1. **Transférer les fichiers**
```bash
# Depuis votre machine Windows (PowerShell)
cd C:\Business\WeBoost\software
scp -r * votre-user@votre-serveur:/var/www/weboost/
```

2. **Sur le serveur, installer et configurer**
```bash
cd /var/www/weboost

# Backend
cd backend
npm install --production
cp .env.production.example .env
nano .env  # Configurez vos variables
npm run build

# Frontend
cd ../frontend
npm install
npm run build

# PM2
cd ..
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

3. **Configurer Nginx** (voir `nginx.conf.example`)

### Option 2: Via cPanel/Plesk (VANGUS)

1. **Créer le sous-domaine** dans votre panneau
2. **Uploader les fichiers** via FTP/SFTP
3. **Créer la base de données** PostgreSQL
4. **Configurer Node.js** dans le panneau
5. **Créer le fichier `.env`** dans `backend/`
6. **Lancer les builds** via le terminal du panneau

### Checklist Rapide

- [ ] Sous-domaine créé
- [ ] Base de données PostgreSQL créée
- [ ] Fichier `.env` configuré dans `backend/`
- [ ] Backend buildé (`npm run build` dans `backend/`)
- [ ] Frontend buildé (`npm run build` dans `frontend/`)
- [ ] PM2 installé et configuré
- [ ] Nginx configuré et actif
- [ ] SSL configuré (Let's Encrypt)
- [ ] Permissions des dossiers `uploads/` configurées

### Commandes Essentielles

```bash
# Vérifier le statut
pm2 status
pm2 logs weboost-backend

# Redémarrer
pm2 restart weboost-backend

# Vérifier Nginx
sudo nginx -t
sudo systemctl status nginx

# Vérifier PostgreSQL
sudo systemctl status postgresql
```

### Support VANGUS

Si vous avez besoin d'aide spécifique à VANGUS:
- Contactez leur support pour l'installation de Node.js
- Demandez l'accès SSH si nécessaire
- Vérifiez leur documentation pour PostgreSQL



