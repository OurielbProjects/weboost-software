# 📖 Guide de Déploiement Complet - WeBoost Software
## Guide Pas-à-Pas pour Débutants

Ce guide vous explique **exactement** comment faire chaque étape, même si vous n'avez jamais fait de déploiement avant.

---

## 🎯 ÉTAPE 1: Accéder à Votre Panneau VANGUS

### Comment s'y rendre ?

1. **Ouvrez votre navigateur** (Chrome, Firefox, Edge, etc.)

2. **Tapez l'adresse de votre panneau VANGUS** :
   - Généralement : `https://votre-domaine.com:2083` (cPanel)
   - Ou : `https://votre-domaine.com:8443` (Plesk)
   - Ou : `https://votre-domaine.com/cpanel`
   - **Demandez à VANGUS** l'adresse exacte si vous ne la connaissez pas

3. **Connectez-vous** avec :
   - Votre nom d'utilisateur (fourni par VANGUS)
   - Votre mot de passe (fourni par VANGUS)

4. **Vous devriez voir** :
   - **cPanel** : Un tableau de bord avec beaucoup d'icônes (Fichiers, Bases de données, Domaines, etc.)
   - **Plesk** : Un menu à gauche avec "Domaines", "Bases de données", etc.

---

## 🎯 ÉTAPE 2: Créer le Sous-Domaine

### Comment s'y rendre dans cPanel ?

1. **Dans cPanel**, cherchez la section **"DOMAINES"** (en haut ou au milieu de la page)

2. **Cliquez sur** :
   - **"Sous-domaines"** ou **"Subdomains"** (icône avec un dossier et un globe)

3. **Vous verrez un formulaire** :
   - **Champ "Sous-domaine"** : Tapez `weboost` (sans le domaine principal)
   - **Champ "Domaine"** : Sélectionnez votre domaine principal dans la liste
   - **Champ "Document Root"** : Laissez par défaut (généralement `/public_html/weboost`)

4. **Cliquez sur le bouton** :
   - **"Créer"** ou **"Create"** ou **"Ajouter"**

5. **Attendez quelques secondes** → Vous devriez voir un message de succès

### Comment s'y rendre dans Plesk ?

1. **Dans Plesk**, cliquez sur **"Domaines"** dans le menu de gauche

2. **Cliquez sur votre domaine principal**

3. **Cherchez** :
   - **"Sous-domaines"** ou **"Subdomains"** dans le menu
   - Ou cliquez sur **"Ajouter un sous-domaine"**

4. **Remplissez** :
   - **Nom du sous-domaine** : `weboost`
   - **Document Root** : Laissez par défaut

5. **Cliquez sur** **"OK"** ou **"Ajouter"**

---

## 🎯 ÉTAPE 3: Créer la Base de Données PostgreSQL

### Comment s'y rendre dans cPanel ?

1. **Dans cPanel**, cherchez la section **"Bases de données"** ou **"DATABASES"**

2. **Cliquez sur** :
   - **"Bases de données PostgreSQL"** ou **"PostgreSQL Databases"**
   - (Si vous ne voyez pas PostgreSQL, cherchez **"Bases de données MySQL"** et contactez VANGUS pour PostgreSQL)

3. **Vous verrez 3 sections** :

   #### A. Créer une Base de Données
   - **Champ "Nom de la base"** : Tapez `weboost_db`
   - **Cliquez sur** **"Créer une base de données"** ou **"Create Database"**
   - **Notez le nom complet** (généralement `votre-user_weboost_db`)

   #### B. Créer un Utilisateur
   - **Champ "Nom d'utilisateur"** : Tapez `weboost_user`
   - **Champ "Mot de passe"** : Tapez un mot de passe fort (ou générez-en un)
   - **Cliquez sur** **"Créer un utilisateur"** ou **"Create User"**
   - **Notez le nom complet** (généralement `votre-user_weboost_user`)
   - **Notez le mot de passe** (IMPORTANT !)

   #### C. Ajouter l'Utilisateur à la Base
   - **Sélectionnez l'utilisateur** : `votre-user_weboost_user`
   - **Sélectionnez la base** : `votre-user_weboost_db`
   - **Cochez** **"TOUS LES PRIVILÈGES"** ou **"ALL PRIVILEGES"**
   - **Cliquez sur** **"Ajouter"** ou **"Add"**

