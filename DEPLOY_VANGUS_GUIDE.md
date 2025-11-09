# 🚀 Guide de Déploiement VANGUS - software.weboost-il.com

## 📋 Informations du Déploiement

### Serveur
- **Adresse** : `c9.vangus.io`
- **Panel** : `https://c9.vangus.io:8443`
- **FTP User** : `software_weboost`
- **FTP Password** : `869F7kwp$`

### Base de Données
- **Type** : MariaDB
- **Host** : `localhost`
- **Port** : `3306`
- **Database** : `weboost_db`
- **User** : `weboost_user`
- **Password** : `Weboost2652@`

### Email SMTP
- **Host** : `c9.vangus.io`
- **Port** : `465`
- **SSL** : `true`
- **User** : (votre email)
- **Password** : (mot de passe email)

---

## ⚠️ IMPORTANT : Adaptation MariaDB

Le code a été adapté pour fonctionner avec MariaDB au lieu de PostgreSQL. Un wrapper de compatibilité a été créé pour convertir automatiquement les requêtes PostgreSQL en MySQL.

---

## 📝 Étapes de Déploiement

### Étape 1 : Préparer l'Environnement

1. **Connectez-vous au panel VANGUS** : `https://c9.vangus.io:8443`
2. **Vérifiez Node.js** : Dans le panel, trouvez "Node.js Selector" ou "Setup Node.js App"
   - Notez la version disponible (ex: 18.x, 20.x)
   - Notez le port assigné pour votre application

### Étape 2 : Transférer les Fichiers

#### Option A : Via FTP (FileZilla, WinSCP)

1. **Connectez-vous via FTP** :
   - Host: `c9.vangus.io`
   - User: `software_weboost`
   - Password: `869F7kwp$`
   - Port: `21` (FTP) ou `22` (SFTP)

2. **Naviguez vers le répertoire du sous-domaine** :
   - Généralement : `/home/software_weboost/public_html` ou `/home/software_weboost/software`
   - Vérifiez dans le panel sous "Subdomains" → `software.weboost-il.com`

3. **Transférez tous les fichiers du projet**

#### Option B : Via SSH (si disponible)

```bash
# Depuis votre machine locale
cd C:\Business\WeBoost\software
scp -r * software_weboost@c9.vangus.io:/home/software_weboost/software/
```

### Étape 3 : Installer les Dépendances

1. **Connectez-vous en SSH** (si disponible) ou utilisez le terminal du panel

2. **Naviguez vers le répertoire backend** :
```bash
cd /home/software_weboost/software/backend
```

3. **Installez les dépendances pour MariaDB** :
```bash
# Remplacer package.json par la version MariaDB
cp package-mariadb.json package.json

# Installer les dépendances
npm install --production
```

4. **Construisez le projet** :
```bash
npm run build
```

### Étape 4 : Configurer l'Environnement

1. **Créez le fichier `.env` dans le répertoire backend** :
```bash
cd /home/software_weboost/software/backend
cp env.vangus.production .env
```

2. **Éditez le fichier `.env`** et remplissez :
   - `SMTP_USER` : Votre adresse email
   - `SMTP_PASSWORD` : Mot de passe de l'email
   - `JWT_SECRET` : Générez un secret sécurisé (32+ caractères)
   - `PORT` : Le port assigné par VANGUS
   - `UPLOADS_DIR` : Chemin absolu pour les uploads (ex: `/home/software_weboost/software/backend/uploads`)

### Étape 5 : Adapter le Code pour MariaDB

1. **Remplacez la connexion database** :
```bash
cd /home/software_weboost/software/backend/src/database
# Remplacer connection.ts par connection-mariadb.ts
mv connection.ts connection-postgres.ts.backup
cp connection-mariadb.ts connection.ts
```

2. **Remplacez l'initialisation database** :
```bash
# Remplacer initialize.ts par initialize-mariadb.ts
mv initialize.ts initialize-postgres.ts.backup
cp initialize-mariadb.ts initialize.ts
```

### Étape 6 : Initialiser la Base de Données

1. **Exécutez l'initialisation** :
```bash
cd /home/software_weboost/software/backend
npm run migrate
# Ou directement :
node dist/database/initialize.js
```

### Étape 7 : Construire le Frontend

1. **Naviguez vers le répertoire frontend** :
```bash
cd /home/software_weboost/software/frontend
```

2. **Installez les dépendances** :
```bash
npm install
```

3. **Construisez le projet** :
```bash
npm run build
```

4. **Copiez les fichiers build vers le répertoire public** :
```bash
# Vérifiez où doit être servi le frontend (généralement public_html)
cp -r dist/* /home/software_weboost/public_html/software/
```

### Étape 8 : Configurer Node.js dans le Panel

1. **Dans le panel VANGUS** :
   - Allez dans "Node.js Selector" ou "Setup Node.js App"
   - Créez une nouvelle application Node.js
   - **Application root** : `/home/software_weboost/software/backend`
   - **Application URL** : `software.weboost-il.com`
   - **Application Startup File** : `dist/index.js`
   - **Node.js Version** : La version disponible (18.x ou 20.x)
   - **Port** : Notez le port assigné

2. **Mettez à jour le `.env`** avec le port assigné

3. **Démarrez l'application** depuis le panel

### Étape 9 : Configurer Nginx/Apache (si nécessaire)

Si VANGUS utilise Nginx ou Apache, vous devrez peut-être configurer un reverse proxy :

```nginx
# Configuration Nginx (exemple)
location /api {
    proxy_pass http://localhost:PORT_ASSIGNE;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Étape 10 : Vérifier le Déploiement

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
2. Vérifiez les logs du backend : `tail -f /home/software_weboost/software/backend/logs/app.log`
3. Contactez le support VANGUS si nécessaire

---

## 🔄 Mise à Jour Future

Pour mettre à jour l'application :

```bash
cd /home/software_weboost/software
git pull  # Si vous utilisez Git
cd backend && npm install --production && npm run build
cd ../frontend && npm install && npm run build
# Redémarrez l'application depuis le panel
```

