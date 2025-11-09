# 🚀 Guide Complet de Déploiement sur Railway.app

## 📋 Prérequis

1. Un compte GitHub/GitLab (gratuit)
2. Votre code sur GitHub/GitLab
3. Un compte Railway.app (gratuit)

---

## 🎯 Étape 1 : Préparer le Code sur GitHub

### Si votre code n'est pas encore sur GitHub :

1. **Créez un repository sur GitHub** :
   - Allez sur https://github.com
   - Cliquez sur "New repository"
   - Nommez-le (ex: `weboost-software`)
   - Créez le repository

2. **Push votre code** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/VOTRE-USERNAME/weboost-software.git
   git push -u origin main
   ```

### Si votre code est déjà sur GitHub :

✅ Vous êtes prêt pour l'étape 2 !

---

## 🚀 Étape 2 : Créer un Compte Railway

1. **Allez sur https://railway.app**
2. **Cliquez sur "Start a New Project"**
3. **Connectez votre compte GitHub** :
   - Cliquez sur "Login with GitHub"
   - Autorisez Railway à accéder à vos repositories

---

## 🗄️ Étape 3 : Ajouter une Base de Données

1. **Dans Railway, cliquez sur "New Project"**
2. **Cliquez sur "New" → "Database"**
3. **Choisissez "PostgreSQL"** (recommandé) ou "MySQL"
4. **Railway crée automatiquement la base de données**
5. **Notez les variables d'environnement** (elles sont automatiquement ajoutées)

**Variables créées automatiquement :**
- `PGHOST` ou `MYSQLHOST`
- `PGPORT` ou `MYSQLPORT`
- `PGDATABASE` ou `MYSQLDATABASE`
- `PGUSER` ou `MYSQLUSER`
- `PGPASSWORD` ou `MYSQLPASSWORD`

---

## 📦 Étape 4 : Déployer le Backend

1. **Dans Railway, cliquez sur "New" → "GitHub Repo"**
2. **Sélectionnez votre repository**
3. **Railway détecte automatiquement Node.js**
4. **Configurez le service** :
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

5. **Ajoutez les variables d'environnement** :
   - Allez dans "Variables"
   - Ajoutez les variables suivantes :

   ```
   # Base de données (automatique si vous avez ajouté une DB)
   DB_HOST=${{Postgres.PGHOST}}  # ou ${{MySQL.MYSQLHOST}}
   DB_PORT=${{Postgres.PGPORT}}  # ou ${{MySQL.MYSQLPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}  # ou ${{MySQL.MYSQLDATABASE}}
   DB_USER=${{Postgres.PGUSER}}  # ou ${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}  # ou ${{MySQL.MYSQLPASSWORD}}
   
   # JWT
   JWT_SECRET=(générez un secret long et sécurisé)
   JWT_EXPIRES_IN=7d
   
   # Port (automatique sur Railway)
   PORT=${{PORT}}
   
   # URLs
   API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   
   # Email SMTP
   SMTP_HOST=c9.vangus.io
   SMTP_PORT=465
   SMTP_USER=votre-email@weboost-il.com
   SMTP_PASSWORD=votre-mot-de-passe
   SMTP_FROM=WeBoost <noreply@weboost-il.com>
   SMTP_SECURE=true
   
   # PageSpeed Insights
   PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
   
   # Environnement
   NODE_ENV=production
   ```

6. **Déployez** :
   - Railway déploie automatiquement
   - Attendez que le déploiement soit terminé
   - Vérifiez les logs pour s'assurer qu'il n'y a pas d'erreurs

---

## 🎨 Étape 5 : Déployer le Frontend

### Option A : Sur Railway (Recommandé)

1. **Créez un nouveau service** pour le frontend
2. **Sélectionnez le même repository**
3. **Configurez** :
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -p $PORT`

4. **Ajoutez les variables d'environnement** :
   ```
   VITE_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

### Option B : Sur Vercel/Netlify (Gratuit et Recommandé)

1. **Allez sur https://vercel.com** (ou https://netlify.com)
2. **Connectez votre GitHub**
3. **Importez le projet**
4. **Configurez** :
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Ajoutez les variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.railway.app
   ```

---

## 🌐 Étape 6 : Configurer le Domaine

1. **Dans Railway, allez dans "Settings" → "Networking"**
2. **Cliquez sur "Generate Domain"** (domaine Railway gratuit)
3. **Ou ajoutez un domaine personnalisé** :
   - Cliquez sur "Custom Domain"
   - Ajoutez : `software.weboost-il.com`
   - Configurez les DNS selon les instructions Railway

4. **Configurez les DNS** :
   - Allez dans votre panel DNS
   - Ajoutez un enregistrement CNAME :
     - **Name**: `software.weboost-il.com`
     - **Value**: `votre-app.railway.app`

---

## ✅ Étape 7 : Vérifier le Déploiement

1. **Accédez à votre application** :
   - Backend : `https://votre-backend.railway.app`
   - Frontend : `https://software.weboost-il.com`

2. **Testez la connexion** :
   - Email: `admin@weboost.com`
   - Password: `admin123`

3. **Vérifiez les logs** dans Railway pour s'assurer qu'il n'y a pas d'erreurs

---

## 🔧 Configuration Avancée

### Adapter le Code pour Railway

Railway utilise PostgreSQL par défaut. Si vous voulez utiliser MySQL :

1. **Ajoutez une base de données MySQL** dans Railway
2. **Mettez à jour les variables d'environnement**
3. **Adaptez le code** pour utiliser MySQL (déjà fait pour MariaDB)

### Variables d'Environnement Railway

Railway fournit automatiquement :
- `PORT` - Port sur lequel l'application doit écouter
- `RAILWAY_ENVIRONMENT` - Environnement (production, etc.)
- `RAILWAY_PUBLIC_DOMAIN` - Domaine public de l'application

---

## 📝 Fichiers de Configuration

J'ai créé les fichiers suivants :

1. **`railway.json`** - Configuration Railway
2. **`Procfile`** - Commandes de démarrage
3. **`.railwayignore`** - Fichiers à ignorer
4. **`railway.toml`** - Configuration alternative

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
- ✅ Base de données incluse
- ✅ SSL automatique
- ✅ Monitoring intégré
- ✅ Logs en temps réel
- ✅ Scaling automatique
- ✅ Support excellent

---

## 🚀 Prêt à Déployer ?

1. **Créez un compte Railway**
2. **Connectez votre GitHub**
3. **Ajoutez une base de données**
4. **Déployez le backend**
5. **Déployez le frontend**
6. **Configurez le domaine**

**C'est tout ! Votre application sera en ligne en quelques minutes ! 🚀**

---

## 📞 Besoin d'Aide ?

Si vous avez des questions ou des problèmes :
1. Vérifiez les logs dans Railway
2. Consultez la documentation Railway
3. Contactez le support Railway

---

**Bon déploiement ! 🚀**

