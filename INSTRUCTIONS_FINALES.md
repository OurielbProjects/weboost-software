# 🚀 Instructions Finales - Déploiement Scaleway

## ✅ Fichiers Nettoyés

J'ai supprimé tous les fichiers inutiles :
- ❌ Fichiers Railway (supprimés)
- ❌ Fichiers Render (supprimés)
- ❌ Fichiers VANGUS (supprimés)
- ❌ Fichiers MariaDB (supprimés)
- ✅ Fichiers PostgreSQL (conservés - c'est l'original)

## ✅ Fichiers Créés

- ✅ `deploy-complet.sh` - Script de déploiement automatique
- ✅ `setup-scaleway.sh` - Script de configuration serveur
- ✅ `deploy.ps1` - Script PowerShell (alternative)
- ✅ `DEPLOY_FINAL.md` - Guide de déploiement
- ✅ `DEPLOY_RAPIDE.md` - Guide rapide
- ✅ `DEPLOY_COMPLET.md` - Guide détaillé
- ✅ `ecosystem.config.js` - Configuration PM2
- ✅ `backend/.env.example` - Template de configuration

---

## 🎯 Déploiement en 3 Étapes

### Étape 1 : Configurer le Serveur (Une Seule Fois)

**Connectez-vous au serveur** :
```bash
ssh root@51.15.254.112
```

**Transférez et exécutez le script** :
```bash
# Depuis votre machine locale (PowerShell)
scp setup-scaleway.sh root@51.15.254.112:/tmp/
ssh root@51.15.254.112 "chmod +x /tmp/setup-scaleway.sh && /tmp/setup-scaleway.sh"
```

Le script va :
- ✅ Installer PostgreSQL
- ✅ Créer la base de données
- ✅ Installer PM2
- ✅ Installer Nginx
- ✅ Installer Certbot (SSL)
- ✅ Configurer Nginx

**⚠️ Notez le mot de passe PostgreSQL** que vous entrez !

---

### Étape 2 : Préparer le Fichier .env

**Sur votre machine locale** :
```bash
cd backend
cp .env.example .env
```

**Éditez `.env`** avec vos configurations :

**Variables importantes** :
- `DB_PASSWORD` : Le mot de passe PostgreSQL noté à l'étape 1
- `JWT_SECRET` : Générez avec :
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `SMTP_USER` : Votre adresse email
- `SMTP_PASSWORD` : Votre mot de passe email
- `API_URL` et `FRONTEND_URL` : Votre domaine (ou `http://51.15.254.112` pour commencer)

---

### Étape 3 : Déployer l'Application

**Option A : Avec Git Bash ou WSL** (Recommandé)
```bash
bash deploy-complet.sh
```

**Option B : Avec PowerShell**
```powershell
.\deploy.ps1
```

Le script va :
- ✅ Construire le backend
- ✅ Construire le frontend
- ✅ Créer une archive
- ✅ Transférer sur le serveur
- ✅ Extraire et installer

---

### Étape 4 : Démarrer l'Application

**Sur le serveur** :
```bash
ssh root@51.15.254.112
cd /var/www/weboost
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Vérifiez** :
```bash
pm2 status
pm2 logs weboost-backend
```

---

## ✅ C'est Tout !

Votre application est maintenant en ligne !

**Accédez à** : `http://51.15.254.112` (ou votre domaine)

**Connectez-vous** : `admin@weboost.com` / `admin123`

---

## 📖 Documentation

- **`DEPLOY_FINAL.md`** ⭐ - Guide de déploiement principal
- **`DEPLOY_RAPIDE.md`** - Guide rapide
- **`DEPLOY_COMPLET.md`** - Guide détaillé complet

---

## 🔧 Commandes Utiles

### PM2
```bash
pm2 status              # Statut
pm2 logs weboost-backend # Logs
pm2 restart weboost-backend # Redémarrer
pm2 stop weboost-backend   # Arrêter
```

### Nginx
```bash
nginx -t                # Tester la configuration
systemctl restart nginx # Redémarrer
systemctl status nginx  # Voir le statut
```

### PostgreSQL
```bash
systemctl status postgresql # Statut
sudo -u postgres psql       # Se connecter
sudo -u postgres psql -d weboost # Se connecter à la base
```

---

## 🎉 Félicitations !

Votre application est prête à être déployée !

**Suivez les étapes dans `DEPLOY_FINAL.md` ! 🚀**




