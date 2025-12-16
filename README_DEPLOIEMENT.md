# 🚀 Guide de Déploiement WeBoost

## 📋 Serveur Scaleway

- **IP** : `51.15.254.112`
- **User** : `root`
- **SSH** : `ssh root@51.15.254.112`
- **Node.js** : ✅ Installé
- **Base de données** : PostgreSQL

---

## 🎯 Déploiement Rapide

### 1. Configurer le Serveur (Une Seule Fois)

**Connectez-vous au serveur** :
```bash
ssh root@51.15.254.112
```

**Transférez et exécutez le script de configuration** :
```bash
# Depuis votre machine locale
scp setup-scaleway.sh root@51.15.254.112:/tmp/
ssh root@51.15.254.112 "chmod +x /tmp/setup-scaleway.sh && /tmp/setup-scaleway.sh"
```

Le script va installer :
- ✅ PostgreSQL
- ✅ PM2
- ✅ Nginx
- ✅ Certbot (SSL)

---

### 2. Déployer l'Application

**Depuis votre machine locale** :

1. **Éditez `backend/.env`** avec vos configurations
2. **Exécutez le script de déploiement** :
   ```bash
   ./deploy-scaleway.sh
   ```

Le script va :
- ✅ Construire le backend et le frontend
- ✅ Transférer les fichiers sur le serveur
- ✅ Installer les dépendances

---

### 3. Démarrer l'Application

**Sur le serveur** :
```bash
cd /var/www/weboost
pm2 start ecosystem.config.js
pm2 save
```

---

### 4. Configurer SSL

**Sur le serveur** :
```bash
certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

## 📖 Documentation Complète

Consultez **`DEPLOY_SCALEWAY.md`** pour le guide détaillé.

---

## 🔧 Commandes Utiles

### PM2
```bash
pm2 status              # Statut
pm2 logs weboost-backend # Logs
pm2 restart weboost-backend # Redémarrer
```

### Nginx
```bash
nginx -t                # Tester
systemctl restart nginx # Redémarrer
```

### PostgreSQL
```bash
systemctl status postgresql # Statut
sudo -u postgres psql       # Se connecter
```

---

**Bon déploiement ! 🚀**




