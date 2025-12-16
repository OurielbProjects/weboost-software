# 🚀 Déploiement Final - Scaleway

## ✅ Tout est Prêt !

J'ai nettoyé tous les fichiers inutiles et créé des scripts de déploiement automatique.

---

## 🎯 Déploiement en 3 Étapes Simples

### Étape 1 : Configurer le Serveur (Une Seule Fois)

**Connectez-vous au serveur** :
```bash
ssh root@51.15.254.112
```

**Transférez et exécutez le script de configuration** :
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
- `DB_PASSWORD` : Le mot de passe PostgreSQL que vous avez noté à l'étape 1
- `JWT_SECRET` : Générez avec :
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `SMTP_USER` : Votre adresse email
- `SMTP_PASSWORD` : Votre mot de passe email
- `API_URL` et `FRONTEND_URL` : Votre domaine (ou IP pour commencer)

---

### Étape 3 : Déployer l'Application

**Depuis votre machine locale** (PowerShell avec Git Bash ou WSL) :
```bash
bash deploy-complet.sh
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

- **`DEPLOY_RAPIDE.md`** - Guide rapide
- **`DEPLOY_COMPLET.md`** - Guide détaillé complet
- **`DEPLOY_SCALEWAY.md`** - Guide Scaleway

---

## 🔧 Commandes Utiles

### PM2
```bash
pm2 status              # Statut
pm2 logs weboost-backend # Logs
pm2 restart weboost-backend # Redémarrer
```

### Nginx
```bash
nginx -t                # Tester
systemctl restart nginx # Redémarrer
```

### PostgreSQL
```bash
systemctl status postgresql # Statut
sudo -u postgres psql       # Se connecter
```

---

## 🎉 Félicitations !

Votre application est déployée sur Scaleway !

---

**Bon déploiement ! 🚀**




