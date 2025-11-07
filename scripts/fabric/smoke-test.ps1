# Robust PowerShell smoke test for Fabric gateway + QSCC + channel info
param(
  [string]$BaseUrl = 'http://localhost:4010'
)

$ErrorActionPreference = 'Stop'

function Get-Json($url) {
  try {
    $r = Invoke-RestMethod -Uri $url -TimeoutSec 30
    return $r
  } catch {
    Write-Warning "Request failed: $url"
    if ($_.Exception.Response) {
      try { $_.Exception.Response | Format-List * | Out-Host } catch {}
    } else { Write-Warning ($_.Exception.Message) }
    throw
  }
}

function Invoke-PostJson($url, $obj) {
  try {
    $json = $obj | ConvertTo-Json -Depth 5
    $r = Invoke-RestMethod -Method Post -Uri $url -ContentType 'application/json' -Body $json -TimeoutSec 60
    return $r
  } catch {
    Write-Warning "POST failed: $url"
    if ($_.Exception.Response) {
      try { $_.Exception.Response | Format-List * | Out-Host } catch {}
    } else { Write-Warning ($_.Exception.Message) }
    throw
  }
}

Write-Host "== GET /status ==" -ForegroundColor Cyan
$status = Get-Json "$BaseUrl/status"
$status | ConvertTo-Json -Depth 5 | Out-Host

if (-not $status.configured) { throw "Gateway not configured: $($status.issues -join ', ')" }

Write-Host "== GET /wallet ==" -ForegroundColor Cyan
$wallet = Get-Json "$BaseUrl/wallet"
$wallet | ConvertTo-Json -Depth 5 | Out-Host

Write-Host "== GET /qscc/block/0 ==" -ForegroundColor Cyan
$block0 = Get-Json "$BaseUrl/qscc/block/0"
$block0 | ConvertTo-Json -Depth 3 | Out-Host

Write-Host "== GET /channel/info ==" -ForegroundColor Cyan
$info = Get-Json "$BaseUrl/channel/info"
$info | ConvertTo-Json -Depth 5 | Out-Host

Write-Host "== POST /anchor-cid (dry-run) ==" -ForegroundColor Cyan
$ref = "ref-" + ([guid]::NewGuid().ToString('N').Substring(0,8))
$payload = @{ refId = $ref; type = 'TEST'; cid = 'bafkreiabcdef1234567890123456789012345678901234567890'; sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
try {
  $anchor = Invoke-PostJson "$BaseUrl/anchor-cid" $payload
  $anchor | ConvertTo-Json -Depth 5 | Out-Host
} catch {
  Write-Warning "anchor-cid failed (this may happen if chaincode isn't installed/approved)."
}

Write-Host "== GET /verify?refId=ping ==" -ForegroundColor Cyan
try {
  $verify = Get-Json "$BaseUrl/verify?refId=ping"
  $verify | ConvertTo-Json -Depth 5 | Out-Host
} catch {
  Write-Warning "verify failed (expected if chaincode isn't available)."
}

Write-Host "Smoke test finished." -ForegroundColor Green
