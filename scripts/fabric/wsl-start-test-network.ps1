param(
  [string]$Distro = 'Ubuntu-20.04',
  [string]$Channel = 'mychannel',
  [string]$Branch = 'main'
)

$ErrorActionPreference = 'Stop'

function Exec($cmd) {
  Write-Host "==> $cmd" -ForegroundColor Cyan
  & $cmd
}

Write-Host "Starting Fabric test-network in WSL distro '$Distro'..." -ForegroundColor Green

# Ensure WSL is available
Exec { wsl.exe -l -q | Out-Null }

# Start/prepare fabric-samples and bring up the network with CAs + CouchDB
$bash = "set -e && if [ ! -d '~/fabric-samples' ]; then git clone https://github.com/hyperledger/fabric-samples.git -b $Branch ~/fabric-samples; fi && cd ~/fabric-samples/test-network && bash network.sh down || true && bash network.sh up createChannel -c $Channel -ca -s couchdb && echo NETWORK_UP=1"

Exec { wsl.exe -d $Distro -- bash -lc "$bash" }

Write-Host "Fabric test-network is up. Next, import CCPs into this repo using the PowerShell script:" -ForegroundColor Green
Write-Host "  ./scripts/fabric/import-from-samples.ps1 -SamplesPath C:\fabric-samples -RepoPath $pwd" -ForegroundColor Yellow
Write-Host "If your samples are elsewhere, replace -SamplesPath accordingly (e.g. C:\\Users\\you\\fabric-samples)." -ForegroundColor Yellow
