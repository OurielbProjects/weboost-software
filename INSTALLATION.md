# Guide d'Installation - WeBoost Software

## Prérequis

- Node.js (version 18 ou supérieure)
- PostgreSQL (version 12 ou supérieure)
- npm ou yarn

## Installation

### 1. Installer les dépendances

```bash
# À la racine du projet
npm install

# Installer les dépendances du backend
cd backend
npm install

# Installer les dépendances du frontend
cd ../frontend
npm install
```

### 2. Configuration de la base de données

1. **Créer automatiquement la base de données** (recommandé) :

```bash
cd backend
npm run create-db
```

Ce script va créer automatiquement la base de données `weboost` pour vous.

**Alternative manuelle :** Si vous préférez créer la base de données manuellement, connectez-vous à PostgreSQL et exécutez :

```sql
CREATE DATABASE weboost;
```

2. Configurer les variables d'environnement du backend :

Créez un fichier `backend/.env` avec le contenu suivant :

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weboost
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email (pour notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=WeBoost Software <noreply@weboost.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google Analytics (optionnel)
GOOGLE_ANALYTICS_API_KEY=
```

**Important :** Modifiez les valeurs selon votre configuration, notamment :
- Les identifiants de la base de données PostgreSQL
- Le `JWT_SECRET` (utilisez une clé sécurisée en production)
- Les paramètres SMTP pour les notifications par email

### 3. Configuration du frontend

Créez un fichier `frontend/.env` (optionnel, les valeurs par défaut fonctionnent) :

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Initialisation de la base de données

La base de données sera automatiquement initialisée au démarrage du serveur backend. Les tables seront créées automatiquement si elles n'existent pas.

Un utilisateur administrateur par défaut sera créé :
- **Email :** admin@weboost.com
- **Mot de passe :** admin123

**⚠️ Important :** Changez ce mot de passe après la première connexion !

## Démarrage

### Mode développement

À la racine du projet :

```bash
npm run dev
```

Cela démarre simultanément :
- Le backend sur http://localhost:5000
- Le frontend sur http://localhost:3000

### Démarrage séparé

**Backend uniquement :**
```bash
cd backend
npm run dev
```

**Frontend uniquement :**
```bash
cd frontend
npm run dev
```

## Production

### Build

```bash
# Build du backend
cd backend
npm run build

# Build du frontend
cd ../frontend
npm run build
```

### Démarrage en production

```bash
# Backend
cd backend
npm start

# Frontend (servir les fichiers statiques avec un serveur web comme nginx)
```

## Utilisation

1. Ouvrez votre navigateur sur http://localhost:3000
2. Connectez-vous avec les identifiants par défaut :
   - Email : admin@weboost.com
   - Mot de passe : admin123
3. Commencez à utiliser l'application !

## Fonctionnalités

- **Projects** : Gestion de vos sites internet avec suivi de performance
- **Customers** : Gestion de vos clients et leurs informations
- **Notifications** : Configuration des alertes et rapports
- **CheckList** : Gestion de vos tâches personnelles
- **Tickets** : Système de support client intégré
- **Users** : Gestion des utilisateurs (admin uniquement)

## Support

Pour toute question ou problème, consultez la documentation ou contactez le support.


