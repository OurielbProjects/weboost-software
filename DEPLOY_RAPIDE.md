# 🚀 Déploiement Rapide - Scaleway

## 📋 Serveur

- **IP** : `51.15.254.112`
- **User** : `root`
- **SSH** : `ssh root@51.15.254.112`

---

## ⚡ Déploiement en 3 Commandes

### 1. Configurer le Serveur (Une Seule Fois)

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

Le script installe tout automatiquement !

---

### 2. Préparer le Fichier .env

**Sur votre machine locale** :
```bash
cd backend
cp .env.example .env
# Éditez .env avec vos configurations
```

**Variables importantes** :
- `DB_PASSWORD` : Le mot de passe PostgreSQL que vous avez entré à l'étape 1
- `JWT_SECRET` : Générez avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `SMTP_USER` et `SMTP_PASSWORD` : Vos informations email

---

### 3. Déployer l'Application

**Depuis votre machine locale** :
```bash
# PowerShell (avec Git Bash ou WSL)
bash deploy-auto.sh
```

Le script va :
- ✅ Construire le backend et le frontend
- ✅ Créer une archive
- ✅ Transférer sur le serveur
- ✅ Extraire et installer

---

### 4. Démarrer l'Application

**Sur le serveur** :
```bash
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

**Accédez à** : `http://51.15.254.112` (ou votre domaine si configuré)

**Connectez-vous** : `admin@weboost.com` / `admin123`

---

## 📖 Documentation Complète

Consultez **`DEPLOY_COMPLET.md`** pour le guide détaillé.

---

**Bon déploiement ! 🚀**




