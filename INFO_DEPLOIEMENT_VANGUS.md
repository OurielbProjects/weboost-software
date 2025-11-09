# 📋 Informations Nécessaires pour le Déploiement VANGUS

Pour déployer votre application WeBoost sur VANGUS, j'ai besoin des informations suivantes :

## 🔐 1. Informations de Connexion au Serveur

### Option A: Accès SSH (si disponible)
- [ ] **Adresse du serveur SSH** : (ex: `ssh.vangus.com` ou `votre-domaine.com`)
- [ ] **Port SSH** : (généralement `22` ou `2222`)
- [ ] **Nom d'utilisateur SSH** : (votre identifiant VANGUS)
- [ ] **Mot de passe SSH** OU **Clé SSH** : (si vous utilisez une clé SSH)

### Option B: Accès FTP/SFTP (si SSH n'est pas disponible)
- [ ] **Adresse du serveur FTP** : (ex: `ftp.vangus.com`)
- [ ] **Port FTP** : (généralement `21` pour FTP, `22` pour SFTP)
- [ ] **Nom d'utilisateur FTP** : 
- [ ] **Mot de passe FTP** :

### Option C: Accès cPanel/Plesk
- [ ] **URL du panneau de contrôle** : (ex: `https://votre-domaine.com:2083` ou `https://cpanel.vangus.com`)
- [ ] **Nom d'utilisateur cPanel** :
- [ ] **Mot de passe cPanel** :

---

## 🌐 2. Informations du Domaine/Sous-domaine

- [ ] **Sous-domaine créé** : (ex: `weboost.votre-domaine.com`)
- [ ] **Domaine principal** : (ex: `votre-domaine.com`)
- [ ] **Répertoire du sous-domaine** : (ex: `/home/votre-user/public_html/weboost` ou `/home/votre-user/weboost`)
  - *Vous pouvez le trouver dans la configuration du sous-domaine dans cPanel*

---

## 🗄️ 3. Informations de la Base de Données PostgreSQL

- [ ] **Nom de la base de données** : (ex: `votre-user_weboost` ou `weboost_db`)
  - *Note: Sur VANGUS, le nom complet est souvent: `votre-user_nomdb`*
- [ ] **Nom d'utilisateur de la base de données** : (ex: `votre-user_weboost_user`)
- [ ] **Mot de passe de la base de données** :
- [ ] **Hôte de la base de données** : (généralement `localhost`)
- [ ] **Port de la base de données** : (généralement `5432`)

**Important** : Créez la base de données et l'utilisateur dans cPanel avant de me donner ces informations.

---

## ⚙️ 4. Configuration Node.js

- [ ] **Version de Node.js disponible** : (ex: `18.x`, `20.x`)
  - *Vérifiez dans cPanel → "Setup Node.js App" ou "Node.js"*
- [ ] **Port disponible pour le backend** : 
  - *VANGUS assigne généralement un port automatiquement, ou vous pouvez en demander un*
- [ ] **PM2 disponible ?** : (Oui/Non)
  - *Certains hébergeurs ont PM2 préinstallé*

---

## 📧 5. Informations Email (pour les notifications)

- [ ] **SMTP Host** : (ex: `smtp.gmail.com`, `smtp.vangus.com`)
- [ ] **SMTP Port** : (généralement `587` ou `465`)
- [ ] **SMTP User** : (votre email pour l'envoi)
- [ ] **SMTP Password** : (mot de passe ou mot de passe d'application)
- [ ] **SMTP From** : (ex: `WeBoost <noreply@votre-domaine.com>`)

---

## 🔑 6. Clés API (si vous en avez déjà)

- [ ] **PageSpeed Insights API Key** : (déjà configurée: `AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ`)
- [ ] **Google Analytics API Key** : (si vous en avez une)
- [ ] **Google Ads API Key** : (si vous en avez une)

---

## 🔒 7. Sécurité

- [ ] **JWT Secret** : 
  - *Je peux en générer un pour vous, ou vous pouvez m'en fournir un*
  - *Doit être long et sécurisé (minimum 32 caractères)*

---

## 📁 8. Structure des Répertoires

- [ ] **Répertoire home** : (ex: `/home/votre-user`)
- [ ] **Répertoire public_html** : (ex: `/home/votre-user/public_html`)
- [ ] **Répertoire pour l'application** : (ex: `/home/votre-user/weboost` ou `/home/votre-user/public_html/weboost`)

---

## ✅ 9. Vérifications Préalables

Avant de me donner ces informations, vérifiez dans votre panneau VANGUS :

- [ ] PostgreSQL est disponible et activé
- [ ] Node.js est disponible (quelle version ?)
- [ ] Vous pouvez créer des bases de données PostgreSQL
- [ ] Vous avez accès SSH OU FTP
- [ ] Le sous-domaine est créé et pointé vers un répertoire
- [ ] PM2 est disponible (optionnel mais recommandé)

---

## 🚀 Ce que je ferai une fois les informations reçues

1. ✅ Créer un script de déploiement automatisé
2. ✅ Configurer les variables d'environnement (.env)
3. ✅ Préparer la configuration PM2 (ecosystem.config.js)
4. ✅ Configurer Nginx/Apache (si nécessaire)
5. ✅ Créer un guide de déploiement personnalisé avec vos informations
6. ✅ Préparer les commandes à exécuter étape par étape

---

## 📝 Notes Importantes

- **Ne partagez JAMAIS vos mots de passe directement dans cette conversation**
- Vous pouvez utiliser des mots de passe temporaires que vous changerez après
- Ou utilisez un gestionnaire de mots de passe sécurisé
- Je peux aussi vous guider étape par étape sans avoir tous les mots de passe

---

## 🔄 Alternative: Déploiement Guidé

Si vous préférez ne pas partager certains accès, je peux :
1. Créer tous les fichiers de configuration nécessaires
2. Vous donner un guide détaillé étape par étape
3. Vous assister à chaque étape via chat

---

## 📞 Prochaines Étapes

Une fois que vous avez ces informations, vous pouvez :
1. Me les fournir (en toute sécurité)
2. Ou me dire quelles informations vous avez déjà
3. Je créerai alors tout le nécessaire pour le déploiement

**Commençons par les informations les plus importantes :**
- Domaine/sous-domaine
- Accès SSH/FTP ou cPanel
- Configuration PostgreSQL
- Version Node.js disponible

