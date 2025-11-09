# Script de déploiement complet VANGUS
# Automatise tout ce qui est possible depuis Windows

param(
    [string]$Email = "",
    [string]$EmailPassword = "",
    [string]$NodeVersion = "18",
    [string]$InstallPath = "/software.weboost-il.com",
    [switch]$SkipFTP = $false
)

$ErrorActionPreference = "Stop"

# Couleurs
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }
function Write-Success { Write-Host "[SUCCESS] $args" -ForegroundColor Cyan }

Write-Info "🚀 Déploiement Automatique WeBoost sur VANGUS"
Write-Info "=============================================="
Write-Info ""

# Configuration
$FTP_HOST = "34.165.76.147"
$FTP_HOSTNAME = "c9.vangus.io"
$FTP_USER = "software_weboost"
$FTP_PASS = "869F7kwp$"
$FTP_PATH = "/software.weboost-il.com"
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
    Write-Error "npm n'est pas installé. Installez Node.js."
    exit 1
}
Write-Success "✅ npm trouvé"

if (-not (Test-Path "backend")) {
    Write-Error "Répertoire backend introuvable. Exécutez depuis la racine du projet."
    exit 1
}
Write-Success "✅ Structure du projet OK"

# Demander les informations manquantes
if ([string]::IsNullOrWhiteSpace($Email)) {
    Write-Info ""
    Write-Info "Configuration Email SMTP:"
    $Email = Read-Host "  Adresse email"
}

if ([string]::IsNullOrWhiteSpace($EmailPassword)) {
    $SecurePassword = Read-Host "  Mot de passe email" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecurePassword)
    $EmailPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

Write-Info ""
Write-Info "Configuration Node.js:"
if ([string]::IsNullOrWhiteSpace($NodeVersion)) {
    $NodeVersion = Read-Host "  Version Node.js (ex: 18, 20)"
}

Write-Info ""
Write-Info "Configuration Serveur:"
if ([string]::IsNullOrWhiteSpace($InstallPath)) {
    $InstallPath = $FTP_PATH
    Write-Info "  Chemin d'installation: $InstallPath (par défaut)"
}

# Générer JWT Secret
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Info ""
Write-Info "=============================================="
Write-Info "ÉTAPE 1: Adaptation pour MariaDB"
Write-Info "=============================================="

# Remplacer connection.ts
if (Test-Path "backend/src/database/connection-mariadb.ts") {
    if (Test-Path "backend/src/database/connection.ts") {
        Copy-Item "backend/src/database/connection.ts" "backend/src/database/connection-postgres.ts.backup" -Force
    }
    Copy-Item "backend/src/database/connection-mariadb.ts" "backend/src/database/connection.ts" -Force
    Write-Success "✅ connection.ts adapté pour MariaDB"
}

# Remplacer initialize.ts
if (Test-Path "backend/src/database/initialize-mariadb.ts") {
    if (Test-Path "backend/src/database/initialize.ts") {
        Copy-Item "backend/src/database/initialize.ts" "backend/src/database/initialize-postgres.ts.backup" -Force
    }
    Copy-Item "backend/src/database/initialize-mariadb.ts" "backend/src/database/initialize.ts" -Force
    Write-Success "✅ initialize.ts adapté pour MariaDB"
}

# Remplacer package.json
if (Test-Path "backend/package-mariadb.json") {
    if (Test-Path "backend/package.json") {
        Copy-Item "backend/package.json" "backend/package-postgres.json.backup" -Force
    }
    Copy-Item "backend/package-mariadb.json" "backend/package.json" -Force
    Write-Success "✅ package.json adapté pour MariaDB"
}

Write-Info ""
Write-Info "=============================================="
Write-Info "ÉTAPE 2: Configuration .env"
Write-Info "=============================================="

# Créer .env
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

# Port du backend (à configurer dans le panel VANGUS)
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
UPLOADS_DIR=/software.weboost-il.com/backend/uploads
"@

$envContent | Out-File -FilePath "backend/.env" -Encoding UTF8 -Force
Write-Success "✅ Fichier .env créé avec toutes les configurations"

Write-Info ""
Write-Info "=============================================="
Write-Info "ÉTAPE 3: Installation des dépendances"
Write-Info "=============================================="

# Backend
Write-Info "Installation des dépendances backend..."
Push-Location "backend"
try {
    npm install --production 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de l'installation des dépendances backend"
        exit 1
    }
    Write-Success "✅ Dépendances backend installées"
} finally {
    Pop-Location
}

