# 🚀 Guide Simple - Déploiement Scaleway

## ✅ État Actuel

- ✅ **Serveur** : `51.15.254.112`
- ✅ **Node.js** : v20.19.5 installé
- ✅ **PostgreSQL** : Installé
- ✅ **Code** : Prêt (PostgreSQL)
- ✅ **Fichiers** : Nettoyés

---

## 🎯 Déploiement en 4 Étapes

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

**Le script va** :
- ✅ Installer PostgreSQL (déjà installé, va juste créer la base)
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
- `JWT_SECRET` : `a49d8da2ae730e9ad18443c0d1714718fefc5b2900bb8442fe76643d05af18f2` (déjà généré)
- `SMTP_USER` : Votre adresse email
- `SMTP_PASSWORD` : Votre mot de passe email
- `API_URL` et `FRONTEND_URL` : `http://51.15.254.112` (ou votre domaine)

---

### Étape 3 : Déployer l'Application

**Depuis votre machine locale** (Git Bash ou WSL) :
```bash
bash deploy-automatique.sh
```

**Le script va** :
- ✅ Construire le backend
- ✅ Construire le frontend
- ✅ Transférer sur le serveur
- ✅ Installer les dépendances

---

### Étape 4 : Démarrer l'Application

**Sur le serveur** :
```bash
ssh root@51.15.254.112
cd /var/www/weboost
pm2 start ecosystem.config.js
pm2 save
```

**Vérifiez** :
```bash
pm2 status
pm2 logs weboost-backend
```

---

## ✅ C'est Tout !

Votre application est maintenant en ligne !

**Accédez à** : `http://51.15.254.112`

**Connectez-vous** : `admin@weboost.com` / `admin123`

---

## 📖 Documentation

- **`DEPLOY_MAINTENANT.md`** ⭐ - Guide principal
- **`DEPLOY_COMPLET.md`** - Guide détaillé complet

---

**Bon déploiement ! 🚀**