### Comment s'y rendre dans Plesk ?

1. **Dans Plesk**, cliquez sur votre domaine

2. **Cliquez sur** **"Bases de données"** ou **"Databases"**

3. **Cliquez sur** **"Ajouter une base de données"** ou **"Add Database"**

4. **Remplissez** :
   - **Type** : Sélectionnez **PostgreSQL**
   - **Nom** : `weboost_db`
   - **Utilisateur** : Créez un nouvel utilisateur `weboost_user`
   - **Mot de passe** : Générez ou créez un mot de passe fort
   - **Notez tout** (nom de la base, utilisateur, mot de passe)

5. **Cliquez sur** **"OK"**

---

## 🎯 ÉTAPE 4: Transférer les Fichiers sur le Serveur

### Option A: Via FileZilla (Recommandé pour Débutants)

#### 4.1 Télécharger FileZilla

1. **Ouvrez votre navigateur**
2. **Allez sur** : `https://filezilla-project.org/download.php?type=client`
3. **Téléchargez FileZilla Client** (version Windows)
4. **Installez-le** (double-cliquez sur le fichier téléchargé)

#### 4.2 Se Connecter au Serveur

1. **Ouvrez FileZilla**

2. **En haut de FileZilla**, vous verrez des champs** :
   - **Hôte** : Tapez `ftp.votre-domaine.com` ou `votre-domaine.com`
   - **Nom d'utilisateur** : Votre nom d'utilisateur VANGUS
   - **Mot de passe** : Votre mot de passe VANGUS
   - **Port** : Laissez `21` (ou `22` pour SFTP)

3. **Cliquez sur** **"Connexion rapide"** ou **"Quickconnect"**

4. **Si une alerte de sécurité apparaît**, cliquez sur **"OK"** ou **"Accepter"**

5. **Vous devriez voir** :
   - **Côté gauche** : Vos fichiers locaux (votre ordinateur)
   - **Côté droit** : Les fichiers du serveur

#### 4.3 Naviguer vers le Bon Dossier

**Côté serveur (droite)** :
1. **Double-cliquez sur** `public_html` (ou `www` ou `weboost` selon votre configuration)
2. **Si vous avez créé le sous-domaine**, vous devriez voir un dossier `weboost`
3. **Double-cliquez dessus** pour y entrer

**Côté local (gauche)** :
1. **Naviguez vers** : `C:\Business\WeBoost\software`

#### 4.4 Transférer les Fichiers

1. **Sélectionnez TOUS les fichiers** dans le dossier local :
   - Cliquez sur le premier fichier
   - Maintenez `Shift` et cliquez sur le dernier fichier
   - Ou appuyez sur `Ctrl + A` pour tout sélectionner

2. **Faites glisser** les fichiers sélectionnés vers le côté serveur (droite)

3. **Attendez** que tous les fichiers soient transférés (barre de progression en bas)

4. **Vérifiez** que tous les fichiers sont bien sur le serveur

### Option B: Via le Gestionnaire de Fichiers de cPanel

#### 4.1 Accéder au Gestionnaire de Fichiers

1. **Dans cPanel**, cherchez la section **"FICHIERS"** ou **"FILES"**

2. **Cliquez sur** :
   - **"Gestionnaire de fichiers"** ou **"File Manager"**

3. **Vous verrez** :
   - Une liste de dossiers et fichiers
   - Généralement, vous êtes dans `/public_html`

#### 4.2 Naviguer vers le Sous-Domaine

1. **Double-cliquez sur** le dossier `weboost` (ou créez-le si nécessaire)

2. **Vous êtes maintenant dans** `/public_html/weboost`

#### 4.3 Uploader les Fichiers

1. **Cliquez sur** **"Téléverser"** ou **"Upload"** (en haut de la page)

2. **Cliquez sur** **"Sélectionner les fichiers"** ou **"Select Files"**

