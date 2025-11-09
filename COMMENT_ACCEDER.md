# 🗺️ Comment Accéder à Chaque Section - Guide Visuel

Ce guide vous montre **exactement** où cliquer dans votre panneau VANGUS.

---

## 📍 Table des Matières

1. [Accéder au Panneau VANGUS](#1-accéder-au-panneau-vangus)
2. [Créer un Sous-Domaine](#2-créer-un-sous-domaine)
3. [Créer une Base de Données](#3-créer-une-base-de-données)
4. [Transférer des Fichiers](#4-transférer-des-fichiers)
5. [Utiliser le Terminal](#5-utiliser-le-terminal)
6. [Configurer Node.js](#6-configurer-nodejs)
7. [Configurer SSL](#7-configurer-ssl)

---

## 1. Accéder au Panneau VANGUS

### Méthode 1: Via l'URL Directe

1. **Ouvrez votre navigateur** (Chrome, Firefox, etc.)

2. **Dans la barre d'adresse**, tapez :
   ```
   https://votre-domaine.com:2083
   ```
   (Remplacez `votre-domaine.com` par votre domaine)

3. **Ou essayez** :
   ```
   https://votre-domaine.com/cpanel
   ```

4. **Si ça ne fonctionne pas**, contactez VANGUS pour obtenir l'URL exacte

### Méthode 2: Via l'Email VANGUS

1. **Cherchez dans vos emails** un message de VANGUS avec :
   - L'URL du panneau
   - Votre nom d'utilisateur
   - Votre mot de passe

2. **Cliquez sur le lien** dans l'email

### À quoi ça ressemble ?

**cPanel** ressemble à ça :
```
┌─────────────────────────────────────┐
│  cPanel - Votre Nom                 │
├─────────────────────────────────────┤
│  [FICHIERS]                         │
│  • Gestionnaire de fichiers         │
│  • Accès FTP                        │
│                                     │
│  [DOMAINES]                         │
│  • Sous-domaines                    │
│  • Domaines supplémentaires         │
│                                     │
│  [BASES DE DONNÉES]                 │
│  • Bases de données MySQL           │
│  • Bases de données PostgreSQL     │
│                                     │
│  [SOFTWARE]                         │
│  • Sélecteur de version Node.js    │
│  • Installateur d'applications      │
│                                     │
│  [SÉCURITÉ]                         │
│  • SSL/TLS Status                  │
│  • Certificats SSL                  │
└─────────────────────────────────────┘
```

**Plesk** ressemble à ça :
```
┌──────────┬──────────────────────────┐
│ Domaines │                          │
│ Bases de │  Contenu principal      │
│ données  │                          │
│ Fichiers │                          │
│ Mail     │                          │
│ SSL/TLS  │                          │
│ Node.js  │                          │
└──────────┴──────────────────────────┘
```

---

## 2. Créer un Sous-Domaine

### Dans cPanel :

**Chemin exact** :
```
cPanel → DOMAINES → Sous-domaines
```

**Étapes détaillées** :

1. **Regardez en haut de la page cPanel**
   - Vous verrez des **sections en majuscules** : `FICHIERS`, `DOMAINES`, `BASES DE DONNÉES`, etc.

2. **Trouvez la section** `DOMAINES` ou `DOMAINS`

3. **Dans cette section**, cherchez l'icône :
   - **"Sous-domaines"** ou **"Subdomains"**
   - Icône : 📁🌐 (un dossier avec un globe)

4. **Cliquez dessus**

5. **Vous verrez maintenant** :
   ```
   ┌─────────────────────────────────────┐
   │  Créer un sous-domaine              │
   ├─────────────────────────────────────┤
   │  Sous-domaine: [weboost      ]      │
   │  Domaine:      [votre-domaine.com ▼]│
   │  Document Root: [public_html/weboost]│
   │                                     │
   │  [Créer]                            │
   └─────────────────────────────────────┘
   ```

6. **Remplissez** :
   - **Sous-domaine** : Tapez `weboost`
   - **Domaine** : Sélectionnez votre domaine
   - **Document Root** : Laissez par défaut

7. **Cliquez sur** **"Créer"**

### Dans Plesk :

**Chemin exact** :
```
Plesk → Domaines → [Votre domaine] → Sous-domaines
```

**Étapes détaillées** :

1. **Dans le menu de gauche**, cliquez sur **"Domaines"** ou **"Domains"**

2. **Cliquez sur votre domaine principal** (dans la liste)

3. **Dans le menu qui apparaît**, cherchez **"Sous-domaines"** ou **"Subdomains"**

4. **Cliquez dessus**

5. **Cliquez sur** **"Ajouter un sous-domaine"** ou **"Add Subdomain"**

6. **Remplissez le formulaire** et cliquez sur **"OK"**

---

## 3. Créer une Base de Données

### Dans cPanel :

**Chemin exact** :
```
cPanel → BASES DE DONNÉES → Bases de données PostgreSQL
```

**Étapes détaillées** :

1. **Trouvez la section** `BASES DE DONNÉES` ou `DATABASES`

2. **Cliquez sur** :
   - **"Bases de données PostgreSQL"** ou **"PostgreSQL Databases"**
   - (Si vous ne voyez que MySQL, contactez VANGUS)

3. **Vous verrez 3 sections** :

   **Section 1 : Créer une base de données**
   ```
   ┌─────────────────────────────────────┐
   │  Nouvelle base de données           │
   ├─────────────────────────────────────┐
   │  Nom: [weboost_db            ]      │
   │  [Créer une base de données]        │
   └─────────────────────────────────────┘
   ```

   **Section 2 : Créer un utilisateur**
   ```
   ┌─────────────────────────────────────┐
   │  Nouvel utilisateur                 │
   ├─────────────────────────────────────┐
   │  Nom: [weboost_user         ]       │
   │  Mot de passe: [********     ]       │
   │  [Créer un utilisateur]             │
   └─────────────────────────────────────┘
   ```

   **Section 3 : Ajouter un utilisateur à une base**
   ```
   ┌─────────────────────────────────────┐
   │  Ajouter un utilisateur à une base   │
   ├─────────────────────────────────────┐
   │  Utilisateur: [▼ votre-user_weboost_user]│
   │  Base:        [▼ votre-user_weboost_db  ]│
   │  [☑] TOUS LES PRIVILÈGES            │
   │  [Ajouter]                           │
   └─────────────────────────────────────┘
   ```

4. **Faites les 3 étapes dans l'ordre**

### Dans Plesk :

**Chemin exact** :
```
Plesk → Domaines → [Votre domaine] → Bases de données → Ajouter une base de données
```

**Étapes détaillées** :

1. **Cliquez sur votre domaine**

2. **Cliquez sur** **"Bases de données"** ou **"Databases"**

3. **Cliquez sur** **"Ajouter une base de données"** ou **"Add Database"**

4. **Remplissez** :
   - **Type** : PostgreSQL
   - **Nom** : `weboost_db`
   - **Utilisateur** : Créez un nouvel utilisateur
   - **Mot de passe** : Générez ou créez

5. **Cliquez sur** **"OK"**

---

## 4. Transférer des Fichiers

### Option A: Via FileZilla

**Étapes détaillées** :

1. **Téléchargez FileZilla** :
   - Allez sur : `https://filezilla-project.org`
   - Cliquez sur **"Télécharger FileZilla Client"**
   - Installez-le

2. **Ouvrez FileZilla**

3. **En haut de FileZilla**, vous verrez :
   ```
   ┌─────────────────────────────────────────────┐
   │  Hôte: [ftp.votre-domaine.com        ]       │
   │  Nom d'utilisateur: [votre-user      ]       │
   │  Mot de passe: [********            ]        │
   │  Port: [21                          ]       │
   │  [Connexion rapide]                          │
   └─────────────────────────────────────────────┘
   ```

4. **Remplissez** et cliquez sur **"Connexion rapide"**

5. **FileZilla se divise en 2** :
   ```
   ┌──────────────┬──────────────┐
   │  LOCAL       │  SERVEUR     │
   │  (Gauche)    │  (Droite)    │
   │              │              │
   │  C:\         │  /           │
   │  Users\      │  home\       │
   │  ...         │  votre-user\ │
   │              │  public_html\ │
   │              │  weboost\    │
   └──────────────┴──────────────┘
   ```

6. **Côté gauche** : Naviguez vers `C:\Business\WeBoost\software`

7. **Côté droit** : Naviguez vers `public_html/weboost`

8. **Sélectionnez tous les fichiers** à gauche (Ctrl + A)

9. **Faites glisser** vers la droite

10. **Attendez** que le transfert se termine

### Option B: Via cPanel File Manager

**Chemin exact** :
```
cPanel → FICHIERS → Gestionnaire de fichiers
```

**Étapes détaillées** :

1. **Dans cPanel**, trouvez **"FICHIERS"** ou **"FILES"**

2. **Cliquez sur** **"Gestionnaire de fichiers"** ou **"File Manager"**

3. **Naviguez vers** `public_html/weboost`

4. **Cliquez sur** **"Téléverser"** ou **"Upload"** (en haut)

5. **Cliquez sur** **"Sélectionner les fichiers"**

6. **Sélectionnez tous vos fichiers** et cliquez sur **"Ouvrir"**

7. **Attendez** que l'upload se termine

---

## 5. Utiliser le Terminal

### Dans cPanel :

**Chemin exact** :
```
cPanel → AVANCÉ → Terminal
```

**Étapes détaillées** :

1. **Trouvez la section** `AVANCÉ` ou `ADVANCED`

2. **Cliquez sur** :
   - **"Terminal"** ou **"Web Terminal"**
   - Ou **"Accès SSH"** → Activez-le si nécessaire

3. **Une fenêtre noire s'ouvre** :
   ```
   ┌─────────────────────────────────────┐
   │  [votre-user@server ~]$             │
   │  _                                   │
   └─────────────────────────────────────┘
   ```

4. **Tapez vos commandes** ici

### Dans Plesk :

**Chemin exact** :
```
Plesk → Outils et paramètres → Terminal
```

**Étapes détaillées** :

1. **Dans le menu de gauche**, cherchez **"Outils et paramètres"** ou **"Tools & Settings"**

2. **Cliquez sur** **"Terminal"** ou **"SSH Access"**

3. **Activez SSH** si nécessaire

4. **Cliquez sur** **"Ouvrir le terminal"**

---

## 6. Configurer Node.js

### Dans cPanel :

**Chemin exact** :
```
cPanel → SOFTWARE → Sélecteur de version Node.js
```

**Étapes détaillées** :

1. **Trouvez la section** `SOFTWARE` ou `SOFTWARE`

2. **Cliquez sur** :
   - **"Sélecteur de version Node.js"** ou **"Node.js Selector"**
   - Ou **"Setup Node.js App"**

3. **Cliquez sur** **"Créer une application"** ou **"Create Application"**

4. **Vous verrez un formulaire** :
   ```
   ┌─────────────────────────────────────┐
   │  Créer une application Node.js      │
   ├─────────────────────────────────────┤
   │  Version Node.js: [20.x ▼]          │
   │  Mode: [Production ▼]                │
   │  Répertoire racine:                 │
   │  [/home/votre-user/public_html/     │
   │   weboost/backend]                  │
   │  URL: [weboost.votre-domaine.com]   │
   │  Fichier de démarrage:              │
   │  [dist/index.js]                    │
   │  Port: [5000] (auto)                │
   │                                     │
   │  [Créer]                            │
   └─────────────────────────────────────┘
   ```

5. **Remplissez** et cliquez sur **"Créer"**

### Dans Plesk :

**Chemin exact** :
```
Plesk → Domaines → [Votre domaine] → Node.js
```

**Étapes détaillées** :

1. **Cliquez sur votre domaine**

2. **Cherchez** **"Node.js"** dans le menu

3. **Cliquez sur** **"Ajouter une application Node.js"**

4. **Remplissez le formulaire** et cliquez sur **"OK"**

---

## 7. Configurer SSL

### Dans cPanel :

**Chemin exact** :
```
cPanel → SÉCURITÉ → SSL/TLS Status
```

**Étapes détaillées** :

1. **Trouvez la section** `SÉCURITÉ` ou `SECURITY`

2. **Cliquez sur** :
   - **"SSL/TLS Status"** ou **"Statut SSL/TLS"**

3. **Vous verrez une liste** :
   ```
   ┌─────────────────────────────────────┐
   │  Domaines                            │
   ├─────────────────────────────────────┤
   │  votre-domaine.com        [Actif ✓] │
   │  weboost.votre-domaine.com [❌]     │
   │                                     │
   │  [Exécuter AutoSSL]                 │
   └─────────────────────────────────────┘
   ```

4. **Cochez** `weboost.votre-domaine.com`

5. **Cliquez sur** **"Exécuter AutoSSL"**

6. **Attendez** quelques minutes

### Dans Plesk :

**Chemin exact** :
```
Plesk → Domaines → [Votre domaine] → SSL/TLS Settings
```

**Étapes détaillées** :

1. **Cliquez sur votre domaine**

2. **Cliquez sur** **"SSL/TLS Settings"**

3. **Cochez** **"SSL/TLS support"**

4. **Cliquez sur** **"Obtenir un certificat gratuit"**

5. **Sélectionnez** **"Let's Encrypt"**

6. **Cliquez sur** **"Obtenir"**

---

## 🎯 Résumé des Chemins Rapides

### cPanel :
- **Sous-domaine** : `DOMAINES → Sous-domaines`
- **Base de données** : `BASES DE DONNÉES → Bases de données PostgreSQL`
- **Fichiers** : `FICHIERS → Gestionnaire de fichiers`
- **Terminal** : `AVANCÉ → Terminal`
- **Node.js** : `SOFTWARE → Sélecteur de version Node.js`
- **SSL** : `SÉCURITÉ → SSL/TLS Status`

### Plesk :
- **Sous-domaine** : `Domaines → [Votre domaine] → Sous-domaines`
- **Base de données** : `Domaines → [Votre domaine] → Bases de données`
- **Fichiers** : `Domaines → [Votre domaine] → Fichiers`
- **Terminal** : `Outils et paramètres → Terminal`
- **Node.js** : `Domaines → [Votre domaine] → Node.js`
- **SSL** : `Domaines → [Votre domaine] → SSL/TLS Settings`

---

**Si vous ne trouvez pas quelque chose, contactez VANGUS !** 📞



