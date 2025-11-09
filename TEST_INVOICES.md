# Guide de Test - Gestion des Factures

## 📋 Prérequis

1. Assurez-vous que les serveurs sont démarrés :
   - Backend : http://localhost:5000
   - Frontend : http://localhost:3000

2. Connectez-vous à l'application avec un compte admin

## 🧪 Tests à effectuer

### 1. Accès à la page détail d'un client

1. Allez sur la page **Customers** (`/customers`)
2. Cliquez sur une card de client
3. ✅ **Résultat attendu** : Vous êtes redirigé vers `/customers/:id` avec toutes les informations du client affichées

### 2. Section Factures

1. Sur la page de détail du client, descendez jusqu'à la section **Factures**
2. ✅ **Résultat attendu** : Vous voyez :
   - Un bouton "Filtres"
   - Un bouton "Nouvelle facture" (si admin)
   - Des statistiques (Total, Payées, Impayées)

### 3. Ajouter une facture

1. Cliquez sur **"Nouvelle facture"**
2. Remplissez le formulaire :
   - Numéro de facture : `FAC-2024-001`
   - Montant : `1500.00`
   - Date de facture : Aujourd'hui
   - Date d'échéance : Dans 30 jours
   - Statut : `Non payée`
   - Sélectionnez un fichier (PDF, DOC, DOCX, JPG, JPEG, PNG)
3. Cliquez sur **"Créer"**
4. ✅ **Résultat attendu** : 
   - La facture apparaît dans le tableau
   - Les statistiques sont mises à jour
   - Le fichier est uploadé

### 4. Filtres

1. Cliquez sur **"Filtres"**
2. Testez les différents filtres :
   - **Par statut** : Sélectionnez "Payée" → Seules les factures payées s'affichent
   - **Par montant** : Entrez un montant min (ex: 1000) → Seules les factures >= 1000€ s'affichent
   - **Par date** : Sélectionnez une période → Seules les factures de cette période s'affichent
3. Cliquez sur **"Réinitialiser"**
4. ✅ **Résultat attendu** : Tous les filtres sont réinitialisés, toutes les factures s'affichent

### 5. Modifier une facture

1. Cliquez sur l'icône **Modifier** (crayon) d'une facture
2. Modifiez le statut en "Payée"
3. Cliquez sur **"Modifier"**
4. ✅ **Résultat attendu** : 
   - La facture est mise à jour
   - Le statut change dans le tableau
   - Les statistiques sont recalculées

### 6. Télécharger une facture

1. Cliquez sur l'icône **Télécharger** (flèche vers le bas) d'une facture
2. ✅ **Résultat attendu** : Le fichier de la facture est téléchargé avec le bon nom

### 7. Supprimer une facture

1. Cliquez sur l'icône **Supprimer** (poubelle) d'une facture
2. Confirmez la suppression
3. ✅ **Résultat attendu** : 
   - La facture est supprimée du tableau
   - Les statistiques sont mises à jour
   - Le fichier est supprimé du serveur

### 8. Statistiques

1. Ajoutez plusieurs factures avec différents statuts :
   - 2 factures payées (1000€ et 500€)
   - 1 facture non payée (2000€)
   - 1 facture en retard (750€)
2. ✅ **Résultat attendu** : 
   - **Total** : 4250€
   - **Payées** : 1500€
   - **Impayées** : 2750€

## 🐛 Problèmes possibles

### La migration ne s'est pas exécutée

**Symptôme** : Erreur 500 lors de l'accès aux factures

**Solution** : 
1. Vérifiez les logs du backend
2. Redémarrez le serveur backend
3. Vérifiez que la table `invoices` existe dans la base de données

### Les fichiers ne s'uploadent pas

**Symptôme** : Erreur lors de l'upload

**Solution** :
1. Vérifiez que le dossier `backend/uploads/invoices/` existe
2. Vérifiez les permissions d'écriture
3. Vérifiez que le fichier fait moins de 10MB
4. Vérifiez le format du fichier (PDF, DOC, DOCX, JPG, JPEG, PNG)

### Les filtres ne fonctionnent pas

**Symptôme** : Les factures ne se filtrent pas

**Solution** :
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que les requêtes API sont bien envoyées
3. Vérifiez les logs du backend

## ✅ Checklist de test

- [ ] Accès à la page détail d'un client
- [ ] Affichage de la section factures
- [ ] Ajout d'une facture
- [ ] Modification d'une facture
- [ ] Suppression d'une facture
- [ ] Téléchargement d'une facture
- [ ] Filtres par statut
- [ ] Filtres par montant
- [ ] Filtres par date
- [ ] Réinitialisation des filtres
- [ ] Statistiques correctes
- [ ] Permissions (admin seulement pour créer/modifier/supprimer)

## 📝 Notes

- Les clients (non-admin) peuvent uniquement voir et télécharger leurs factures
- Seuls les admins peuvent créer, modifier et supprimer des factures
- Les fichiers sont stockés dans `backend/uploads/invoices/`
- La taille maximale d'un fichier est de 10MB

