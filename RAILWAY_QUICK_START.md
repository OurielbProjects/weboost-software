# 🚀 Railway.app - Guide de Démarrage Rapide

## ✅ Tout est Prêt !

Le code est maintenant adapté pour Railway.app. Suivez ces étapes simples :

---

## 📋 Checklist de Déploiement

### Étape 1 : Préparer GitHub
- [ ] Créer un repository sur GitHub
- [ ] Push le code sur GitHub

### Étape 2 : Railway - Compte et Base de Données
- [ ] Créer un compte Railway (https://railway.app)
- [ ] Connecter GitHub
- [ ] Créer un nouveau projet
- [ ] Ajouter PostgreSQL

### Étape 3 : Déployer le Backend
- [ ] Ajouter le repository GitHub
- [ ] Configurer Root Directory: `backend`
- [ ] Ajouter les variables d'environnement (voir ci-dessous)
- [ ] Générer un domaine public
- [ ] Vérifier les logs

### Étape 4 : Déployer le Frontend
- [ ] Option A: Vercel (recommandé)
- [ ] Option B: Railway
- [ ] Configurer `VITE_API_URL`

### Étape 5 : Tester
- [ ] Accéder au frontend
- [ ] Se connecter (admin@weboost.com / admin123)

---

## 🔧 Variables d'Environnement Railway

### Base de Données (Références Railway)
```
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

### JWT
```
JWT_SECRET=(générez un secret - 64 caractères)
JWT_EXPIRES_IN=7d
```

### Port (Automatique)
```
PORT=${{PORT}}
```

### URLs
```
API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

### Email SMTP
```
SMTP_HOST=c9.vangus.io
SMTP_PORT=465
SMTP_USER=votre-email@weboost-il.com
SMTP_PASSWORD=votre-mot-de-passe
SMTP_FROM=WeBoost <noreply@weboost-il.com>
SMTP_SECURE=true
```

### API
```
PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
```

### Environnement
```
NODE_ENV=production
```

---

## 📖 Guides Disponibles

1. **`DEPLOY_RAILWAY_ETAPES.md`** - Guide détaillé étape par étape
2. **`README_RAILWAY.md`** - Guide rapide
3. **`RAILWAY_QUICK_START.md`** - Ce fichier (checklist)

---

## 🎯 Prochaines Étapes

1. **Lisez `DEPLOY_RAILWAY_ETAPES.md`** pour le guide complet
2. **Suivez les étapes** une par une
3. **Vérifiez les logs** dans Railway
4. **Testez l'application**

---

## 💡 Astuces

- ✅ Railway détecte automatiquement Node.js
- ✅ PostgreSQL est inclus gratuitement
- ✅ SSL est automatique
- ✅ Les logs sont en temps réel
- ✅ Le déploiement est automatique depuis Git

---

## 🆘 Besoin d'Aide ?

- Consultez les logs dans Railway
- Vérifiez les variables d'environnement
- Consultez la documentation Railway
- Contactez le support Railway

---

**Bon déploiement ! 🚀**