3. **Dans la fenêtre qui s'ouvre** :
   - Naviguez vers `C:\Business\WeBoost\software`
   - Sélectionnez TOUS les fichiers et dossiers
   - Cliquez sur **"Ouvrir"**

4. **Attendez** que tous les fichiers soient uploadés

5. **Fermez** la fenêtre d'upload

6. **Vérifiez** que tous les fichiers sont dans le dossier `weboost`

---

## 🎯 ÉTAPE 5: Accéder au Serveur via SSH (Terminal)

### Comment s'y rendre ?

#### Dans cPanel :

1. **Dans cPanel**, cherchez la section **"AVANCÉ"** ou **"ADVANCED"**

2. **Cliquez sur** :
   - **"Terminal"** ou **"SSH Access"** ou **"Web Terminal"**

3. **Si vous ne voyez pas Terminal** :
   - Cherchez **"Accès SSH"** ou **"SSH Access"**
   - Activez-le si nécessaire
   - Contactez VANGUS si vous ne trouvez pas

#### Dans Plesk :

1. **Dans Plesk**, cherchez **"Outils et paramètres"** ou **"Tools & Settings"**

2. **Cliquez sur** **"Terminal"** ou **"SSH Access"**

### Utiliser le Terminal

1. **Une fenêtre noire s'ouvre** (c'est le terminal)

2. **Tapez les commandes** une par une (appuyez sur Entrée après chaque commande)

3. **Si on vous demande un mot de passe**, tapez-le (il ne s'affichera pas, c'est normal)

---

## 🎯 ÉTAPE 6: Installer Node.js dans VANGUS

### Comment s'y rendre dans cPanel ?

1. **Dans cPanel**, cherchez la section **"SOFTWARE"** ou **"SOFTWARE"**

2. **Cliquez sur** :
   - **"Sélecteur de version Node.js"** ou **"Node.js Selector"**
   - Ou **"Setup Node.js App"**

3. **Si vous ne voyez pas Node.js** :
   - Contactez le support VANGUS pour l'activer
   - Ou demandez-leur comment installer Node.js

4. **Cliquez sur** **"Créer une application"** ou **"Create Application"**

5. **Remplissez le formulaire** :
   - **Version Node.js** : Sélectionnez **18.x** ou **20.x** (la plus récente)
   - **Mode d'application** : **Production**
   - **Répertoire racine** : `/home/votre-user/public_html/weboost/backend`
   - **URL de l'application** : `weboost.votre-domaine.com`
   - **Fichier de démarrage** : `dist/index.js`
   - **Port** : Laissez par défaut (généralement 5000 ou un port assigné)

6. **Cliquez sur** **"Créer"** ou **"Create"**

7. **Notez le port** assigné (vous en aurez besoin)

### Comment s'y rendre dans Plesk ?

1. **Dans Plesk**, cliquez sur votre domaine

2. **Cherchez** **"Node.js"** dans le menu

3. **Si Node.js n'est pas installé** :
   - Contactez VANGUS pour l'installer
   - Ou installez l'extension Node.js dans Plesk

4. **Cliquez sur** **"Ajouter une application Node.js"**

5. **Remplissez** :
   - **Version** : 18.x ou 20.x
   - **Répertoire** : `/weboost/backend`
   - **Fichier de démarrage** : `dist/index.js`
   - **Port** : Notez le port assigné

6. **Cliquez sur** **"OK"**

---

## 🎯 ÉTAPE 7: Configurer le Fichier .env

### Comment s'y rendre ?

#### Via FileZilla :

