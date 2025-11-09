# 🚀 Déploiement Automatique VANGUS

## 📋 Ce qui a été préparé

J'ai créé un script PowerShell automatisé qui prépare tout pour le déploiement. Cependant, je ne peux pas me connecter directement au serveur VANGUS depuis mon environnement.

## ✅ Ce que le script fait automatiquement

1. ✅ Adapte le code pour MariaDB
2. ✅ Crée le fichier `.env` avec toutes vos informations
3. ✅ Génère un JWT Secret sécurisé
4. ✅ Installe les dépendances
5. ✅ Construit le backend et le frontend
6. ✅ Crée les répertoires nécessaires
7. ✅ Prépare les scripts pour le serveur

## 🚀 Comment utiliser le script

### Option 1: Exécution Interactive (Recommandé)

1. **Ouvrez PowerShell** en tant qu'administrateur
2. **Naviguez vers le répertoire du projet**:
   ```powershell
   cd C:\Business\WeBoost\software
   ```
3. **Exécutez le script**:
   ```powershell
   .\deploy-vangus.ps1
   ```
4. **Répondez aux questions**:
   - Adresse email pour SMTP
   - Mot de passe de l'email
   - Version Node.js disponible
   - Chemin d'installation sur le serveur

### Option 2: Exécution avec Paramètres

```powershell
.\deploy-vangus.ps1 -Email "votre-email@weboost-il.com" -EmailPassword "mot-de-passe" -NodeVersion "18" -InstallPath "/home/software_weboost/software"
```

## 📝 Après l'exécution du script

Le script va créer:
- ✅ `backend/.env` - Configuration complète
- ✅ `deploy-server.sh` - Script à exécuter sur le serveur
- ✅ `GUIDE_DEPLOIEMENT_FINAL.md` - Guide complet

## 🔄 Étapes suivantes (à faire manuellement)

### 1. Transférer les fichiers via FTP

1. **Connectez-vous via FTP** (FileZilla, WinSCP)
   - Host: `c9.vangus.io`
   - User: `software_weboost`
   - Password: `869F7kwp$`

2. **Transférez tous les fichiers** vers le serveur

### 2. Configurer Node.js dans le Panel

1. **Connectez-vous**: https://c9.vangus.io:8443
2. **Allez dans "Node.js Selector"**
3. **Créez l'application Node.js**
4. **Notez le port assigné**

### 3. Exécuter le script sur le serveur

1. **Connectez-vous en SSH** ou utilisez le terminal du panel
2. **Exécutez**: `./deploy-server.sh`

### 4. Démarrer l'application

1. **Démarrez l'application** depuis le panel
2. **Vérifiez les logs**

## ⚠️ Limitation

Je ne peux pas me connecter directement au serveur VANGUS car:
- Je n'ai pas d'accès SSH direct
- Je ne peux pas me connecter via FTP depuis mon environnement
- Cela nécessite des credentials et une connexion réseau

**Mais j'ai préparé tout ce qui est possible en amont!**

## 💡 Alternative: Déploiement via Git (si disponible)

Si VANGUS supporte Git, vous pourriez:
1. Pousser le code sur un repository Git
2. Cloner sur le serveur
3. Exécuter le script de déploiement

## 🎯 Résumé

**Ce que j'ai fait:**
- ✅ Préparé tous les fichiers
- ✅ Créé le script automatisé
- ✅ Adapté le code pour MariaDB
- ✅ Configuré tous les fichiers

**Ce que vous devez faire:**
1. Exécuter le script PowerShell
2. Transférer les fichiers via FTP
3. Configurer Node.js dans le panel
4. Démarrer l'application

**C'est la méthode la plus automatisée possible!** 🚀

