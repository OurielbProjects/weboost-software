# Script de déploiement automatique VANGUS
# Exécutez ce script depuis PowerShell sur Windows

param(
    [string]$Email = "",
    [string]$EmailPassword = "",
    [string]$NodeVersion = "",
    [string]$InstallPath = ""
)

$ErrorActionPreference = "Stop"

# Couleurs
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }

Write-Info "🚀 Déploiement automatique WeBoost sur VANGUS"
Write-Info "=============================================="

# Configuration
$FTP_HOST = "c9.vangus.io"
$FTP_USER = "software_weboost"
$FTP_PASS = "869F7kwp$"
$DOMAIN = "software.weboost-il.com"
$DB_HOST = "localhost"
$DB_PORT = "3306"
$DB_NAME = "weboost_db"
$DB_USER = "weboost_user"
$DB_PASS = "Weboost2652@"
$SMTP_HOST = "c9.vangus.io"
$SMTP_PORT = "465"

# Vérifier les prérequis
Write-Info "Vérification des prérequis..."

if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) {
    Write-Error "npm n'est pas installé. Veuillez installer Node.js."
    exit 1
}

if (-not (Test-Path "backend")) {
    Write-Error "Le répertoire backend n'existe pas. Exécutez ce script depuis la racine du projet."
    exit 1
}

# Demander les informations manquantes
if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = Read-Host "Entrez votre adresse email pour SMTP"
}

if ([string]::IsNullOrWhiteSpace($EmailPassword)) {
    $SecurePassword = Read-Host "Entrez le mot de passe de l'email" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $EmailPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if ([string]::IsNullOrWhiteSpace($NodeVersion)) {
    $NodeVersion = Read-Host "Quelle version de Node.js est disponible? (ex: 18, 20)"
}

if ([string]::IsNullOrWhiteSpace($InstallPath)) {
    $InstallPath = Read-Host "Quel est le chemin d'installation? (ex: /home/software_weboost/software ou /home/software_weboost/public_html/software)"
}

# Générer un JWT Secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Info "JWT Secret généré: $JWT_SECRET"

# Étape 1: Adapter le code pour MariaDB
Write-Info "Étape 1: Adaptation du code pour MariaDB..."

# Remplacer connection.ts
if (Test-Path "backend/src/database/connection-mariadb.ts") {
    Copy-Item "backend/src/database/connection.ts" "backend/src/database/connection-postgres.ts.backup" -Force
    Copy-Item "backend/src/database/connection-mariadb.ts" "backend/src/database/connection.ts" -Force
    Write-Info "✅ connection.ts remplacé"
}

# Remplacer initialize.ts
if (Test-Path "backend/src/database/initialize-mariadb.ts") {
    Copy-Item "backend/src/database/initialize.ts" "backend/src/database/initialize-postgres.ts.backup" -Force
    Copy-Item "backend/src/database/initialize-mariadb.ts" "backend/src/database/initialize.ts" -Force
    Write-Info "✅ initialize.ts remplacé"
}

# Remplacer package.json
if (Test-Path "backend/package-mariadb.json") {
    Copy-Item "backend/package.json" "backend/package-postgres.json.backup" -Force
    Copy-Item "backend/package-mariadb.json" "backend/package.json" -Force
    Write-Info "✅ package.json remplacé"
}

# Étape 2: Créer le fichier .env
Write-Info "Étape 2: Création du fichier .env..."

$envContent = @"
# Configuration VANGUS - software.weboost-il.com
# Généré automatiquement le $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Base de données MariaDB
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS

# JWT Secret
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Port du backend (sera configuré dans le panel VANGUS)
PORT=5000

# URL de l'API et Frontend
API_URL=https://$DOMAIN
FRONTEND_URL=https://$DOMAIN

# Configuration Email SMTP VANGUS
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$Email
SMTP_PASSWORD=$EmailPassword
SMTP_FROM=WeBoost <noreply@weboost-il.com>
SMTP_SECURE=true

# PageSpeed Insights API Key
PAGESPEED_API_KEY=AIzaSyCtrnJocauTodIbxs9zu2Xd8diY4av1xvQ

# Environnement
NODE_ENV=production

# Uploads directory
UPLOADS_DIR=$InstallPath/backend/uploads
"@

$envContent | Out-File -FilePath "backend/.env" -Encoding UTF8 -Force
Write-Info "✅ Fichier .env créé"

# Étape 3: Installer les dépendances backend
Write-Info "Étape 3: Installation des dépendances backend..."
Push-Location "backend"
try {
    npm install --production
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de l'installation des dépendances backend"
        exit 1
    }
    Write-Info "✅ Dépendances backend installées"
} finally {
    Pop-Location
}

# Étape 4: Construire le backend
Write-Info "Étape 4: Construction du backend..."
Push-Location "backend"
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de la construction du backend"
        exit 1
    }
    Write-Info "✅ Backend construit"
} finally {
    Pop-Location
}

# Étape 5: Installer les dépendances frontend
Write-Info "Étape 5: Installation des dépendances frontend..."
Push-Location "frontend"
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de l'installation des dépendances frontend"
        exit 1
    }
    Write-Info "✅ Dépendances frontend installées"
} finally {
    Pop-Location
}

# Étape 6: Construire le frontend
Write-Info "Étape 6: Construction du frontend..."
Push-Location "frontend"
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de la construction du frontend"
        exit 1
    }
    Write-Info "✅ Frontend construit"
} finally {
    Pop-Location
}

