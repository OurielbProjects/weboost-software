# 🔍 Diagnostic et Résolution des Erreurs

Ce guide vous aide à identifier et résoudre les erreurs lorsque vous accédez au site sur internet.

## 🚀 Diagnostic Rapide

### Option 1 : Diagnostic depuis le Serveur (Recommandé)

1. **Connectez-vous au serveur** :
   ```bash
   ssh root@51.15.254.112
   ```

2. **Transférez le script de diagnostic** :
   ```bash
   # Depuis votre machine locale (PowerShell)
   scp diagnostic-serveur.sh root@51.15.254.112:/tmp/
   ```

3. **Exécutez le script** :
   ```bash
   ssh root@51.15.254.112 "chmod +x /tmp/diagnostic-serveur.sh && /tmp/diagnostic-serveur.sh"
   ```

Le script va vérifier :
- ✅ Nginx (serveur web)
- ✅ Backend (application Node.js)
- ✅ Base de données PostgreSQL
- ✅ Fichier de configuration .env
- ✅ Frontend (fichiers statiques)
- ✅ Ports réseau
- ✅ API backend

### Option 2 : Vérifications Manuelles Rapides

Depuis votre machine locale, testez ces URLs :

1. **Frontend** : http://51.15.254.112
   - Si erreur 502 : Backend ne répond pas
   - Si erreur 404 : Frontend non déployé
   - Si erreur 403 : Problème de permissions

2. **API Health Check** : http://51.15.254.112/api/health
   - Devrait retourner : `{"status":"ok","database":"connected"}`
   - Si erreur : Backend ne fonctionne pas

3. **API directement** : http://51.15.254.112:5000/api/health
   - Si ça fonctionne : Problème Nginx
   - Si erreur : Problème backend

---

## 🔧 Problèmes Courants et Solutions

### ❌ Erreur 502 Bad Gateway

**Cause** : Le backend ne répond pas ou n'est pas démarré

**Solution** :
```bash
ssh root@51.15.254.112
cd /var/www/weboost
pm2 status
pm2 logs weboost-backend
```

Si le backend n'est pas en ligne :
```bash
pm2 start ecosystem.config.js
pm2 save
```

---

### ❌ Erreur 404 Not Found

**Cause** : Le frontend n'est pas déployé ou Nginx ne le trouve pas

**Solution** :
```bash
ssh root@51.15.254.112

# Vérifier que les fichiers existent
ls -la /var/www/weboost/frontend/dist/

# Si le répertoire est vide, rebuild le frontend
cd /var/www/weboost/frontend
npm run build

# Vérifier la configuration Nginx
cat /etc/nginx/sites-available/weboost
```

---

### ❌ Erreur 500 Internal Server Error

**Cause** : Erreur dans le backend ou base de données

**Solution** :
```bash
ssh root@51.15.254.112

# Voir les logs du backend
pm2 logs weboost-backend --lines 50

# Vérifier la base de données
systemctl status postgresql

# Vérifier le fichier .env
cat /var/www/weboost/backend/.env | grep -v PASSWORD
```

---

### ❌ Erreur de Connexion (Timeout)

**Cause** : Le port 80 n'est pas ouvert ou Nginx ne fonctionne pas

**Solution** :
```bash
ssh root@51.15.254.112

# Vérifier Nginx
systemctl status nginx

# Démarrer Nginx si nécessaire
systemctl start nginx
systemctl enable nginx

# Vérifier les ports
netstat -tlnp | grep -E ":80|:5000"

# Vérifier la configuration
nginx -t
```

---

### ❌ Erreur de Base de Données

**Cause** : PostgreSQL n'est pas accessible ou mal configuré

**Solution** :
```bash
ssh root@51.15.254.112

# Vérifier PostgreSQL
systemctl status postgresql

# Si non démarré
systemctl start postgresql
systemctl enable postgresql

# Vérifier la connexion
sudo -u postgres psql -c "\l" | grep weboost

# Vérifier le fichier .env
cat /var/www/weboost/backend/.env | grep DB_
```

---

### ❌ Erreur CORS ou API non accessible

**Cause** : Le backend n'écoute pas correctement ou les variables d'environnement sont incorrectes

