-- Script SQL pour mettre à jour l'utilisateur admin
-- Exécuter avec: sudo -u postgres psql -d weboost -f update-user.sql

-- Mettre à jour l'email de l'utilisateur existant
UPDATE users 
SET email = 'admin@weboost-il.com', 
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'admin@weboost.com';

-- Si l'utilisateur n'existe pas, créer un hash bcrypt pour 'Admin@WeBoost123'
-- Note: Ce hash doit être généré avec bcrypt.hash('Admin@WeBoost123', 12)
-- Pour l'instant, créons l'utilisateur avec un hash temporaire qui sera mis à jour

-- Afficher le résultat
SELECT id, email, name, role FROM users;



