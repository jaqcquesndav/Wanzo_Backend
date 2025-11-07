param(
  [int]$Number = 0,
  [string]$OutDir = "$(Split-Path -Parent $PSScriptRoot)\..\tmp\blocks"
)
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Force -Path $OutDir | Out-Null }
$uri = "http://localhost:4010/qscc/block/$Number"
Write-Host "Fetching block $Number from $uri"
$resp = curl -s $uri | ConvertFrom-Json
if (-not $resp.ok) { Write-Error "Gateway returned error for block $Number" }
$rawPath = Join-Path $OutDir "block$Number.json"
$decodedBin = [System.Convert]::FromBase64String($resp.block)
$binPath = Join-Path $OutDir "block$Number.bin"
$resp | ConvertTo-Json -Depth 10 | Out-File -Encoding UTF8 $rawPath
[IO.File]::WriteAllBytes($binPath, $decodedBin)
Write-Host "Saved JSON:   $rawPath"
Write-Host "Saved binary: $binPath"

# Optional: quick hash of binary
$sha256 = (Get-FileHash -Algorithm SHA256 $binPath).Hash.ToLower()
Write-Host "Binary SHA256: $sha256"
