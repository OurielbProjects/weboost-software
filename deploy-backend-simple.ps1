# Script de déploiement simple du backend uniquement
# Usage: .\deploy-backend-simple.ps1

$ErrorActionPreference = "Stop"

$SERVER_IP = "51.15.254.112"
$SERVER_USER = "root"
$BACKEND_DIR = "/var/www/weboost/backend"

Write-Host "🚀 Déploiement Backend WeBoost" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Vérifier que le build existe
if (-not (Test-Path "backend\dist")) {
    Write-Host "[ERROR] Le répertoire backend\dist n'existe pas. Compilez d'abord avec 'npm run build'" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] ✅ Backend compilé trouvé" -ForegroundColor Green

# Transférer directement les fichiers dist via SCP
Write-Host "[INFO] 📤 Transfert des fichiers vers le serveur..." -ForegroundColor Green

# Créer une archive temporaire
$archiveName = "weboost-backend-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz"

# Utiliser tar depuis Git Bash si disponible
$tarCmd = Get-Command "tar" -ErrorAction SilentlyContinue

if ($tarCmd) {
    Push-Location backend
    try {
        Write-Host "[INFO] 📦 Création de l'archive..." -ForegroundColor Green
        tar -czf "../$archiveName" dist package.json package-lock.json .env 2>&1 | Out-Null
        
        if (Test-Path "../$archiveName") {
            Write-Host "[INFO] ✅ Archive créée: $archiveName" -ForegroundColor Green
            
            # Transférer
            Write-Host "[INFO] 📤 Transfert vers le serveur..." -ForegroundColor Green
            scp "../$archiveName" "${SERVER_USER}@${SERVER_IP}:/tmp/weboost-backend-deploy.tar.gz"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[INFO] ✅ Fichiers transférés" -ForegroundColor Green
                
                # Déployer et redémarrer
                Write-Host "[INFO] 🚀 Déploiement et redémarrage sur le serveur..." -ForegroundColor Green
                ssh "${SERVER_USER}@${SERVER_IP}" "cd $BACKEND_DIR && tar -xzf /tmp/weboost-backend-deploy.tar.gz && npm install --production && pm2 restart weboost-backend && pm2 save && echo '✅ Déploiement terminé' && pm2 status"
                
                Write-Host "[INFO] ✅ Déploiement terminé !" -ForegroundColor Green
            } else {
                Write-Host "[ERROR] Erreur lors du transfert" -ForegroundColor Red
            }
            
            # Nettoyer
            Remove-Item "../$archiveName" -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "[ERROR] Échec de la création de l'archive" -ForegroundColor Red
        }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "[ERROR] tar n'est pas disponible. Utilisez Git Bash ou WSL pour exécuter le script bash équivalent." -ForegroundColor Red
    Write-Host "[INFO] Ou transférez manuellement les fichiers avec:" -ForegroundColor Yellow
    Write-Host "  scp -r backend/dist backend/package.json backend/package-lock.json backend/.env ${SERVER_USER}@${SERVER_IP}:${BACKEND_DIR}/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Pour voir les logs: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs weboost-backend'" -ForegroundColor Cyan