1. **Ouvrez FileZilla** (comme à l'Étape 4)

2. **Naviguez vers** : `/public_html/weboost/backend` (côté serveur)

3. **Cherchez** le fichier `.env.example`

4. **Faites un clic droit** sur `.env.example`

5. **Cliquez sur** **"Renommer"** ou **"Rename"**

6. **Renommez-le en** `.env` (sans le `.example`)

7. **Faites un clic droit** sur `.env`

8. **Cliquez sur** **"Voir/Modifier"** ou **"View/Edit"**

9. **Un éditeur de texte s'ouvre** (Notepad ou autre)

#### Via cPanel File Manager :

1. **Dans cPanel**, ouvrez **"Gestionnaire de fichiers"**

2. **Naviguez vers** `public_html/weboost/backend`

3. **Cherchez** `.env.example`

4. **Faites un clic droit** → **"Renommer"** → Renommez en `.env`

5. **Faites un clic droit** sur `.env` → **"Modifier"** ou **"Edit"**

6. **Un éditeur s'ouvre**

### Remplir le Fichier .env

**Remplacez les valeurs suivantes** dans le fichier `.env` :

```env
# Base de données PostgreSQL (remplacez avec VOS identifiants VANGUS)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=votre-user_weboost_db          # ← Le nom COMPLET de votre base
DB_USER=votre-user_weboost_user        # ← Le nom COMPLET de votre utilisateur
DB_PASSWORD=votre_mot_de_passe        # ← Le mot de passe que vous avez créé

# Serveur
PORT=5000                              # ← Le port assigné par VANGUS (voir Étape 6)
NODE_ENV=production
FRONTEND_URL=https://weboost.votre-domaine.com

# JWT Secret (générez un secret fort, par exemple: utilisez un générateur de mot de passe)
JWT_SECRET=votre_secret_jwt_tres_securise_et_long_au_moins_32_caracteres

# API Keys (déjà configurées)
PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
GOOGLE_CLIENT_ID=662326679571-qcaucdpb5hj3ua1o32q9qr2b0uufiugs.apps.googleusercontent.com

# Email SMTP (remplacez avec VOS identifiants email)
SMTP_HOST=smtp.gmail.com              # ← Ou votre provider email
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com       # ← Votre email
SMTP_PASSWORD=votre_mot_de_passe      # ← Mot de passe de l'email
SMTP_FROM=noreply@votre-domaine.com

# URL de l'API
API_URL=https://weboost.votre-domaine.com
```

**Sauvegardez** le fichier (Ctrl + S)

---

## 🎯 ÉTAPE 8: Build de l'Application (Via Terminal)

### Comment s'y rendre ?

**Ouvrez le Terminal** (comme à l'Étape 5)

### Commandes à Taper (Une par Une)

**Tapez chaque commande et appuyez sur Entrée** :

```bash
# 1. Aller dans le dossier de l'application
cd ~/public_html/weboost
```

```bash
# 2. Aller dans le dossier backend
cd backend
```

```bash
# 3. Installer les dépendances
npm install --production
```

**Attendez** que l'installation se termine (peut prendre 2-5 minutes)

```bash
# 4. Build du backend
npm run build
```

**Attendez** que le build se termine

```bash
# 5. Retourner au dossier principal
cd ..
```

```bash
# 6. Aller dans le dossier frontend
cd frontend
```

```bash
# 7. Installer les dépendances frontend
npm install
```

**Attendez** que l'installation se termine

```bash
# 8. Build du frontend
npm run build
```

**Attendez** que le build se termine

```bash
# 9. Retourner au dossier principal
cd ..
```

**Si tout s'est bien passé**, vous devriez voir des messages de succès.

---

## 🎯 ÉTAPE 9: Démarrer l'Application Node.js

### Comment s'y rendre dans cPanel ?

1. **Dans cPanel**, allez dans **"Node.js Selector"** (comme à l'Étape 6)

2. **Vous devriez voir votre application** `weboost`

3. **Cliquez sur** **"Démarrer"** ou **"Start"** (bouton vert)

4. **Vérifiez** que le statut est **"En cours d'exécution"** ou **"Running"**

### Comment s'y rendre dans Plesk ?

1. **Dans Plesk**, allez dans **"Node.js"** (comme à l'Étape 6)

2. **Cliquez sur** **"Démarrer"** ou **"Start"**

3. **Vérifiez** que l'application est démarrée

---

## 🎯 ÉTAPE 10: Configurer Nginx/Apache (Proxy)

### Comment s'y rendre ?

**Cette étape peut nécessiter l'aide de VANGUS** si vous n'avez pas accès à la configuration Nginx/Apache.

#### Option A: Via cPanel (Si disponible)

1. **Dans cPanel**, cherchez **"Apache Handlers"** ou **"Nginx"**

2. **Si vous ne voyez pas ces options**, contactez VANGUS pour configurer le proxy

#### Option B: Demander à VANGUS

**Contactez le support VANGUS** et dites-leur :

> "Bonjour, j'ai besoin de configurer un proxy Nginx/Apache pour mon sous-domaine weboost.votre-domaine.com. Le backend Node.js tourne sur le port [PORT]. Pouvez-vous configurer le proxy pour que :
> - Les requêtes vers `/api` soient redirigées vers `http://localhost:[PORT]`
> - Les autres requêtes servent les fichiers statiques depuis `/public_html/weboost/frontend/dist`"

**Donnez-leur** le fichier `nginx.conf.example` que j'ai créé.

---

## 🎯 ÉTAPE 11: Configurer SSL (HTTPS)

### Comment s'y rendre dans cPanel ?

1. **Dans cPanel**, cherchez la section **"SÉCURITÉ"** ou **"SECURITY"**

2. **Cliquez sur** :
   - **"SSL/TLS Status"** ou **"Statut SSL/TLS"**

3. **Vous verrez** une liste de vos domaines

4. **Cherchez** `weboost.votre-domaine.com`

5. **Cliquez sur** **"Exécuter AutoSSL"** ou **"Run AutoSSL"**

6. **Attendez** quelques minutes

7. **Vérifiez** que le certificat SSL est **"Actif"** ou **"Active"**

### Comment s'y rendre dans Plesk ?

1. **Dans Plesk**, cliquez sur votre domaine

2. **Cliquez sur** **"SSL/TLS Settings"** ou **"Paramètres SSL/TLS"**

3. **Cochez** **"SSL/TLS support"**

4. **Cliquez sur** **"Obtenir un certificat gratuit"** ou **"Get a free certificate"**

5. **Sélectionnez** **"Let's Encrypt"**

6. **Cliquez sur** **"Obtenir"** ou **"Get"**

7. **Attendez** quelques minutes

---

## 🎯 ÉTAPE 12: Tester l'Application

### Comment s'y rendre ?

1. **Ouvrez votre navigateur**

2. **Tapez** : `https://weboost.votre-domaine.com`

3. **Vous devriez voir** :
   - La page de connexion de WeBoost
   - Ou une page d'erreur (si quelque chose ne va pas)

### Si ça ne fonctionne pas :

1. **Vérifiez les logs** :
   - Dans cPanel Node.js Selector → Cliquez sur **"Logs"**
   - Ou dans le Terminal : `pm2 logs weboost-backend`

2. **Vérifiez que** :
   - L'application Node.js est démarrée
   - Le fichier `.env` est bien configuré
   - La base de données est accessible

---

## 🆘 Besoin d'Aide ?

### Si vous êtes bloqué :

1. **Notez** exactement où vous êtes bloqué
2. **Notez** les messages d'erreur (s'il y en a)
3. **Contactez VANGUS** avec ces informations
4. **Ou contactez-moi** avec les détails

### Commandes Utiles pour le Terminal :

```bash
# Voir où vous êtes
pwd

# Lister les fichiers
ls

# Voir les logs de l'application
pm2 logs weboost-backend

# Redémarrer l'application
pm2 restart weboost-backend

# Voir le statut
pm2 status
```

---

## ✅ Checklist Finale

Avant de tester, vérifiez que :

- [ ] Le sous-domaine est créé
- [ ] Les fichiers sont transférés
- [ ] La base de données PostgreSQL est créée
- [ ] Le fichier `.env` est configuré avec les bons identifiants
- [ ] Node.js est installé et l'application est créée
- [ ] Le backend est buildé (`npm run build` dans `backend/`)
- [ ] Le frontend est buildé (`npm run build` dans `frontend/`)
- [ ] L'application Node.js est démarrée
- [ ] Le proxy Nginx/Apache est configuré
- [ ] SSL est activé
- [ ] Vous pouvez accéder à `https://weboost.votre-domaine.com`

---

**Bon courage ! 🚀**



