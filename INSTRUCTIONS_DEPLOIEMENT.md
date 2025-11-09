# 🚀 Instructions de Déploiement VANGUS

## ✅ Ce que j'ai préparé pour vous

J'ai créé un script PowerShell automatisé qui fait **TOUT** ce qui est possible depuis votre machine Windows. Cependant, je ne peux pas me connecter directement au serveur VANGUS depuis mon environnement.

## 📋 Ce que le script fait automatiquement

1. ✅ Adapte le code pour MariaDB (remplace PostgreSQL)
2. ✅ Crée le fichier `.env` avec toutes vos configurations
3. ✅ Génère un JWT Secret sécurisé
4. ✅ Installe les dépendances (backend et frontend)
5. ✅ Construit le backend et le frontend
6. ✅ Crée les répertoires nécessaires
7. ✅ Prépare les scripts pour le serveur

## 🚀 Comment utiliser le script

### Étape 1: Exécutez le script PowerShell

1. **Ouvrez PowerShell** en tant qu'administrateur
2. **Naviguez vers le répertoire du projet**:
   ```powershell
   cd C:\Business\WeBoost\software
   ```
3. **Exécutez le script**:
   ```powershell
   .\deploy-vangus-complete.ps1
   ```
4. **Répondez aux questions**:
   - Adresse email pour SMTP (ex: `votre-email@weboost-il.com`)
   - Mot de passe de l'email
   - Version Node.js disponible (ex: `18` ou `20`)
   - Chemin d'installation (ex: `/home/software_weboost/software`)

### Étape 2: Transférer les fichiers via FTP

Le script va créer tous les fichiers nécessaires. Ensuite, vous devez les transférer sur le serveur :

1. **Ouvrez FileZilla** (ou WinSCP)
2. **Connectez-vous**:
   - Host: `34.165.76.147` (ou `c9.vangus.io`)
   - Username: `software_weboost`
   - Password: `869F7kwp$`
   - Port: `21` (FTP) ou `22` (SFTP)
3. **Naviguez vers**: `/software.weboost-il.com`
4. **Transférez TOUS les fichiers** du projet (y compris le fichier `.env` dans `backend/`)

### Étape 3: Configurer Node.js dans le Panel

1. **Connectez-vous au panel**: https://c9.vangus.io:8443
2. **Allez dans "Node.js Selector" ou "Setup Node.js App"**
3. **Créez une nouvelle application**:
   - Application root: `/software.weboost-il.com/backend`
   - Application URL: `software.weboost-il.com`
   - Application Startup File: `dist/index.js`
   - Node.js Version: La version disponible (ex: 18.x, 20.x)
   - **Notez le port assigné** (ex: 3000, 5000, etc.)

### Étape 4: Mettre à jour le fichier .env

1. **Connectez-vous en SSH** (si disponible) ou utilisez le terminal du panel
2. **Éditez le fichier .env**:
   ```bash
   cd /software.weboost-il.com/backend
   nano .env
   ```
3. **Changez le port**:
   ```
   PORT=5000  →  PORT=LE_PORT_ASSIGNE
   ```
4. **Sauvegardez**: `Ctrl+X`, puis `Y`, puis `Enter`

### Étape 5: Exécuter le script sur le serveur

1. **Connectez-vous en SSH** (si disponible) ou utilisez le terminal du panel
2. **Rendez le script exécutable**:
   ```bash
   cd /software.weboost-il.com
   chmod +x deploy-server.sh
   ```
3. **Exécutez le script**:
   ```bash
   ./deploy-server.sh
   ```

### Étape 6: Démarrer l'application

1. **Dans le panel VANGUS**, démarrez l'application Node.js
2. **Vérifiez les logs** pour s'assurer qu'il n'y a pas d'erreurs

### Étape 7: Vérifier le déploiement

1. **Accédez à**: https://software.weboost-il.com
2. **Testez la connexion**:
   - Email: `admin@weboost.com`
   - Password: `admin123`

## ⚠️ Limitations

Je ne peux pas :
- ❌ Me connecter directement au serveur VANGUS (pas d'accès SSH/FTP depuis mon environnement)
- ❌ Exécuter des commandes sur le serveur
- ❌ Configurer Node.js dans le panel (nécessite votre accès)

Mais j'ai préparé **TOUT** ce qui est possible depuis votre machine !

## ✅ Résumé

**Ce que j'ai fait:**
- ✅ Adapté le code pour MariaDB
- ✅ Créé tous les fichiers de configuration
- ✅ Créé le script automatisé
- ✅ Préparé tous les fichiers nécessaires

**Ce que vous devez faire:**
1. Exécuter le script PowerShell
2. Transférer les fichiers via FTP
3. Configurer Node.js dans le panel
4. Exécuter le script sur le serveur
5. Démarrer l'application

## 📞 Besoin d'aide?

Consultez `GUIDE_DEPLOIEMENT_FINAL.md` pour plus de détails.

---

**C'est la méthode la plus automatisée possible! 🚀**

