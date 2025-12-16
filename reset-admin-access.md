# 🔐 Réinitialisation des Accès Admin

## Option 1 : Via l'API (Recommandé - Rapide)

**Depuis votre navigateur ou Postman :**

```
POST http://votre-serveur/api/auth/emergency-reset-admin
Content-Type: application/json

{
  "secret": "RESET_ADMIN_2024",
  "email": "admin@weboost.com",
  "password": "Admin@weBoost123"
}
```

**Ou depuis PowerShell :**

```powershell
$body = @{
    secret = "RESET_ADMIN_2024"
    email = "admin@weboost.com"
    password = "Admin@weBoost123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://51.15.254.112/api/auth/emergency-reset-admin" -Method Post -Body $body -ContentType "application/json"
```

**Ou depuis curl (Linux/Mac) :**

```bash
curl -X POST http://51.15.254.112/api/auth/emergency-reset-admin \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "RESET_ADMIN_2024",
    "email": "admin@weboost.com",
    "password": "Admin@weBoost123"
  }'
```

## Option 2 : Via le Script Node.js

**Sur le serveur :**

```bash
ssh root@51.15.254.112
cd /var/www/weboost/backend
node scripts/reset-admin-password.js
```

## Option 3 : Via PostgreSQL Directement

**Sur le serveur :**

```bash
ssh root@51.15.254.112
sudo -u postgres psql -d weboost
```

**Puis dans psql :**

```sql
-- Vérifier si l'utilisateur existe
SELECT id, email, name, role FROM users WHERE email = 'admin@weboost.com';

-- Si l'utilisateur n'existe pas, le créer (vous devrez générer le hash avec Node.js)
-- Sinon, utiliser le script ou l'API
```

## ✅ Identifiants Finaux

Après avoir exécuté l'une des méthodes ci-dessus :

- **Email :** `admin@weboost.com`
- **Mot de passe :** `Admin@weBoost123`

## 🔒 Sécurité

⚠️ **Important :** Après avoir réinitialisé le mot de passe, changez le secret dans le fichier `.env` :

```env
RESET_ADMIN_SECRET=votre_secret_plus_securise_ici
```

Et redémarrez le serveur backend.

