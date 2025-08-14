# Script PowerShell pour tester la validation JWT
# Ce script vérifie si le certificat peut être utilisé pour valider le JWT

# Vérifier si le certificat existe
$certPath = "c:\Users\DevSpace\Wanzobe\Wanzo_Backend\apps\admin-service\auth0-certificate.pem"
if (Test-Path $certPath) {
    Write-Host "Le certificat existe: $certPath" -ForegroundColor Green
    $cert = Get-Content $certPath
    Write-Host "Contenu du certificat (premières lignes):"
    $cert | Select-Object -First 3
} else {
    Write-Host "Erreur: Le certificat n'existe pas à l'emplacement: $certPath" -ForegroundColor Red
}

# Vérifier la structure du token JWT
$token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRlQUJzRldHVC1yTnZCeTVjTGNLWiJ9.eyJpc3MiOiJodHRwczovL2Rldi10ZXptbG4wdGswZzFnb3VmLmV1LmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMzUzMTY4NjEyMTI2NzA3MDQ4OSIsImF1ZCI6WyJodHRwczovL2FwaS53YW56by5jb20iLCJodHRwczovL2Rldi10ZXptbG4wdGswZzFnb3VmLmV1LmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NTUxNzk1OTIsImV4cCI6MTc1NTI2NTk5Miwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsImF6cCI6IjQzZDY0a2dzVll5Q1pIRUZzYXg3emxSQlZVaXJhQ0tMIiwicGVybWlzc2lvbnMiOlsiYWNjb3VudGluZzpyZWFkIiwiYWNjb3VudGluZzp3cml0ZSIsImFkbWluOmZ1bGwiLCJhbmFseXRpY3M6cmVhZCIsImFuYWx5dGljczp3cml0ZSIsImluc3RpdHV0aW9uOm1hbmFnZSIsIm1vYmlsZTpyZWFkIiwibW9iaWxlOndyaXRlIiwicG9ydGZvbGlvOnJlYWQiLCJwb3J0Zm9saW86d3JpdGUiLCJzZXR0aW5nczptYW5hZ2UiLCJ1c2VyczptYW5hZ2UiXX0.d7MeFk4BYzy6L3kg7BdWPc8EbzGfhO8IOLd4EPyRl04PU-FCEYKQzev2_-UdVUM3QUWJzidVZU45MpAR44q3fXPO_M_J5oFweNYwXZok7mnov2prCpROODjRcCAGlstnT5qG90eUCUyIV00AhmmJ2SlyUNCdFttUEtj8oNRaW0756q4PblZK4E9aLZ6nHrKbi3t-C1XyiO5CcuPVASsvOr7j48Fcc_05F34DpXLCy8dlchHLzZtBdi0lnpn1tZE6G6CR39gTld-WL6BiAP5Ytee9bcDAPaGEg-xcqRAuOnieaPWc4Nw7RkLUyqe4WxBnfQU5HdNcEzA6vOIZU8R4xg"

Write-Host "`nAnalyse du token JWT:" -ForegroundColor Cyan

# Fonction pour décoder Base64Url
function ConvertFrom-Base64Url {
    param([string]$base64Url)
    # Remplace les caractères Base64URL par les caractères Base64 standard
    $base64 = $base64Url.Replace('-', '+').Replace('_', '/')
    # Ajoute le padding si nécessaire
    switch ($base64.Length % 4) {
        0 { break }
        2 { $base64 += "==" }
        3 { $base64 += "=" }
    }
    return [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($base64))
}

# Décoder les parties du JWT
$parts = $token.Split('.')
Write-Host "Header: " -NoNewline
$header = ConvertFrom-Base64Url $parts[0]
Write-Host $header -ForegroundColor Yellow

Write-Host "Payload: " -NoNewline
$payload = ConvertFrom-Base64Url $parts[1]
Write-Host $payload -ForegroundColor Yellow

# Extraire des informations importantes du payload
$payloadObj = ConvertFrom-Json $payload
Write-Host "`nInformations importantes:" -ForegroundColor Cyan
Write-Host "Issuer (iss): $($payloadObj.iss)" -ForegroundColor Green
Write-Host "Subject (sub): $($payloadObj.sub)" -ForegroundColor Green
Write-Host "Audience (aud): $($payloadObj.aud -join ', ')" -ForegroundColor Green
$iat = [DateTimeOffset]::FromUnixTimeSeconds($payloadObj.iat).DateTime
$exp = [DateTimeOffset]::FromUnixTimeSeconds($payloadObj.exp).DateTime
Write-Host "Émis le (iat): $iat" -ForegroundColor Green
Write-Host "Expire le (exp): $exp" -ForegroundColor Green

# Vérifier si le token a expiré
$now = Get-Date
if ($now -gt $exp) {
    Write-Host "⚠️ Le token a expiré!" -ForegroundColor Red
} else {
    $timeRemaining = $exp - $now
    Write-Host "✅ Le token est valide pour encore $([math]::Round($timeRemaining.TotalHours, 2)) heures" -ForegroundColor Green
}

# Afficher les permissions
Write-Host "`nPermissions:" -ForegroundColor Cyan
foreach ($permission in $payloadObj.permissions) {
    Write-Host "- $permission" -ForegroundColor Yellow
}

# Résultat de l'analyse
Write-Host "`nRésultat final:" -ForegroundColor Cyan
if ($now -gt $exp) {
    Write-Host "❌ Le token est expiré mais la signature pourrait être valide." -ForegroundColor Red
} else {
    Write-Host "✅ Le token n'est pas expiré et a le format correct." -ForegroundColor Green
    Write-Host "Pour la validation complète de la signature, une vérification avec la clé publique est nécessaire." -ForegroundColor Green
}
