# 🚀 Déploiement Railway.app - Guide Rapide

## ✅ Prêt pour Railway !

Le code est maintenant adapté pour Railway.app avec PostgreSQL.

---

## 📋 Étapes de Déploiement

### 1. Préparer le Code sur GitHub

```bash
git init
git add .
git commit -m "Ready for Railway deployment"
git remote add origin https://github.com/VOTRE-USERNAME/weboost-software.git
git push -u origin main
```

### 2. Créer un Compte Railway

1. Allez sur https://railway.app
2. Cliquez sur "Login with GitHub"
3. Autorisez Railway à accéder à vos repositories

### 3. Créer un Projet et Ajouter PostgreSQL

1. Cliquez sur "New Project"
2. Cliquez sur "New" → "Database" → "PostgreSQL"
3. Railway crée automatiquement la base de données

### 4. Déployer le Backend

1. Cliquez sur "New" → "GitHub Repo"
2. Sélectionnez votre repository
3. Railway détecte automatiquement Node.js
4. **Configurez** :
   - **Root Directory**: `backend`
   - Railway détecte automatiquement `package.json`

5. **Ajoutez les Variables d'Environnement** :

   **Base de Données (utilisez les références Railway) :**
   ```
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

   **JWT :**
   ```
   JWT_SECRET=(générez un secret long - 64 caractères)
   JWT_EXPIRES_IN=7d
   ```

   **Port (automatique) :**
   ```
   PORT=${{PORT}}
   ```

   **URLs :**
   ```
   API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   ```

   **Email SMTP :**
   ```
   SMTP_HOST=c9.vangus.io
   SMTP_PORT=465
   SMTP_USER=votre-email@weboost-il.com
   SMTP_PASSWORD=votre-mot-de-passe
   SMTP_FROM=WeBoost <noreply@weboost-il.com>
   SMTP_SECURE=true
   ```

   **API :**
   ```
   PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
   ```

   **Environnement :**
   ```
   NODE_ENV=production
   ```

6. **Générez un Domaine** :
   - Allez dans "Settings" → "Networking"
   - Cliquez sur "Generate Domain"
   - Notez le domaine (ex: `backend-production.up.railway.app`)

### 5. Déployer le Frontend

#### Option A : Sur Vercel (Recommandé)

1. Allez sur https://vercel.com
2. Connectez votre GitHub
3. Importez le projet
4. Configurez :
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Ajoutez la variable :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```
6. Déployez !

#### Option B : Sur Railway

1. Dans Railway, cliquez sur "New" → "GitHub Repo"
2. Sélectionnez le même repository
3. Configurez :
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -p $PORT`
4. Ajoutez la variable :
   ```
   VITE_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

### 6. Tester

1. Accédez au frontend
2. Connectez-vous :
   - Email: `admin@weboost.com`
   - Password: `admin123`

---

## 📝 Fichiers Créés

- ✅ `railway.json` - Configuration Railway
- ✅ `Procfile` - Commandes de démarrage
- ✅ `.railwayignore` - Fichiers à ignorer
- ✅ `backend/nixpacks.toml` - Configuration Nixpacks
- ✅ `backend/railway-start.sh` - Script de démarrage
- ✅ `DEPLOY_RAILWAY_ETAPES.md` - Guide détaillé

---

## 🎯 Avantages Railway

- ✅ PostgreSQL inclus
- ✅ Déploiement automatique
- ✅ SSL automatique
- ✅ Monitoring intégré
- ✅ Logs en temps réel
- ✅ Scaling automatique

---

## 💰 Coût

- **Gratuit** : 500 heures/mois
- **Starter** : $5/mois
- **Developer** : $20/mois

---

**Consultez `DEPLOY_RAILWAY_ETAPES.md` pour le guide complet ! 🚀**

