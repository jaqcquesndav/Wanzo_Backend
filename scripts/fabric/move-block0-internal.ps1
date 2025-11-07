$root = Split-Path -Parent $PSScriptRoot
$extFile = Join-Path (Split-Path $root) 'block0.json'
$destDir = Join-Path $root 'tmp\blocks'
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Force -Path $destDir | Out-Null }
if (Test-Path $extFile) {
  Move-Item $extFile (Join-Path $destDir 'block0.json') -Force
  Write-Host "Moved external block0.json into $destDir"
} else {
  Write-Host "No external block0.json found at $extFile"
}
