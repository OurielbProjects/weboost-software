# 🚀 Déploiement Complet WeBoost sur Scaleway

## 📋 Informations Serveur

- **IP** : `51.15.254.112`
- **User** : `root`
- **SSH** : `ssh root@51.15.254.112`
- **Node.js** : ✅ Installé
- **Base de données** : PostgreSQL (à installer)

---

## 🎯 Déploiement en 4 Étapes

### Étape 1 : Configurer le Serveur (Une Seule Fois)

**Connectez-vous au serveur** :
```bash
ssh root@51.15.254.112
```

**Transférez le script de configuration** :
```bash
# Depuis votre machine locale (PowerShell)
scp setup-scaleway.sh root@51.15.254.112:/tmp/
```

**Sur le serveur, exécutez** :
```bash
chmod +x /tmp/setup-scaleway.sh
/tmp/setup-scaleway.sh
```

Le script va :
- ✅ Installer PostgreSQL
- ✅ Créer la base de données
- ✅ Installer PM2
- ✅ Installer Nginx
- ✅ Installer Certbot (SSL)
- ✅ Configurer Nginx

**⚠️ Notez le mot de passe PostgreSQL** que vous entrez !

---

### Étape 2 : Préparer le Fichier .env

**Sur votre machine locale** :

1. **Copiez le template** :
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Éditez `.env`** avec vos configurations :
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=weboost
   DB_USER=weboost_user
   DB_PASSWORD=(le mot de passe que vous avez entré à l'étape 1)
   
   JWT_SECRET=(générez un secret - voir ci-dessous)
   JWT_EXPIRES_IN=7d
   
   PORT=5000
   API_URL=http://votre-domaine.com
   FRONTEND_URL=http://votre-domaine.com
   
   SMTP_HOST=c9.vangus.io
   SMTP_PORT=465
   SMTP_USER=votre-email@weboost-il.com
   SMTP_PASSWORD=votre-mot-de-passe-email
   SMTP_FROM=WeBoost <noreply@weboost-il.com>
   SMTP_SECURE=true
   
   PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ
   
   NODE_ENV=production
   UPLOADS_DIR=/var/www/weboost/backend/uploads
   ```

**Pour générer un JWT_SECRET** :
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Étape 3 : Déployer l'Application

**Depuis votre machine locale** :

1. **Exécutez le script de déploiement** :
   ```bash
   # PowerShell
   bash deploy-scaleway.sh
   ```

   Ou si vous avez Git Bash :
   ```bash
   ./deploy-scaleway.sh
   ```

Le script va :
- ✅ Construire le backend
- ✅ Construire le frontend
- ✅ Créer une archive
- ✅ Transférer sur le serveur
- ✅ Extraire et installer les dépendances

---

### Étape 4 : Démarrer l'Application

**Sur le serveur** :
```bash
cd /var/www/weboost
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Vérifiez que ça fonctionne** :
```bash
pm2 status
pm2 logs weboost-backend
```

---

### Étape 5 : Configurer SSL (Optionnel mais Recommandé)

**Sur le serveur** :
```bash
certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

## ✅ Vérification

1. **Vérifiez PM2** :
   ```bash
   pm2 status
   ```

2. **Vérifiez Nginx** :
   ```bash
   systemctl status nginx
   ```

3. **Testez l'application** :
   - Ouvrez : `http://votre-domaine.com`
   - Connectez-vous : `admin@weboost.com` / `admin123`

---

## 🔧 Commandes Utiles

### PM2
```bash
pm2 status                    # Voir le statut
pm2 logs weboost-backend     # Voir les logs
pm2 restart weboost-backend  # Redémarrer
pm2 stop weboost-backend     # Arrêter
pm2 delete weboost-backend   # Supprimer
```

### Nginx
```bash
nginx -t                      # Tester la configuration
systemctl restart nginx      # Redémarrer
systemctl status nginx       # Voir le statut
tail -f /var/log/nginx/error.log  # Voir les logs d'erreur
```

### PostgreSQL
```bash
systemctl status postgresql   # Voir le statut
sudo -u postgres psql        # Se connecter
sudo -u postgres psql -d weboost  # Se connecter à la base
```

---

## 🆘 Dépannage

### L'application ne démarre pas
```bash
pm2 logs weboost-backend
# Vérifiez les erreurs dans les logs
```

### Erreur de connexion à la base de données
```bash
# Vérifiez que PostgreSQL est démarré
systemctl status postgresql

# Vérifiez la connexion
sudo -u postgres psql -d weboost -U weboost_user
```

### Nginx ne fonctionne pas
```bash
# Vérifiez la configuration
nginx -t

# Vérifiez les logs
tail -f /var/log/nginx/error.log
```

### Les fichiers ne se chargent pas
```bash
# Vérifiez les permissions
chmod -R 755 /var/www/weboost/backend/uploads
chown -R www-data:www-data /var/www/weboost/backend/uploads
```

---

## 📝 Checklist

- [ ] Serveur configuré (setup-scaleway.sh exécuté)
- [ ] Base de données PostgreSQL créée
- [ ] Fichier .env configuré
- [ ] Application déployée (deploy-scaleway.sh exécuté)
- [ ] PM2 démarré
- [ ] Nginx configuré
- [ ] SSL configuré (optionnel)
- [ ] Application accessible
- [ ] Connexion testée

---

## 🎉 Félicitations !

Votre application est maintenant déployée sur Scaleway !

---

**Bon déploiement ! 🚀**




