# Script PowerShell pour réinitialiser rapidement le mot de passe admin
# Usage: .\reset-admin-quick.ps1

$SERVER_URL = "http://51.15.254.112"
$SECRET = "RESET_ADMIN_2024"
$EMAIL = "admin@weboost.com"
$PASSWORD = "Admin@weBoost123"

Write-Host "🔐 Réinitialisation du mot de passe admin..." -ForegroundColor Cyan
Write-Host ""

$body = @{
    secret = $SECRET
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

try {
    Write-Host "📡 Envoi de la requête au serveur..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$SERVER_URL/api/auth/emergency-reset-admin" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host ""
    Write-Host "✅ Succès!" -ForegroundColor Green
    Write-Host $response.message -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Vos identifiants:" -ForegroundColor Cyan
    Write-Host "   Email: $EMAIL" -ForegroundColor White
    Write-Host "   Mot de passe: $PASSWORD" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 N'oubliez pas de changer le secret dans .env après!" -ForegroundColor Yellow
} catch {
    Write-Host ""
    Write-Host "❌ Erreur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Vérifiez que:" -ForegroundColor Yellow
    Write-Host "   1. Le serveur backend est en cours d'exécution" -ForegroundColor Gray
    Write-Host "   2. L'URL du serveur est correcte" -ForegroundColor Gray
    Write-Host "   3. Vous avez accès au réseau" -ForegroundColor Gray
}

