# 🚀 Guide de Déploiement VANGUS - Résumé Complet

## ✅ Informations Reçues et Configurées

### Serveur
- **Adresse** : `c9.vangus.io`
- **Panel** : `https://c9.vangus.io:8443`
- **FTP User** : `software_weboost`
- **FTP Password** : `869F7kwp$`

### Base de Données
- **Type** : MariaDB (v10.11.15)
- **Host** : `localhost`
- **Port** : `3306`
- **Database** : `weboost_db`
- **User** : `weboost_user`
- **Password** : `Weboost2652@`

### Email SMTP
- **Host** : `c9.vangus.io`
- **Port** : `465`
- **SSL** : `true`
- **User** : (votre adresse email - À REMPLIR)
- **Password** : (mot de passe email - À REMPLIR)

### Domaine
- **Sous-domaine** : `software.weboost-il.com`

---

## 📁 Fichiers Créés pour le Déploiement

### 1. Fichiers de Configuration
- ✅ `backend/env.vangus.production` - Template de configuration
- ✅ `backend/package-mariadb.json` - Package.json pour MariaDB
- ✅ `backend/src/database/connection-mariadb.ts` - Connexion MariaDB
- ✅ `backend/src/database/initialize-mariadb.ts` - Initialisation MariaDB

### 2. Scripts et Guides
- ✅ `SCRIPT_DEPLOIEMENT_VANGUS.sh` - Script de déploiement automatisé
- ✅ `DEPLOY_VANGUS_GUIDE.md` - Guide détaillé de déploiement
- ✅ `DEPLOY_VANGUS_COMPLET.md` - Résumé des informations
- ✅ `README_DEPLOIEMENT_VANGUS.md` - Ce fichier

---

## ⚠️ Informations Manquantes

Pour finaliser le déploiement, j'ai encore besoin de :

1. **Adresse email exacte** pour SMTP (quelle adresse avez-vous créée ?)
2. **Version Node.js** disponible dans le panel VANGUS
3. **Répertoire d'installation** exact (où seront les fichiers ?)
4. **Port backend** assigné par VANGUS (sera assigné lors de la configuration Node.js)

---

## 🔄 Adaptation MariaDB

**Important** : Le code a été adapté pour fonctionner avec MariaDB au lieu de PostgreSQL.

### Ce qui a été fait :
1. ✅ Création d'un wrapper de compatibilité qui convertit automatiquement les requêtes PostgreSQL en MySQL
2. ✅ Conversion des paramètres `$1, $2, ...` en `?`
3. ✅ Adaptation des types de données (SERIAL → AUTO_INCREMENT, JSONB → JSON)
4. ✅ Création des fichiers d'initialisation MariaDB

### Fonctionnement :
Le wrapper de compatibilité permet d'utiliser le code PostgreSQL existant avec MariaDB sans modifier tous les fichiers. Il convertit automatiquement :
- Les paramètres `$1, $2, ...` en `?`
- Les résultats MySQL en format PostgreSQL
- Les types de données

---

## 📝 Étapes de Déploiement

### Étape 1 : Préparer l'Environnement

1. **Connectez-vous au panel VANGUS** : `https://c9.vangus.io:8443`
2. **Vérifiez Node.js** :
   - Allez dans "Node.js Selector" ou "Setup Node.js App"
   - Notez la version disponible (ex: 18.x, 20.x)
   - Créez une nouvelle application Node.js si nécessaire
   - Notez le port assigné

### Étape 2 : Transférer les Fichiers

#### Via FTP (FileZilla, WinSCP)

1. **Connectez-vous** :
   - Host: `c9.vangus.io`
   - User: `software_weboost`
   - Password: `869F7kwp$`
   - Port: `21` (FTP) ou `22` (SFTP)

2. **Naviguez vers le répertoire du sous-domaine** :
   - Généralement : `/home/software_weboost/public_html/software`
   - Ou : `/home/software_weboost/software`
   - Vérifiez dans le panel sous "Subdomains"

3. **Transférez tous les fichiers du projet**

### Étape 3 : Exécuter le Script de Déploiement

1. **Connectez-vous en SSH** (si disponible) ou utilisez le terminal du panel

2. **Naviguez vers le répertoire du projet** :
```bash
cd /home/software_weboost/software
```

3. **Rendez le script exécutable** :
```bash
chmod +x SCRIPT_DEPLOIEMENT_VANGUS.sh
```

4. **Exécutez le script** :
```bash
./SCRIPT_DEPLOIEMENT_VANGUS.sh
```

Le script va :
- Adapter le code pour MariaDB
- Installer les dépendances
- Construire le backend
- Construire le frontend
- Créer les répertoires nécessaires

### Étape 4 : Configurer le Fichier .env

1. **Éditez le fichier `.env`** dans `backend/.env` :
```bash
cd /home/software_weboost/software/backend
nano .env
```

2. **Remplissez les valeurs** :
   - `SMTP_USER` : Votre adresse email
   - `SMTP_PASSWORD` : Mot de passe de l'email
   - `JWT_SECRET` : Générez un secret sécurisé (32+ caractères)
   - `PORT` : Le port assigné par VANGUS
   - `UPLOADS_DIR` : `/home/software_weboost/software/backend/uploads`

3. **Sauvegardez** : `Ctrl+X`, puis `Y`, puis `Enter`

### Étape 5 : Configurer Node.js dans le Panel

1. **Dans le panel VANGUS** :
   - Allez dans "Node.js Selector" ou "Setup Node.js App"
   - Créez/modifiez l'application :
     - **Application root** : `/home/software_weboost/software/backend`
     - **Application URL** : `software.weboost-il.com`
     - **Application Startup File** : `dist/index.js`
     - **Node.js Version** : La version disponible
     - **Port** : Notez le port assigné

2. **Mettez à jour le `.env`** avec le port assigné

3. **Démarrez l'application** depuis le panel

### Étape 6 : Vérifier le Déploiement

1. **Accédez à** : `https://software.weboost-il.com`
2. **Vérifiez que l'application se charge**
3. **Testez la connexion** : `admin@weboost.com` / `admin123`

---

## 🔧 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que MariaDB est bien démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base de données existe

### Erreur de port
- Vérifiez le port assigné dans le panel Node.js
- Mettez à jour le `.env` avec le bon port

### Erreur de permissions
- Vérifiez les permissions sur les répertoires uploads
- `chmod -R 755 uploads/`

### Frontend ne se charge pas
- Vérifiez que les fichiers sont dans le bon répertoire
- Vérifiez la configuration Nginx/Apache

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans le panel Node.js
2. Vérifiez les logs du backend
3. Contactez le support VANGUS si nécessaire

---

## 🎯 Prochaines Étapes

**Donnez-moi :**
1. L'adresse email exacte pour SMTP
2. La version Node.js disponible
3. Le répertoire d'installation exact
4. Le port assigné par VANGUS

**Et je finaliserai la configuration !**

---

## ✅ Checklist de Déploiement

- [ ] Fichiers transférés sur le serveur
- [ ] Script de déploiement exécuté
- [ ] Fichier `.env` configuré
- [ ] Node.js configuré dans le panel
- [ ] Application démarrée
- [ ] Base de données initialisée
- [ ] Frontend accessible
- [ ] Backend accessible
- [ ] Connexion testée

---

**Bon déploiement ! 🚀**

