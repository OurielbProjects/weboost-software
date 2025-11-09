# 🚀 Déploiement VANGUS - Informations Complètes

## ✅ Informations Reçues

### 1. 🌐 Serveur
- **Type** : Google Cloud
- **Adresse serveur** : `c9.vangus.io`
- **IP** : `34.165.76.147`
- **Panel de contrôle** : `https://c9.vangus.io:8443`

### 2. 🌍 Domaine
- **Sous-domaine** : `software.weboost-il.com`

### 3. 🗄️ Base de Données MariaDB
- **Hôte** : `localhost`
- **Port** : `3306`
- **Base** : `weboost_db`
- **Utilisateur** : `weboost_user`
- **Mot de passe** : `Weboost2652@`

### 4. 📧 Configuration Email SMTP
- **Serveur SMTP** : `c9.vangus.io`
- **Port SMTP** : `465`
- **Encryption** : `SSL`
- **Serveur IMAP** : `c9.vangus.io`
- **Port IMAP** : `993`
- **Encryption IMAP** : `SSL`
- **Utilisateur** : (votre adresse email créée)
- **Mot de passe** : (mot de passe de l'email)

### 5. 📁 Accès FTP
- **Serveur** : `c9.vangus.io`
- **Utilisateur** : `software_weboost`
- **Mot de passe** : `869F7kwp$`

---

## ⚠️ Informations Manquantes

Pour finaliser le déploiement, j'ai encore besoin de :

1. **Adresse email exacte** : Quelle adresse email avez-vous créée pour SMTP ?
2. **Version Node.js** : Quelle version est disponible dans le panel ?
3. **Répertoire d'installation** : Où sera installé l'application ? (ex: `/home/software_weboost/public_html` ou `/home/software_weboost/software`)
4. **Port backend** : Quel port sera utilisé pour le backend Node.js ?

---

## 🔄 Prochaines Étapes

Je vais maintenant :

1. ✅ Adapter tout le code pour MariaDB
2. ✅ Créer le fichier `.env` avec vos informations
3. ✅ Créer les scripts de déploiement
4. ✅ Créer un guide de déploiement complet
5. ✅ Vous donner les commandes à exécuter

---

## 📝 Note Importante

Le code actuel utilise PostgreSQL. Je dois l'adapter pour MariaDB. Cela nécessite :
- Changer `pg` en `mysql2`
- Adapter toutes les requêtes SQL
- Convertir les types de données

C'est un travail important mais nécessaire pour que votre application fonctionne avec MariaDB.

