# Script de déploiement automatique pour Scaleway
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

# Configuration
$SERVER_IP = "51.15.254.112"
$SERVER_USER = "root"
$APP_DIR = "/var/www/weboost"

# Couleurs
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }

Write-Info "🚀 Déploiement Automatique WeBoost sur Scaleway"
Write-Info "================================================"

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Error "Exécutez ce script depuis la racine du projet"
    exit 1
}

# Vérifier que le fichier .env existe
if (-not (Test-Path "backend/.env")) {
    Write-Warning "Le fichier backend/.env n'existe pas"
    if (Test-Path "backend/.env.example") {
        Write-Info "Création du fichier .env depuis .env.example..."
        Copy-Item "backend/.env.example" "backend/.env"
        Write-Warning "⚠️  Éditez backend/.env avec vos vraies valeurs"
        Write-Warning "⚠️  Variables importantes :"
        Write-Warning "   - DB_PASSWORD : Mot de passe PostgreSQL"
        Write-Warning "   - JWT_SECRET : Générez avec : node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`""
        Write-Warning "   - SMTP_USER et SMTP_PASSWORD : Vos informations email"
        Read-Host "Appuyez sur Entrée quand vous avez édité le fichier .env"
    } else {
        Write-Error "Fichier backend/.env.example introuvable. Créez backend/.env manuellement."
        exit 1
    }
}

# Construire le backend
Write-Info "Étape 1: Construction du backend..."
Push-Location "backend"
try {
    npm install --production
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de l'installation des dépendances backend"
        exit 1
    }
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de la construction du backend"
        exit 1
    }
    Write-Info "✅ Backend construit"
} finally {
    Pop-Location
}

# Construire le frontend
Write-Info "Étape 2: Construction du frontend..."
Push-Location "frontend"
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de l'installation des dépendances frontend"
        exit 1
    }
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erreur lors de la construction du frontend"
        exit 1
    }
    Write-Info "✅ Frontend construit"
} finally {
    Pop-Location
}

# Créer l'archive
Write-Info "Étape 3: Création de l'archive..."
$archiveName = "weboost-deploy.tar.gz"

# Utiliser tar si disponible (Git Bash, WSL)
if (Get-Command "tar" -ErrorAction SilentlyContinue) {
    tar -czf $archiveName `
        backend/dist `
        backend/package.json `
        backend/package-lock.json `
        backend/.env `
        frontend/dist `
        ecosystem.config.js `
        --exclude='node_modules' `
        --exclude='*.log' `
        --exclude='.git'
} else {
    Write-Warning "tar n'est pas disponible. Utilisez Git Bash ou WSL pour exécuter deploy-complet.sh"
    Write-Info "Ou installez tar pour Windows"
    exit 1
}

# Transférer sur le serveur
Write-Info "Étape 4: Transfert vers le serveur..."
scp $archiveName "${SERVER_USER}@${SERVER_IP}:/tmp/"

# Déployer sur le serveur
Write-Info "Étape 5: Déploiement sur le serveur..."
ssh "${SERVER_USER}@${SERVER_IP}" @"
set -e

APP_DIR="/var/www/weboost"
BACKEND_DIR="\$APP_DIR/backend"

echo "📦 Extraction de l'archive..."
mkdir -p \$APP_DIR
cd \$APP_DIR
tar -xzf /tmp/weboost-deploy.tar.gz
rm /tmp/weboost-deploy.tar.gz

echo "📦 Installation des dépendances backend..."
cd \$BACKEND_DIR
npm install --production

echo "📁 Création des répertoires uploads..."
mkdir -p uploads/logos uploads/contracts uploads/invoices
chmod -R 755 uploads

echo "✅ Déploiement terminé !"
"@

# Nettoyer
Remove-Item $archiveName -Force

Write-Info "✅ Déploiement terminé !"
Write-Info ""
Write-Info "📋 Prochaines étapes sur le serveur :"
Write-Info ""
Write-Info "1. Connectez-vous : ssh root@51.15.254.112"
Write-Info "2. Allez dans : cd /var/www/weboost"
Write-Info "3. Démarrez avec PM2 : pm2 start ecosystem.config.js"
Write-Info "4. Sauvegardez : pm2 save"
Write-Info ""
Write-Info "📖 Consultez DEPLOY_FINAL.md pour les instructions complètes"




