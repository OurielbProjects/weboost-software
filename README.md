# 🚀 WeBoost Software

Application de gestion de projets et clients avec monitoring en temps réel.

## 📋 Technologies

- **Backend** : Node.js + Express + TypeScript + PostgreSQL
- **Frontend** : React + TypeScript + Vite + Tailwind CSS
- **Base de données** : PostgreSQL
- **Process Manager** : PM2
- **Web Server** : Nginx

---

## 🚀 Déploiement Rapide sur Scaleway

### Serveur

- **IP** : `51.15.254.112`
- **User** : `root`
- **SSH** : `ssh root@51.15.254.112`

### Déploiement en 3 Étapes

1. **Configurer le serveur** (une seule fois) :
   ```bash
   scp setup-scaleway.sh root@51.15.254.112:/tmp/
   ssh root@51.15.254.112 "chmod +x /tmp/setup-scaleway.sh && /tmp/setup-scaleway.sh"
   ```

2. **Préparer le fichier .env** :
   ```bash
   cd backend
   cp .env.example .env
   # Éditez .env avec vos configurations
   ```

3. **Déployer** :
   ```bash
   bash deploy-auto.sh
   ```

4. **Démarrer sur le serveur** :
   ```bash
   ssh root@51.15.254.112
   cd /var/www/weboost
   pm2 start ecosystem.config.js
   pm2 save
   ```

---

## 📖 Documentation

- **`DEPLOY_RAPIDE.md`** - Guide de déploiement rapide
- **`DEPLOY_COMPLET.md`** - Guide de déploiement complet
- **`DEPLOY_SCALEWAY.md`** - Guide détaillé Scaleway

---

## 🔧 Développement Local

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Structure du Projet

```
.
├── backend/          # API Node.js + Express
├── frontend/         # Application React
├── deploy-auto.sh    # Script de déploiement automatique
├── setup-scaleway.sh # Script de configuration serveur
└── ecosystem.config.js # Configuration PM2
```

---

## 🎯 Fonctionnalités

- ✅ Gestion de clients et projets
- ✅ Monitoring en temps réel (PageSpeed Insights)
- ✅ Détection de liens cassés
- ✅ Rapports automatisés
- ✅ Gestion de factures
- ✅ Système de tickets
- ✅ Checklist personnalisée

---

**Bon déploiement ! 🚀**
