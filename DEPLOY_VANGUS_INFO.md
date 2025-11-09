# 🚀 Informations de Déploiement VANGUS

## ✅ Informations Reçues

### 1. 🌐 Domaine
- **Sous-domaine** : `software.weboost-il.com`
- **DNS** : Configuré (AWS Route 53)

### 2. 🗄️ Base de Données
- **Type** : MariaDB (v10.11.15)
- **Hôte** : `localhost`
- **Port** : `3306`
- **Nom de la base** : `weboost_db`
- **Utilisateur** : `weboost_user`
- **Mot de passe** : `Weboost2652@`

### 3. ⚠️ Information Importante

**Votre hébergeur utilise MariaDB (MySQL) et non PostgreSQL !**

Le code actuel utilise PostgreSQL. Je dois l'adapter pour MariaDB. Cela nécessite :
- Changer le package `pg` en `mysql2`
- Adapter toutes les requêtes SQL (syntaxe différente)
- Convertir les types de données (SERIAL → AUTO_INCREMENT, JSONB → JSON, etc.)

---

## 📋 Informations Manquantes Nécessaires

Pour finaliser le déploiement, j'ai encore besoin de :

### 1. 🔐 Accès au Serveur
- [ ] **Accès SSH** : Adresse, port, utilisateur
- [ ] **OU Accès FTP** : Adresse, port, utilisateur, mot de passe
- [ ] **OU Accès cPanel** : URL, utilisateur, mot de passe

### 2. ⚙️ Configuration Node.js
- [ ] **Version Node.js disponible** : (vérifier dans cPanel)
- [ ] **Port pour le backend** : (VANGUS l'assignera ou à demander)
- [ ] **PM2 disponible ?** : (Oui/Non)

### 3. 📧 Configuration Email (optionnel mais recommandé)
- [ ] **SMTP Host** : (ex: `smtp.gmail.com`)
- [ ] **SMTP Port** : (généralement `587`)
- [ ] **SMTP User** : 
- [ ] **SMTP Password** : 

### 4. 📁 Répertoires
- [ ] **Répertoire du sous-domaine** : (ex: `/home/votre-user/public_html/software` ou `/home/votre-user/software`)

---

## 🔄 Prochaines Étapes

Une fois que j'aurai ces informations, je vais :

1. ✅ Adapter tout le code pour MariaDB
2. ✅ Créer le fichier `.env` avec vos informations
3. ✅ Créer les scripts de déploiement
4. ✅ Créer un guide de déploiement personnalisé
5. ✅ Vous donner les commandes à exécuter

---

## ⚡ Solution Rapide

**Option 1 : Adapter pour MariaDB** (ce que je vais faire)
- Je vais adapter tout le code pour MariaDB
- Cela prendra un peu de temps mais fonctionnera avec votre base de données

**Option 2 : Demander PostgreSQL à VANGUS** (si possible)
- Si VANGUS peut vous fournir PostgreSQL, le code actuel fonctionnera directement
- Contactez le support VANGUS pour demander PostgreSQL

---

## 📝 Pour l'instant

**Donnez-moi :**
1. Les informations d'accès (SSH/FTP/cPanel)
2. La version Node.js disponible
3. Le répertoire du sous-domaine

**Et je créerai tout le nécessaire pour le déploiement !**

