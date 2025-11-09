# Guide de Création de la Base de Données

## Méthode Automatique (Recommandée)

### Étape 1 : Vérifier que PostgreSQL est démarré

Assurez-vous que PostgreSQL est installé et en cours d'exécution sur votre machine.

**Windows :**
- Vérifiez dans les Services Windows que "PostgreSQL" est démarré
- Ou utilisez pgAdmin pour vérifier la connexion

**Linux/Mac :**
```bash
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # Mac
```

### Étape 2 : Configurer le fichier .env

Créez le fichier `backend/.env` avec vos paramètres PostgreSQL :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weboost
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres
```

**Important :** Remplacez `votre_mot_de_passe_postgres` par le mot de passe que vous avez défini lors de l'installation de PostgreSQL.

### Étape 3 : Exécuter le script de création

```bash
cd backend
npm install  # Si ce n'est pas déjà fait
npm run create-db
```

Le script va :
- Se connecter à PostgreSQL
- Vérifier si la base de données existe déjà
- Créer la base de données `weboost` si elle n'existe pas

### Résultat attendu

Si tout fonctionne, vous verrez :
```
🔌 Connexion à PostgreSQL...
📦 Création de la base de données "weboost"...
✅ Base de données "weboost" créée avec succès !

✨ Terminé ! Vous pouvez maintenant démarrer le serveur backend.
   Les tables seront créées automatiquement au premier démarrage.
```

## Résolution des Problèmes

### Erreur : ECONNREFUSED
**Problème :** PostgreSQL n'est pas démarré ou les paramètres de connexion sont incorrects.

**Solutions :**
1. Vérifiez que PostgreSQL est démarré
2. Vérifiez que `DB_HOST` et `DB_PORT` dans `.env` sont corrects
3. Par défaut, PostgreSQL écoute sur `localhost:5432`

### Erreur : 28P01 (Identifiants incorrects)
**Problème :** Le nom d'utilisateur ou le mot de passe est incorrect.

**Solutions :**
1. Vérifiez `DB_USER` et `DB_PASSWORD` dans `.env`
2. Par défaut, PostgreSQL utilise l'utilisateur `postgres`
3. Si vous avez oublié le mot de passe, vous pouvez le réinitialiser

### Erreur : 3D000 (Base de données "postgres" n'existe pas)
**Problème :** La base de données par défaut "postgres" n'existe pas.

**Solutions :**
1. Créez d'abord la base de données "postgres" :
   ```sql
   CREATE DATABASE postgres;
   ```
2. Ou connectez-vous avec un utilisateur ayant les droits de création

### Erreur : Permission denied
**Problème :** L'utilisateur PostgreSQL n'a pas les droits de création de base de données.

**Solutions :**
1. Utilisez l'utilisateur `postgres` (superutilisateur)
2. Ou accordez les droits à votre utilisateur :
   ```sql
   ALTER USER votre_utilisateur CREATEDB;
   ```

## Méthode Manuelle (Alternative)

Si le script automatique ne fonctionne pas, vous pouvez créer la base de données manuellement :

### 1. Se connecter à PostgreSQL

**Via psql (ligne de commande) :**
```bash
psql -U postgres
```

**Via pgAdmin (interface graphique) :**
- Ouvrez pgAdmin
- Connectez-vous au serveur PostgreSQL
- Clic droit sur "Databases" → "Create" → "Database"

### 2. Créer la base de données

```sql
CREATE DATABASE weboost;
```

### 3. Vérifier la création

```sql
\l
```

Vous devriez voir `weboost` dans la liste des bases de données.

## Après la Création

Une fois la base de données créée :

1. Les tables seront créées **automatiquement** au premier démarrage du serveur backend
2. Un utilisateur admin par défaut sera créé :
   - Email : `admin@weboost.com`
   - Mot de passe : `admin123`

3. Démarrez le serveur :
   ```bash
   cd backend
   npm run dev
   ```

Vous verrez dans les logs :
```
✅ Database initialized
🚀 Server running on port 5000
```



