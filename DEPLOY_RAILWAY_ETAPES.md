# 🚀 Déploiement sur Railway.app - Guide Étape par Étape

## ✅ Préparation

Tous les fichiers sont prêts ! Le code fonctionne avec PostgreSQL (Railway le supporte nativement).

---

## 📋 Étape 1 : Préparer le Code sur GitHub

### Si votre code n'est pas encore sur GitHub :

1. **Créez un repository sur GitHub** :
   - Allez sur https://github.com
   - Cliquez sur "New repository"
   - Nommez-le (ex: `weboost-software`)
   - **Ne cochez PAS** "Initialize with README"
   - Créez le repository

2. **Push votre code** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ready for Railway deployment"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USERNAME/weboost-software.git
   git push -u origin main
   ```

### Si votre code est déjà sur GitHub :

✅ Parfait ! Passez à l'étape 2.

---

## 🚀 Étape 2 : Créer un Compte Railway

1. **Allez sur https://railway.app**
2. **Cliquez sur "Start a New Project"** ou **"Login"**
3. **Connectez votre compte GitHub** :
   - Cliquez sur "Login with GitHub"
   - Autorisez Railway à accéder à vos repositories
   - Sélectionnez les repositories à partager (ou tous)

---

## 🗄️ Étape 3 : Créer un Nouveau Projet et Ajouter une Base de Données

1. **Dans Railway, cliquez sur "New Project"**
2. **Cliquez sur "New" → "Database"**
3. **Choisissez "PostgreSQL"** (recommandé - Railway le supporte nativement)
4. **Railway crée automatiquement la base de données**
5. **Notez** : Les variables d'environnement sont automatiquement créées et disponibles pour les autres services

**Variables créées automatiquement :**
- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

---

## 📦 Étape 4 : Déployer le Backend

1. **Dans le même projet Railway, cliquez sur "New" → "GitHub Repo"**
2. **Sélectionnez votre repository** (weboost-software)
3. **Railway détecte automatiquement Node.js**

4. **Configurez le service Backend** :
   - **Name** : `backend` (ou `weboost-backend`)
   - **Root Directory** : `backend`
   - Railway détecte automatiquement `package.json` dans le dossier `backend`

5. **Ajoutez les variables d'environnement** :
   - Cliquez sur le service backend
   - Allez dans l'onglet "Variables"
   - Cliquez sur "New Variable"
   - Ajoutez les variables suivantes :

   **Variables de Base de Données (utilisez les références Railway) :**
   ```
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```

   **Variables JWT :**
   ```
   JWT_SECRET=(générez un secret long - ex: utilisez https://www.random.org/strings/)
   JWT_EXPIRES_IN=7d
   ```

   **Variables Port (automatique sur Railway) :**
   ```
   PORT=${{PORT}}
   ```

   **Variables URLs :**
   ```
   API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   ```

   **Variables Email SMTP :**
   ```
   SMTP_HOST=c9.vangus.io
   SMTP_PORT=465
   SMTP_USER=votre-email@weboost-il.com
   SMTP_PASSWORD=votre-mot-de-passe-email
   SMTP_FROM=WeBoost <noreply@weboost-il.com>
   SMTP_SECURE=true
   ```

   **Variables API :**
   ```
   PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
   ```

   **Variables Environnement :**
   ```
   NODE_ENV=production
   ```

6. **Configurez le Build et Start** :
   - Railway détecte automatiquement les scripts dans `package.json`
   - **Build Command** : `npm install && npm run build` (automatique)
   - **Start Command** : `npm start` (automatique)

7. **Déployez** :
   - Railway commence automatiquement le déploiement
   - Attendez que le build soit terminé (2-5 minutes)
   - Vérifiez les logs pour s'assurer qu'il n'y a pas d'erreurs

---

## 🌐 Étape 5 : Générer un Domaine Public

1. **Dans le service backend, allez dans l'onglet "Settings"**
2. **Allez dans "Networking"**
3. **Cliquez sur "Generate Domain"**
4. **Railway génère un domaine gratuit** (ex: `backend-production.up.railway.app`)
5. **Notez ce domaine** - vous en aurez besoin pour le frontend

---

## 🎨 Étape 6 : Déployer le Frontend

### Option A : Sur Railway (Recommandé pour tout en un)

1. **Dans le même projet Railway, cliquez sur "New" → "GitHub Repo"**
2. **Sélectionnez le même repository** (weboost-software)
3. **Configurez le service Frontend** :
   - **Name** : `frontend` (ou `weboost-frontend`)
   - **Root Directory** : `frontend`
   - Railway détecte automatiquement `package.json` dans le dossier `frontend`

4. **Configurez le Build** :
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npx serve -s dist -p $PORT`

5. **Ajoutez les variables d'environnement** :
   ```
   VITE_API_URL=${{backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

6. **Générez un domaine** :
   - Allez dans "Settings" → "Networking"
   - Cliquez sur "Generate Domain"

### Option B : Sur Vercel (Gratuit et Recommandé pour le Frontend)

1. **Allez sur https://vercel.com**
2. **Connectez votre compte GitHub**
3. **Cliquez sur "Add New Project"**
4. **Importez votre repository**
5. **Configurez** :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

6. **Ajoutez les variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```

7. **Déployez** :
   - Vercel déploie automatiquement
   - Vous obtenez un domaine gratuit (ex: `weboost-software.vercel.app`)

---

## 🔗 Étape 7 : Configurer le Domaine Personnalisé (Optionnel)

### Pour le Backend (Railway) :

1. **Dans Railway, allez dans "Settings" → "Networking"**
2. **Cliquez sur "Custom Domain"**
3. **Ajoutez votre domaine** : `api.weboost-il.com` (ou autre sous-domaine)
4. **Configurez les DNS** :
   - Allez dans votre panel DNS
   - Ajoutez un enregistrement CNAME :
     - **Name** : `api` (ou le sous-domaine choisi)
     - **Value** : `votre-backend.railway.app`

### Pour le Frontend (Vercel) :

1. **Dans Vercel, allez dans "Settings" → "Domains"**
2. **Ajoutez votre domaine** : `software.weboost-il.com`
3. **Configurez les DNS** selon les instructions Vercel

---

## ✅ Étape 8 : Vérifier le Déploiement

1. **Accédez à votre application** :
   - Backend : `https://votre-backend.railway.app`
   - Frontend : `https://software.weboost-il.com` (ou le domaine Vercel)

2. **Testez la connexion** :
   - Ouvrez le frontend
   - Connectez-vous avec :
     - Email: `admin@weboost.com`
     - Password: `admin123`

3. **Vérifiez les logs** :
   - Dans Railway, allez dans l'onglet "Deployments"
   - Cliquez sur le dernier déploiement
   - Vérifiez les logs pour s'assurer qu'il n'y a pas d'erreurs

---

## 🔧 Configuration Avancée

### Variables d'Environnement Railway

Railway fournit automatiquement :
- `PORT` - Port sur lequel l'application doit écouter
- `RAILWAY_ENVIRONMENT` - Environnement (production, etc.)
- `RAILWAY_PUBLIC_DOMAIN` - Domaine public de l'application

### Références entre Services

Dans Railway, vous pouvez référencer d'autres services :
- `${{Postgres.PGHOST}}` - Host de la base de données
- `${{backend.RAILWAY_PUBLIC_DOMAIN}}` - Domaine du service backend

---

## 📝 Fichiers de Configuration Créés

J'ai créé les fichiers suivants :
- ✅ `railway.json` - Configuration Railway
- ✅ `Procfile` - Commandes de démarrage
- ✅ `.railwayignore` - Fichiers à ignorer
- ✅ `railway.toml` - Configuration alternative

---

## 💰 Coût Railway

- **Gratuit** : 500 heures/mois, $5 de crédit
- **Starter** : $5/mois - 100 heures supplémentaires
- **Developer** : $20/mois - Usage illimité

**Pour commencer :** Le plan gratuit est suffisant !

---

## 🎯 Avantages Railway

- ✅ Déploiement automatique depuis Git
- ✅ Pas besoin de configurer Node.js
- ✅ Base de données PostgreSQL incluse
- ✅ SSL automatique
- ✅ Monitoring intégré
- ✅ Logs en temps réel
- ✅ Scaling automatique
- ✅ Support excellent

---

## 🚀 Prêt à Déployer !

Suivez les étapes ci-dessus et votre application sera en ligne en quelques minutes !

**Besoin d'aide ?** Consultez les logs dans Railway ou contactez le support Railway.

---

**Bon déploiement ! 🚀**

