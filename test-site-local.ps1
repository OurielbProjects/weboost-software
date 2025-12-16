# Script PowerShell pour tester le site depuis Windows
# Ce script vérifie l'accessibilité du site depuis votre machine locale

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🔍 TEST DU SITE WEB BOOST" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$url = "http://51.15.254.112"
$apiUrl = "$url/api/health"

# Fonction pour afficher les erreurs
function Write-Error-Custom {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
}

# Fonction pour afficher les succès
function Write-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

# Fonction pour afficher les avertissements
function Write-Warning-Custom {
    param($message)
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# Test 1: Frontend
Write-Host "1️⃣  Test du Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Success "Le frontend répond correctement (HTTP $($response.StatusCode))"
        Write-Host "   Titre de la page: $($response.Content | Select-String -Pattern '<title>(.*?)</title>' | ForEach-Object { $_.Matches.Groups[1].Value })" -ForegroundColor Gray
    } else {
        Write-Warning-Custom "Le frontend répond avec le code HTTP $($response.StatusCode)"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 502) {
        Write-Error-Custom "Erreur 502 Bad Gateway - Le backend ne répond pas"
        Write-Host "   Solution: Vérifiez que le backend est démarré avec PM2" -ForegroundColor Gray
    } elseif ($statusCode -eq 404) {
        Write-Error-Custom "Erreur 404 Not Found - Le frontend n'est pas trouvé"
        Write-Host "   Solution: Vérifiez que les fichiers frontend sont déployés" -ForegroundColor Gray
    } elseif ($statusCode -eq 503) {
        Write-Error-Custom "Erreur 503 Service Unavailable - Nginx ne peut pas joindre le backend"
        Write-Host "   Solution: Vérifiez que le backend écoute sur le port 5000" -ForegroundColor Gray
    } elseif ($null -eq $statusCode) {
        Write-Error-Custom "Impossible de se connecter au serveur"
        Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Gray
        Write-Host "   Solution: Vérifiez que le serveur est accessible et que le port 80 est ouvert" -ForegroundColor Gray
    } else {
        Write-Error-Custom "Erreur HTTP $statusCode"
        Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

Write-Host ""

# Test 2: API Health Check
Write-Host "2️⃣  Test de l'API Backend..." -ForegroundColor Yellow
try {
    $apiResponse = Invoke-WebRequest -Uri $apiUrl -Method Get -TimeoutSec 10 -UseBasicParsing
    if ($apiResponse.StatusCode -eq 200) {
        $content = $apiResponse.Content | ConvertFrom-Json
        Write-Success "L'API backend répond correctement"
        Write-Host "   Status: $($content.status)" -ForegroundColor Gray
        Write-Host "   Database: $($content.database)" -ForegroundColor Gray
        
        if ($content.database -ne "connected") {
            Write-Warning-Custom "La base de données n'est pas connectée"
        }
    } else {
        Write-Warning-Custom "L'API répond avec le code HTTP $($apiResponse.StatusCode)"
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 502) {
        Write-Error-Custom "L'API ne répond pas (502) - Backend non démarré ou erreur"
        Write-Host "   Solution: Connectez-vous au serveur et vérifiez: pm2 logs weboost-backend" -ForegroundColor Gray
    } elseif ($null -eq $statusCode) {
        Write-Error-Custom "Impossible d'accéder à l'API"
        Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Gray
    } else {
        Write-Error-Custom "Erreur HTTP $statusCode lors de l'accès à l'API"
    }
}

Write-Host ""

# Test 3: Backend direct (si accessible)
Write-Host "3️⃣  Test du Backend direct (port 5000)..." -ForegroundColor Yellow
$backendDirectUrl = "http://51.15.254.112:5000/api/health"
try {
    $backendResponse = Invoke-WebRequest -Uri $backendDirectUrl -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($backendResponse.StatusCode -eq 200) {
        Write-Success "Le backend répond directement sur le port 5000"
        Write-Warning-Custom "Le backend est accessible directement - Vérifiez la configuration du pare-feu"
    }
} catch {
    Write-Host "   (Le backend n'est pas accessible directement, c'est normal si le pare-feu bloque le port 5000)" -ForegroundColor Gray
}

Write-Host ""

# Test 4: Vérification DNS/Ping
Write-Host "4️⃣  Test de connectivité réseau..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName "51.15.254.112" -Count 2 -Quiet
    if ($ping) {
        Write-Success "Le serveur est accessible (ping réussi)"
    } else {
        Write-Error-Custom "Le serveur ne répond pas au ping"
        Write-Host "   Vérifiez votre connexion internet" -ForegroundColor Gray
    }
} catch {
    Write-Error-Custom "Impossible de ping le serveur"
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Résumé
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "URL du site: $url" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Prochaines étapes si erreurs:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Connectez-vous au serveur:" -ForegroundColor White
Write-Host "   ssh root@51.15.254.112" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Vérifiez les services:" -ForegroundColor White
Write-Host "   systemctl status nginx" -ForegroundColor Gray
Write-Host "   pm2 status" -ForegroundColor Gray
Write-Host "   systemctl status postgresql" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Consultez les logs:" -ForegroundColor White
Write-Host "   pm2 logs weboost-backend" -ForegroundColor Gray
Write-Host "   tail -f /var/log/nginx/error.log" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Utilisez le script de diagnostic:" -ForegroundColor White
Write-Host "   ./diagnostic-serveur.sh" -ForegroundColor Gray
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan



