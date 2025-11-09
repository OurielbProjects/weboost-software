# 📋 Configuration FTP VANGUS

## ✅ Informations FTP Confirmées

### Accès FTP
- **Host/IP** : `34.165.76.147`
- **Hostname** : `c9.vangus.io`
- **Account name** : `software_weboost`
- **Password** : `869F7kwp$`
- **Host folder** : `/software.weboost-il.com`
- **Port** : `21` (FTP) ou `22` (SFTP)

### Base de Données
- **Type** : MariaDB (v10.11.15)
- **Host** : `localhost`
- **Port** : `3306`
- **Database** : `weboost_db`
- **User** : `weboost_user`
- **Password** : `Weboost2652@`

### Email SMTP
- **Host** : `c9.vangus.io`
- **Port** : `465`
- **SSL** : `true`
- **User** : (votre adresse email)
- **Password** : (mot de passe email)

### Domaine
- **Sous-domaine** : `software.weboost-il.com`

---

## 🚀 Instructions de Connexion FTP

### Via FileZilla

1. **Ouvrez FileZilla**
2. **Connectez-vous** :
   - **Hôte** : `34.165.76.147` (ou `c9.vangus.io`)
   - **Nom d'utilisateur** : `software_weboost`
   - **Mot de passe** : `869F7kwp$`
   - **Port** : `21` (FTP) ou `22` (SFTP)
3. **Naviguez vers** : `/software.weboost-il.com`
4. **Transférez tous les fichiers** du projet

### Via WinSCP

1. **Ouvrez WinSCP**
2. **Nouvelle session** :
   - **Nom d'hôte** : `34.165.76.147`
   - **Nom d'utilisateur** : `software_weboost`
   - **Mot de passe** : `869F7kwp$`
   - **Protocole** : `FTP` ou `SFTP`
3. **Connectez-vous**
4. **Naviguez vers** : `/software.weboost-il.com`
5. **Transférez les fichiers**

---

## 📁 Structure des Fichiers sur le Serveur

```
/software.weboost-il.com/
├── backend/
│   ├── .env                    # Configuration (IMPORTANT!)
│   ├── dist/                   # Fichiers compilés
│   ├── uploads/                # Répertoires d'upload
│   │   ├── logos/
│   │   ├── contracts/
│   │   └── invoices/
│   └── ...
├── frontend/
│   └── dist/                   # Fichiers frontend compilés
├── deploy-server.sh            # Script de déploiement
└── ...
```

---

## ⚙️ Configuration Node.js

Dans le panel VANGUS, configurez Node.js avec :
- **Application root** : `/software.weboost-il.com/backend`
- **Application URL** : `software.weboost-il.com`
- **Application Startup File** : `dist/index.js`
- **Node.js Version** : (la version disponible)
- **Port** : (notez le port assigné)

---

## 📝 Mise à Jour du Fichier .env

Après avoir configuré Node.js dans le panel, mettez à jour le fichier `.env` :

```bash
# Sur le serveur
cd /software.weboost-il.com/backend
nano .env
```

Changez :
```
PORT=5000  →  PORT=LE_PORT_ASSIGNE
```

---

## ✅ Checklist de Déploiement

- [ ] Script PowerShell exécuté localement
- [ ] Fichiers transférés via FTP vers `/software.weboost-il.com`
- [ ] Fichier `.env` présent dans `backend/`
- [ ] Node.js configuré dans le panel VANGUS
- [ ] Port noté et mis à jour dans `.env`
- [ ] Script `deploy-server.sh` exécuté sur le serveur
- [ ] Application démarrée depuis le panel
- [ ] Site accessible sur https://software.weboost-il.com
- [ ] Connexion testée (admin@weboost.com / admin123)

---

**Bon déploiement! 🚀**

