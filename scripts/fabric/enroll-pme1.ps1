param(
  [string]$GatewayBase = 'http://localhost:4010',
  [string]$Org = 'kiota'
)
$ErrorActionPreference = 'Stop'

Write-Host "Target: $GatewayBase (org=$Org)"

$repo = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $repo

$pmeFile = "fabric/org-$Org/wallet/pme1.id"
if (Test-Path $pmeFile) {
  Write-Host "Removing existing $pmeFile"
  Remove-Item -Force $pmeFile
}

Write-Host "Enrolling CA admin..."
Invoke-RestMethod -Uri "$GatewayBase/ca/admin/enroll" -Method Post | Out-Host

$body = @{ username = 'pme1'; affiliation = 'org1.department1' } | ConvertTo-Json -Compress
Write-Host "Registering + Enrolling pme1..."
Invoke-RestMethod -Uri "$GatewayBase/ca/register-enroll" -Method Post -ContentType 'application/json' -Body $body | Out-Host

Write-Host "Wallet:"
Invoke-RestMethod -Uri "$GatewayBase/wallet" | Out-Host

Write-Host "QSCC block 0:"
try { Invoke-RestMethod -Uri "$GatewayBase/qscc/block/0" | Out-Host } catch { $_.Exception.Response | Format-List * | Out-Host }

Write-Host "Channel info:"
try { Invoke-RestMethod -Uri "$GatewayBase/channel/info" | Out-Host } catch { $_.Exception.Response | Format-List * | Out-Host }