# Étape 7: Créer les répertoires uploads
Write-Info "Étape 7: Création des répertoires uploads..."
$uploadDirs = @(
    "backend/uploads/logos",
    "backend/uploads/contracts",
    "backend/uploads/invoices"
)
foreach ($dir in $uploadDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Info "✅ Répertoire créé: $dir"
    }
}

# Étape 8: Créer un fichier de configuration pour le déploiement FTP
Write-Info "Étape 8: Préparation du déploiement FTP..."

# Créer un script de déploiement pour le serveur
$serverScript = @"
#!/bin/bash
# Script à exécuter sur le serveur VANGUS après le transfert des fichiers

cd $InstallPath/backend

# Créer les répertoires uploads
mkdir -p uploads/logos
mkdir -p uploads/contracts
mkdir -p uploads/invoices
chmod -R 755 uploads

# Installer les dépendances (si nécessaire)
npm install --production

# Construire (si nécessaire)
npm run build

# Initialiser la base de données (sera fait au premier démarrage)
echo "✅ Configuration terminée"
echo "⚠️  N'oubliez pas de:"
echo "   1. Configurer Node.js dans le panel VANGUS"
echo "   2. Définir le port dans le fichier .env"
echo "   3. Démarrer l'application depuis le panel"
"@

$serverScript | Out-File -FilePath "deploy-server.sh" -Encoding UTF8 -Force
Write-Info "✅ Script serveur créé: deploy-server.sh"

# Étape 9: Créer un guide de déploiement
Write-Info "Étape 9: Création du guide de déploiement..."

$deployGuide = @"
# 🚀 Guide de Déploiement VANGUS - Déploiement Automatique

## ✅ Étape 1: Transfert des Fichiers via FTP

1. **Connectez-vous via FTP** (FileZilla, WinSCP, etc.)
   - Host: $FTP_HOST
   - User: $FTP_USER
   - Password: $FTP_PASS
   - Port: 21 (FTP) ou 22 (SFTP)

2. **Naviguez vers**: $InstallPath

3. **Transférez tous les fichiers du projet**:
   - Tous les fichiers et dossiers
   - Y compris le fichier `.env` dans `backend/`

## ✅ Étape 2: Configuration Node.js dans le Panel

1. **Connectez-vous au panel**: https://c9.vangus.io:8443

2. **Allez dans "Node.js Selector" ou "Setup Node.js App"**

3. **Créez une nouvelle application**:
   - **Application root**: $InstallPath/backend
   - **Application URL**: $DOMAIN
   - **Application Startup File**: dist/index.js
   - **Node.js Version**: $NodeVersion.x
   - **Port**: Notez le port assigné

4. **Mettez à jour le fichier .env** avec le port assigné:
   ```bash
   # Sur le serveur, éditez:
   nano $InstallPath/backend/.env
   # Changez PORT=5000 par le port assigné
   ```

## ✅ Étape 3: Exécuter le Script sur le Serveur

1. **Connectez-vous en SSH** (si disponible) ou utilisez le terminal du panel

2. **Exécutez le script**:
   ```bash
   cd $InstallPath
   chmod +x deploy-server.sh
   ./deploy-server.sh
   ```

## ✅ Étape 4: Démarrer l'Application

1. **Dans le panel VANGUS**, démarrez l'application Node.js

2. **Vérifiez les logs** pour s'assurer qu'il n'y a pas d'erreurs

## ✅ Étape 5: Vérifier le Déploiement

1. **Accédez à**: https://$DOMAIN

2. **Testez la connexion**: admin@weboost.com / admin123

## 📝 Informations de Configuration

- **Base de données**: $DB_NAME sur $DB_HOST:$DB_PORT
- **Email SMTP**: $Email sur $SMTP_HOST:$SMTP_PORT
- **JWT Secret**: (généré automatiquement)
- **Node.js Version**: $NodeVersion.x

## 🔧 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que MariaDB est démarré
- Vérifiez les identifiants dans `.env`

### Erreur de port
- Vérifiez le port assigné dans le panel Node.js
- Mettez à jour le `.env` avec le bon port

### Frontend ne se charge pas
- Vérifiez que les fichiers sont dans le bon répertoire
- Vérifiez la configuration Nginx/Apache

## 📞 Support

Si vous rencontrez des problèmes, vérifiez les logs dans le panel Node.js.
"@

$deployGuide | Out-File -FilePath "GUIDE_DEPLOIEMENT_FINAL.md" -Encoding UTF8 -Force
Write-Info "✅ Guide de déploiement créé: GUIDE_DEPLOIEMENT_FINAL.md"

# Résumé
Write-Info ""
Write-Info "=============================================="
Write-Info "✅ Préparation terminée!"
Write-Info "=============================================="
Write-Info ""
Write-Info "Prochaines étapes:"
Write-Info "1. Transférez tous les fichiers via FTP vers: $InstallPath"
Write-Info "2. Connectez-vous au panel: https://c9.vangus.io:8443"
Write-Info "3. Configurez Node.js dans le panel"
Write-Info "4. Exécutez deploy-server.sh sur le serveur"
Write-Info "5. Démarrez l'application depuis le panel"
Write-Info ""
Write-Info "Consultez GUIDE_DEPLOIEMENT_FINAL.md pour plus de détails"
Write-Info ""
Write-Info "🚀 Bon déploiement!"