# Frontend
Write-Info "Installation des dépendances frontend..."
Push-Location "frontend"
try {
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de l'installation des dépendances frontend"
        exit 1
    }
    Write-Success "✅ Dépendances frontend installées"
} finally {
    Pop-Location
}

Write-Info ""
Write-Info "=============================================="
Write-Info "ÉTAPE 4: Construction des projets"
Write-Info "=============================================="

# Backend
Write-Info "Construction du backend..."
Push-Location "backend"
try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de la construction du backend"
        exit 1
    }
    Write-Success "✅ Backend construit"
} finally {
    Pop-Location
}

# Frontend
Write-Info "Construction du frontend..."
Push-Location "frontend"
try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de la construction du frontend"
        exit 1
    }
    Write-Success "✅ Frontend construit"
} finally {
    Pop-Location
}

Write-Info ""
Write-Info "=============================================="
Write-Info "ÉTAPE 5: Création des répertoires"
Write-Info "=============================================="

$uploadDirs = @(
    "backend/uploads/logos",
    "backend/uploads/contracts",
    "backend/uploads/invoices"
)

foreach ($dir in $uploadDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Success "✅ Répertoire créé: $dir"
    }
}

Write-Info ""
Write-Info "=============================================="
Write-Info "ÉTAPE 6: Création des scripts serveur"
Write-Info "=============================================="

# Script de déploiement serveur
$serverScript = @"
#!/bin/bash
# Script de déploiement serveur VANGUS
# À exécuter sur le serveur après le transfert des fichiers

set -e

echo "🚀 Configuration du serveur VANGUS"
echo "===================================="

INSTALL_PATH="/software.weboost-il.com"
cd `$INSTALL_PATH/backend

echo ""
echo "Création des répertoires uploads..."
mkdir -p uploads/logos
mkdir -p uploads/contracts
mkdir -p uploads/invoices
chmod -R 755 uploads

echo "✅ Répertoires créés"

echo ""
echo "Vérification de Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

NODE_VERSION=`$(node -v)
echo "✅ Node.js `$NODE_VERSION trouvé"

echo ""
echo "Installation des dépendances (si nécessaire)..."
npm install --production

echo ""
echo "Construction (si nécessaire)..."
npm run build

echo ""
echo "===================================="
echo "✅ Configuration terminée!"
echo "===================================="
echo ""
echo "⚠️  Prochaines étapes:"
echo "1. Configurez Node.js dans le panel VANGUS:"
echo "   - Application root: `$INSTALL_PATH/backend"
echo "   - Startup file: dist/index.js"
echo "   - Node.js version: $NodeVersion.x"
echo ""
echo "2. Notez le port assigné et mettez à jour .env:"
echo "   nano `$INSTALL_PATH/backend/.env"
echo "   (Changez PORT=5000 par le port assigné)"
echo ""
echo "3. Demarrez l'application depuis le panel"
echo ""
echo "4. Accédez à: https://$DOMAIN"
echo ""
"@

$serverScript | Out-File -FilePath "deploy-server.sh" -Encoding UTF8 -Force
Write-Success "✅ Script serveur créé: deploy-server.sh"

# Guide de déploiement
$guide = @"
# 🚀 Guide de Déploiement VANGUS - Déploiement Automatique

## ✅ Préparation terminée!

Tous les fichiers ont été préparés et construits. Voici les prochaines étapes:

## 📤 ÉTAPE 1: Transférer les fichiers via FTP

### Option A: FileZilla (Recommandé)

1. **Installez FileZilla** si ce n'est pas déjà fait
2. **Ouvrez FileZilla**
3. **Connectez-vous**:
   - Host: `$FTP_HOST`
   - Username: `$FTP_USER`
   - Password: `$FTP_PASS`
   - Port: `21` (FTP) ou `22` (SFTP)

4. **Naviguez vers**: `$InstallPath`

5. **Transférez tous les fichiers**:
   - Sélectionnez tous les fichiers et dossiers du projet
   - Glissez-déposez vers le serveur
   - **Important**: Transférez aussi le fichier `.env` dans `backend/`

### Option B: WinSCP

1. **Installez WinSCP**
2. **Connectez-vous** avec les mêmes identifiants
3. **Transférez les fichiers**

## ⚙️ ÉTAPE 2: Configuration Node.js dans le Panel

1. **Connectez-vous au panel**: https://c9.vangus.io:8443

2. **Allez dans "Node.js Selector" ou "Setup Node.js App"**

