# 🔐 Instructions pour Réinitialiser l'Admin

## Méthode 1 : Script Direct (Recommandé)

**Sur le serveur :**

```bash
# 1. Se connecter
ssh root@51.15.254.112

# 2. Aller dans le projet
cd /var/www/weboost

# 3. Copier le script create-admin-direct.js dans backend/scripts/
# (ou le créer directement)

# 4. Exécuter le script
cd backend
node scripts/create-admin-direct.js
```

## Méthode 2 : Via PostgreSQL Directement

**Sur le serveur :**

```bash
ssh root@51.15.254.112

# Se connecter à PostgreSQL
sudo -u postgres psql -d weboost
```

**Puis dans psql, exécutez :**

```sql
-- Vérifier si l'utilisateur existe
SELECT id, email, name, role FROM users WHERE email = 'admin@weboost.com';

-- Si l'utilisateur existe, le supprimer d'abord (optionnel)
DELETE FROM users WHERE email = 'admin@weboost.com';

-- Note: Vous devrez générer le hash du mot de passe avec Node.js
-- Utilisez plutôt le script create-admin-direct.js
```

## Méthode 3 : Via l'API (si le backend est redémarré)

**Depuis PowerShell sur votre machine :**

```powershell
$body = @{
    secret = "RESET_ADMIN_2024"
    email = "admin@weboost.com"
    password = "Admin@weBoost123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://51.15.254.112/api/auth/emergency-reset-admin" -Method Post -Body $body -ContentType "application/json"
```

## Vérification

Après avoir exécuté l'une des méthodes, testez la connexion :

- **URL :** http://51.15.254.112 (ou votre domaine)
- **Email :** admin@weboost.com
- **Mot de passe :** Admin@weBoost123

## Si ça ne fonctionne toujours pas

Vérifiez les logs du backend :

```bash
# Sur le serveur
pm2 logs weboost-backend

# Ou
tail -f /var/log/weboost/error.log
```

Et vérifiez que le backend est bien démarré :

```bash
pm2 status
pm2 restart weboost-backend
```

