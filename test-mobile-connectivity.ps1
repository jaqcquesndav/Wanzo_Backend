# Script de test de connectivite pour application mobile
# Teste l'acces au backend depuis le reseau local

Write-Host "=== Test de connectivite mobile Wanzo Backend ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier l'adresse IP locale
Write-Host "1. Adresse IP de la machine:" -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*"}).IPAddress
Write-Host "   IP: $ipAddress" -ForegroundColor Green
Write-Host ""

# 2. Verifier que le port 8000 est ouvert
Write-Host "2. Verification du port 8000 (API Gateway):" -ForegroundColor Yellow
try {
    $portTest = Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue
    if ($portTest.TcpTestSucceeded) {
        Write-Host "   OK Port 8000 est accessible" -ForegroundColor Green
    } else {
        Write-Host "   ERREUR Port 8000 n'est pas accessible - Verifiez que Docker est lance" -ForegroundColor Red
    }
} catch {
    Write-Host "   ERREUR Impossible de tester le port" -ForegroundColor Red
}
Write-Host ""

# 3. Tester l'endpoint health de l'API Gateway
Write-Host "3. Test de l'API Gateway:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
    Write-Host "   OK API Gateway repond (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ERREUR API Gateway ne repond pas" -ForegroundColor Red
    Write-Host "   Detail: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. Verifier la regle de pare-feu
Write-Host "4. Regles de pare-feu pour le port 8000:" -ForegroundColor Yellow
try {
    $firewallRule = Get-NetFirewallRule -DisplayName "Wanzo Backend API Gateway" -ErrorAction SilentlyContinue
    if ($firewallRule) {
        Write-Host "   OK Regle de pare-feu existe deja" -ForegroundColor Green
    } else {
        Write-Host "   ! Aucune regle de pare-feu trouvee" -ForegroundColor Yellow
        Write-Host "   Pour creer la regle, executez en tant qu'admin:" -ForegroundColor Yellow
        Write-Host '   New-NetFirewallRule -DisplayName "Wanzo Backend API Gateway" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -Profile Private,Domain' -ForegroundColor Gray
    }
} catch {
    Write-Host "   ! Impossible de verifier le pare-feu" -ForegroundColor Yellow
}
Write-Host ""

# 5. Instructions pour l'application mobile
Write-Host "=== Configuration pour l'application mobile ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL de base a utiliser dans l'application mobile:" -ForegroundColor Yellow
Write-Host "   API_GATEWAY_URL=http://$ipAddress:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Configuration Auth0 (deja configuree):" -ForegroundColor Yellow
Write-Host "   AUTH0_DOMAIN=dev-tezmln0tk0g1gouf.eu.auth0.com"
Write-Host "   AUTH0_CLIENT_ID=PIukJBLfFwQI7slecXaVED61b7ya8IPC"
Write-Host "   AUTH0_AUDIENCE=https://api.wanzo.com"
Write-Host ""

# 6. Test depuis un appareil mobile
Write-Host "6. Pour tester depuis votre telephone/emulateur:" -ForegroundColor Yellow
Write-Host "   - Assurez-vous que votre appareil est sur le meme reseau WiFi" -ForegroundColor White
Write-Host "   - Ouvrez un navigateur sur le telephone" -ForegroundColor White
Write-Host "   - Accedez a: http://$ipAddress:8000/health" -ForegroundColor White
Write-Host "   - Vous devriez voir une reponse JSON" -ForegroundColor White
Write-Host ""

Write-Host "=== Endpoints disponibles pour la gestion commerciale ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: http://$ipAddress:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Exemples d'endpoints:" -ForegroundColor Yellow
Write-Host "   GET  /gestion-commerciale/products"
Write-Host "   POST /gestion-commerciale/orders"
Write-Host "   GET  /gestion-commerciale/customers"
Write-Host "   POST /gestion-commerciale/invoices"
Write-Host ""

Write-Host "Pour voir tous les endpoints disponibles, visitez:" -ForegroundColor Yellow
Write-Host "   http://$ipAddress:8000/api-docs" -ForegroundColor Green
Write-Host ""
