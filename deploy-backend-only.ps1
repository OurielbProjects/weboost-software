# Script de déploiement rapide du backend uniquement
# Usage: .\deploy-backend-only.ps1

$ErrorActionPreference = "Stop"

# Configuration
$SERVER_IP = "51.15.254.112"
$SERVER_USER = "root"
$APP_DIR = "/var/www/weboost"
$BACKEND_DIR = "$APP_DIR/backend"

# Couleurs
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Green }
function Write-Error { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Warning { Write-Host "[WARNING] $args" -ForegroundColor Yellow }

Write-Info "🚀 Déploiement Backend WeBoost"
Write-Info "==============================="

# Vérifier que le répertoire backend existe
if (-not (Test-Path "backend")) {
    Write-Error "Le répertoire backend n'existe pas"
    exit 1
}

# Vérifier que le build existe
if (-not (Test-Path "backend\dist")) {
    Write-Error "Le répertoire backend\dist n'existe pas. Exécutez 'npm run build' d'abord."
    exit 1
}

Write-Info "✅ Backend compilé trouvé"

# Créer une archive temporaire avec uniquement les fichiers backend nécessaires
Write-Info "📦 Création de l'archive du backend..."
$archiveName = "weboost-backend-deploy.tar.gz"

# Utiliser tar si disponible
if (Get-Command "tar" -ErrorAction SilentlyContinue) {
    Push-Location backend
    try {
        tar -czf "../$archiveName" `
            dist `
            package.json `
            package-lock.json `
            .env `
            uploads `
            --exclude='node_modules' `
            --exclude='*.log'
        Write-Info "✅ Archive créée: $archiveName"
    } finally {
        Pop-Location
    }
} else {
    Write-Error "tar n'est pas disponible. Installez Git Bash ou utilisez WSL."
    exit 1
}

# Transférer sur le serveur
Write-Info "📤 Transfert vers le serveur..."
scp $archiveName "${SERVER_USER}@${SERVER_IP}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Erreur lors du transfert"
    Remove-Item $archiveName -Force
    exit 1
}

# Déployer et redémarrer sur le serveur
Write-Info "🚀 Déploiement et redémarrage sur le serveur..."
ssh "${SERVER_USER}@${SERVER_IP}" @"
set -e

APP_DIR="$APP_DIR"
BACKEND_DIR="$BACKEND_DIR"

echo "📦 Extraction de l'archive..."
cd \$APP_DIR
tar -xzf /tmp/$archiveName
rm /tmp/$archiveName

echo "📦 Installation des dépendances backend..."
cd \$BACKEND_DIR
npm install --production

echo "🔄 Redémarrage du backend avec PM2..."
pm2 restart weboost-backend || pm2 start ecosystem.config.js
pm2 save

echo "✅ Déploiement terminé !"
echo ""
echo "📋 Statut PM2:"
pm2 status
echo ""
echo "📋 Derniers logs (10 lignes):"
pm2 logs weboost-backend --lines 10 --nostream || true
"@

# Nettoyer
Remove-Item $archiveName -Force

Write-Info "✅ Déploiement terminé !"
Write-Info ""
Write-Info "Vérifiez les logs avec: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs weboost-backend'"



