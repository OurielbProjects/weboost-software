# 🚀 Déploiement sur Railway.app

## 📋 Pourquoi Railway.app ?

Railway.app est la solution la plus simple pour déployer une application Node.js :

- ✅ **Gratuit pour commencer** (500 heures/mois)
- ✅ **Déploiement automatique** depuis Git
- ✅ **Node.js natif** - pas de configuration
- ✅ **Base de données incluse** (PostgreSQL ou MySQL)
- ✅ **Très simple** - quelques clics
- ✅ **Support excellent**

## 🎯 Étapes de Déploiement

### Étape 1 : Préparer le Projet

1. **Assurez-vous que le code est sur GitHub/GitLab**
   - Si ce n'est pas le cas, créez un repository
   - Push le code

### Étape 2 : Créer un Compte Railway

1. Allez sur https://railway.app
2. Créez un compte (gratuit)
3. Connectez votre compte GitHub/GitLab

### Étape 3 : Créer un Nouveau Projet

1. Cliquez sur "New Project"
2. Sélectionnez "Deploy from GitHub repo"
3. Choisissez votre repository
4. Railway détecte automatiquement Node.js

### Étape 4 : Ajouter une Base de Données

1. Cliquez sur "New" → "Database"
2. Choisissez "PostgreSQL" ou "MySQL"
3. Railway crée automatiquement la base de données
4. Notez les variables d'environnement (elles sont automatiquement ajoutées)

### Étape 5 : Configurer les Variables d'Environnement

1. Allez dans "Variables"
2. Ajoutez les variables nécessaires :
   ```
   DB_HOST=(automatique)
   DB_PORT=(automatique)
   DB_NAME=(automatique)
   DB_USER=(automatique)
   DB_PASSWORD=(automatique)
   
   JWT_SECRET=(générez un secret)
   JWT_EXPIRES_IN=7d
   
   SMTP_HOST=c9.vangus.io
   SMTP_PORT=465
   SMTP_USER=votre-email@weboost-il.com
   SMTP_PASSWORD=votre-mot-de-passe
   SMTP_FROM=WeBoost <noreply@weboost-il.com>
   SMTP_SECURE=true
   
   PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
   
   NODE_ENV=production
   ```

### Étape 6 : Configurer le Build

1. Allez dans "Settings"
2. Configurez :
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Watch Paths**: `backend/**`

### Étape 7 : Déployer le Frontend

1. Créez un nouveau service pour le frontend
2. Configurez :
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist`
   - Ou utilisez Vercel/Netlify pour le frontend (gratuit)

### Étape 8 : Configurer le Domaine

1. Allez dans "Settings" → "Networking"
2. Ajoutez un domaine personnalisé : `software.weboost-il.com`
3. Configurez les DNS selon les instructions Railway

## 📝 Fichiers à Créer

Je vais créer les fichiers nécessaires pour Railway :

1. `railway.json` - Configuration Railway
2. `Procfile` - Commandes de démarrage
3. `.railwayignore` - Fichiers à ignorer

## ✅ Avantages Railway

- ✅ Déploiement automatique depuis Git
- ✅ Pas besoin de configurer Node.js
- ✅ Base de données incluse
- ✅ SSL automatique
- ✅ Monitoring intégré
- ✅ Logs en temps réel
- ✅ Scaling automatique

## 💰 Coût

- **Gratuit** : 500 heures/mois, $5 de crédit
- **Starter** : $5/mois - 100 heures supplémentaires
- **Developer** : $20/mois - Usage illimité

## 🚀 Prêt à Déployer ?

Dites-moi si vous voulez que je prépare les fichiers pour Railway.app !

Je peux :
1. ✅ Créer les fichiers de configuration Railway
2. ✅ Adapter le code si nécessaire
3. ✅ Vous guider étape par étape
4. ✅ Déployer l'application

---

**Railway.app est la solution la plus simple et la plus rapide ! 🚀**

