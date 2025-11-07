param(
  [string]$Root = 'C:\Users\knkjo\Desktop\CRES-DATA',
  [string]$ProjectName = 'Wanzo_Backend'
)

$ErrorActionPreference = 'Stop'

function Say($m,[ConsoleColor]$c=[ConsoleColor]::Cyan){ $o=$Host.UI.RawUI.ForegroundColor; $Host.UI.RawUI.ForegroundColor=$c; Write-Host "==> $m"; $Host.UI.RawUI.ForegroundColor=$o }
function EnsureDir([string]$p){ if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null } }
function MoveIfExists([string]$src,[string]$dst){ if (Test-Path $src) { EnsureDir (Split-Path -Parent $dst); Say "Move $src -> $dst"; Move-Item -Force -Path $src -Destination $dst } else { Say "Skip (missing): $src" [ConsoleColor]::DarkGray } }
function MoveContentsIfExists([string]$srcDir,[string]$dstDir){ if (Test-Path $srcDir) { EnsureDir $dstDir; Say "Move contents of $srcDir -> $dstDir"; Get-ChildItem -Force -Path $srcDir | Move-Item -Force -Destination $dstDir; Remove-Item -Force -Recurse -ErrorAction SilentlyContinue $srcDir } else { Say "Skip (missing): $srcDir" [ConsoleColor]::DarkGray } }

$proj = Join-Path $Root $ProjectName
if (-not (Test-Path $proj)) { throw "Project path not found: $proj" }

# Ensure target structure
EnsureDir (Join-Path $proj '.fabric')
EnsureDir (Join-Path $proj '.fabric\bin')
EnsureDir (Join-Path $proj '.fabric\builders')
EnsureDir (Join-Path $proj '.fabric\config')
EnsureDir (Join-Path $proj 'fabric\chaincode-packages')
EnsureDir (Join-Path $proj 'scripts\fabric')
EnsureDir (Join-Path $proj 'tmp')

# Move common stray items from $Root into $proj
MoveIfExists (Join-Path $Root 'bin')                   (Join-Path $proj '.fabric\bin')
MoveIfExists (Join-Path $Root 'builders')              (Join-Path $proj '.fabric\builders')
MoveIfExists (Join-Path $Root 'config')                (Join-Path $proj '.fabric\config')
MoveContentsIfExists (Join-Path $Root 'tmp')           (Join-Path $proj 'tmp')
MoveIfExists (Join-Path $Root 'anchoring_1.tgz')       (Join-Path $proj 'fabric\chaincode-packages\anchoring_1.tgz')
MoveIfExists (Join-Path $Root 'install-fabric.sh')     (Join-Path $proj 'scripts\fabric\install-fabric.sh')

Say "Done. Current tree (top-level):"
Get-ChildItem -Force -Name $proj
