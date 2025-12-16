# Script de déploiement du frontend avec corrections mobile
# Usage: .\deploy-frontend-fix.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Déploiement du frontend avec corrections mobile..." -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Erreur: Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

# Build du frontend
Write-Host "📦 Build du frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build du frontend" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "✅ Build terminé" -ForegroundColor Green

# Informations de connexion
$SERVER_IP = "51.15.254.112"
$SERVER_USER = "root"
$SERVER_PATH = "/var/www/weboost"

Write-Host ""
Write-Host "📤 Transfert des fichiers sur le serveur..." -ForegroundColor Yellow
Write-Host "   Serveur: $SERVER_USER@$SERVER_IP" -ForegroundColor Gray
Write-Host "   Chemin: $SERVER_PATH" -ForegroundColor Gray
Write-Host ""

# Vérifier si scp est disponible
if (-not (Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  SCP n'est pas disponible. Utilisez WinSCP ou transférez manuellement:" -ForegroundColor Yellow
    Write-Host "   Source: frontend\dist\*" -ForegroundColor Gray
    Write-Host "   Destination: $SERVER_USER@$SERVER_IP:$SERVER_PATH/frontend/dist/" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Puis exécutez sur le serveur:" -ForegroundColor Yellow
    Write-Host "   cd $SERVER_PATH" -ForegroundColor Gray
    Write-Host "   sudo systemctl reload nginx" -ForegroundColor Gray
    exit 0
}

# Transférer les fichiers
Write-Host "📤 Transfert en cours..." -ForegroundColor Yellow
scp -r frontend/dist/* "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/frontend/dist/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du transfert" -ForegroundColor Red
    Write-Host "   Essayez de transférer manuellement ou vérifiez votre connexion SSH" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Fichiers transférés" -ForegroundColor Green

# Redémarrer Nginx sur le serveur
Write-Host ""
Write-Host "🔄 Redémarrage de Nginx sur le serveur..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER_IP}" "sudo systemctl reload nginx && echo '✅ Nginx rechargé'"

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Impossible de redémarrer Nginx automatiquement" -ForegroundColor Yellow
    Write-Host "   Connectez-vous au serveur et exécutez:" -ForegroundColor Yellow
    Write-Host "   sudo systemctl reload nginx" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Videz le cache de votre navigateur (Ctrl+Shift+R)" -ForegroundColor Gray
Write-Host "   2. Testez sur mobile" -ForegroundColor Gray
Write-Host "   3. Le header devrait maintenant être correctement positionné" -ForegroundColor Gray