**Solution** :
```bash
ssh root@51.15.254.112

# Vérifier que le backend écoute
curl http://localhost:5000/api/health

# Vérifier le fichier .env
cat /var/www/weboost/backend/.env | grep FRONTEND_URL

# Redémarrer le backend
pm2 restart weboost-backend
pm2 logs weboost-backend
```

---

## 🔍 Vérifications Détaillées

### 1. Vérifier Nginx

```bash
ssh root@51.15.254.112

# Statut
systemctl status nginx

# Logs d'erreur
tail -f /var/log/nginx/error.log

# Configuration
nginx -t

# Redémarrer si nécessaire
systemctl restart nginx
```

### 2. Vérifier le Backend

```bash
ssh root@51.15.254.112

# Statut PM2
pm2 status

# Logs détaillés
pm2 logs weboost-backend --lines 100

# Redémarrer
pm2 restart weboost-backend

# Voir les logs en temps réel
pm2 logs weboost-backend
```

### 3. Vérifier la Base de Données

```bash
ssh root@51.15.254.112

# Connexion PostgreSQL
sudo -u postgres psql

# Dans PostgreSQL :
\c weboost
SELECT COUNT(*) FROM users;
\q
```

### 4. Vérifier les Fichiers

```bash
ssh root@51.15.254.112

# Frontend
ls -la /var/www/weboost/frontend/dist/

# Backend
ls -la /var/www/weboost/backend/dist/

# Fichier .env
ls -la /var/www/weboost/backend/.env
```

---

## 🛠️ Script de Réparation Automatique

Si vous avez plusieurs problèmes, voici un script de réparation :

```bash
ssh root@51.15.254.112 << 'EOF'
# Démarrer les services
systemctl start postgresql
systemctl start nginx

# Redémarrer le backend
cd /var/www/weboost
pm2 restart weboost-backend

# Vérifier les permissions
chmod -R 755 /var/www/weboost/frontend/dist
chmod -R 755 /var/www/weboost/backend/dist

# Vérifier Nginx
nginx -t && systemctl reload nginx

# Afficher le statut
echo "=== Statut des Services ==="
systemctl status nginx --no-pager
systemctl status postgresql --no-pager
pm2 status
EOF
```

---

## 📞 Informations à Fournir en Cas de Problème

Si le problème persiste, collectez ces informations :

```bash
ssh root@51.15.254.112 << 'EOF'
echo "=== Logs Nginx ===" > /tmp/diagnostic.txt
tail -n 50 /var/log/nginx/error.log >> /tmp/diagnostic.txt

echo "" >> /tmp/diagnostic.txt
echo "=== Logs Backend ===" >> /tmp/diagnostic.txt
pm2 logs weboost-backend --lines 50 --nostream >> /tmp/diagnostic.txt

echo "" >> /tmp/diagnostic.txt
echo "=== Statut Services ===" >> /tmp/diagnostic.txt
systemctl status nginx >> /tmp/diagnostic.txt
systemctl status postgresql >> /tmp/diagnostic.txt
pm2 status >> /tmp/diagnostic.txt

echo "" >> /tmp/diagnostic.txt
echo "=== Test API ===" >> /tmp/diagnostic.txt
curl http://localhost:5000/api/health >> /tmp/diagnostic.txt

cat /tmp/diagnostic.txt
EOF
```

---

## ✅ Vérification Finale

Une fois les corrections appliquées, vérifiez que tout fonctionne :

1. **Frontend** : http://51.15.254.112
   - Devrait afficher la page de connexion

2. **API Health** : http://51.15.254.112/api/health
   - Devrait retourner : `{"status":"ok","database":"connected"}`

3. **Logs** : Aucune erreur dans les logs

---

## 🎯 Résumé des Commandes Essentielles

```bash
# Se connecter au serveur
ssh root@51.15.254.112

# Voir les logs du backend
pm2 logs weboost-backend

# Redémarrer le backend
pm2 restart weboost-backend

# Redémarrer Nginx
systemctl restart nginx

# Voir les erreurs Nginx
tail -f /var/log/nginx/error.log

# Tester l'API
curl http://localhost:5000/api/health
```

---

**Si le problème persiste après ces vérifications, utilisez le script de diagnostic complet !**