3. **Créez une nouvelle application**:
   - **Application root**: `$FTP_PATH/backend`
   - **Application URL**: `$DOMAIN`
   - **Application Startup File**: `dist/index.js`
   - **Node.js Version**: `$NodeVersion.x`
   - **Port**: Notez le port assigné (ex: 3000, 5000, etc.)

4. **Mettez à jour le fichier .env**:
   ```bash
   # Connectez-vous en SSH ou utilisez le terminal du panel
   nano $FTP_PATH/backend/.env
   # Changez PORT=5000 par le port assigné
   # Sauvegardez: Ctrl+X, puis Y, puis Enter
   ```

## 🚀 ÉTAPE 3: Exécuter le script sur le serveur

1. **Connectez-vous en SSH** (si disponible) ou utilisez le terminal du panel

2. **Rendez le script exécutable**:
   ```bash
   cd $FTP_PATH
   chmod +x deploy-server.sh
   ```

3. **Exécutez le script**:
   ```bash
   ./deploy-server.sh
   ```

## ÉTAPE 4: Demarrer l'application

1. **Dans le panel VANGUS**, démarrez l'application Node.js

2. **Vérifiez les logs** pour s'assurer qu'il n'y a pas d'erreurs

## ✅ ÉTAPE 5: Vérifier le déploiement

1. **Accédez à**: https://$DOMAIN

2. **Testez la connexion**:
   - Email: `admin@weboost.com`
   - Password: `admin123`

## 📝 Informations de configuration

- **Base de données**: `$DB_NAME` sur `$DB_HOST`:$DB_PORT
- **Email SMTP**: `$Email` sur `$SMTP_HOST`:$SMTP_PORT
- **JWT Secret**: (généré automatiquement)
- **Node.js Version**: `$NodeVersion.x`
- **Domaine**: `$DOMAIN`

## 🔧 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que MariaDB est démarré
- Vérifiez les identifiants dans `.env`
- Vérifiez que la base de données existe

### Erreur de port
- Vérifiez le port assigné dans le panel Node.js
- Mettez à jour le `.env` avec le bon port

### Frontend ne se charge pas
- Vérifiez que les fichiers sont dans le bon répertoire
- Vérifiez la configuration Nginx/Apache

### Backend ne démarre pas
- Vérifiez les logs dans le panel Node.js
- Vérifiez que le port est correct dans `.env`
- Vérifiez que la base de données est accessible

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs dans le panel Node.js
2. Vérifiez les logs du backend
3. Contactez le support VANGUS si nécessaire

## ✅ Checklist

- [ ] Fichiers transférés via FTP
- [ ] Node.js configuré dans le panel
- [ ] Port assigné noté et mis à jour dans .env
- [ ] Script deploy-server.sh exécuté
- [ ] Application démarrée depuis le panel
- [ ] Site accessible sur https://$DOMAIN
- [ ] Connexion testée (admin@weboost.com / admin123)

---

**Bon déploiement! 🚀**
"@

$guide | Out-File -FilePath "GUIDE_DEPLOIEMENT_FINAL.md" -Encoding UTF8 -Force
Write-Success "✅ Guide de déploiement créé: GUIDE_DEPLOIEMENT_FINAL.md"

Write-Info ""
Write-Info "=============================================="
Write-Info "✅ PRÉPARATION TERMINÉE!"
Write-Info "=============================================="
Write-Info ""
Write-Success "Tous les fichiers ont été préparés et construits!"
Write-Info ""
Write-Info "📋 Prochaines étapes:"
Write-Info ""
Write-Info "1. Transférez tous les fichiers via FTP vers: $FTP_PATH"
Write-Info "   - Host: $FTP_HOST (ou $FTP_HOSTNAME)"
Write-Info "   - User: $FTP_USER"
Write-Info "   - Password: $FTP_PASS"
Write-Info "   - Path: $FTP_PATH"
Write-Info ""
Write-Info "2. Connectez-vous au panel: https://c9.vangus.io:8443"
Write-Info "   - Configurez Node.js"
Write-Info "   - Application root: $FTP_PATH/backend"
Write-Info "   - Notez le port assigné"
Write-Info ""
Write-Info "3. Exécutez sur le serveur:"
Write-Info "   cd $FTP_PATH"
Write-Info "   chmod +x deploy-server.sh"
Write-Info "   ./deploy-server.sh"
Write-Info ""
Write-Info "4. Demarrez l'application depuis le panel"
Write-Info ""
Write-Info "5. Accédez à: https://$DOMAIN"
Write-Info ""
Write-Info "📖 Consultez GUIDE_DEPLOIEMENT_FINAL.md pour plus de détails"
Write-Info ""
Write-Success "🚀 Bon déploiement!"

