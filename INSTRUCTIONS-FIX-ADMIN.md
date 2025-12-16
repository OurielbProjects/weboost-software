# 🔐 Instructions pour Réinitialiser l'Admin

## Commande Unique à Exécuter sur le Serveur

**Connectez-vous au serveur et exécutez cette commande complète :**

```bash
ssh root@51.15.254.112
cd /var/www/weboost/backend && node << 'EOF'
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'weboost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});
(async () => {
  try {
    const email = 'admin@weboost.com';
    const password = 'Admin@weBoost123';
    const hashedPassword = await bcrypt.hash(password, 12);
    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length === 0) {
      await pool.query('INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        [email, hashedPassword, 'Administrateur', 'admin']);
      console.log('✅ Admin créé');
    } else {
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
      console.log('✅ Mot de passe mis à jour');
    }
    console.log('Email: admin@weboost.com');
    console.log('Password: Admin@weBoost123');
    await pool.end();
  } catch (e) {
    console.error('Erreur:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
EOF
pm2 restart weboost-backend
```

## Ou Utiliser le Script

Si vous avez transféré le fichier `FIX-ADMIN-COMPLETE.sh` sur le serveur :

```bash
ssh root@51.15.254.112
cd /var/www/weboost
bash FIX-ADMIN-COMPLETE.sh
```

## Identifiants Après Exécution

- **Email :** admin@weboost.com
- **Mot de passe :** Admin@weBoost123

## Vérification

Après avoir exécuté la commande, testez la connexion sur http://51.15.254.112

