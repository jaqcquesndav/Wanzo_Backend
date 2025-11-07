param(
  [string]$WSLDistro = 'Ubuntu-20.04',
  [string]$PeerContainer = 'peer0.org2.example.com',
  [string]$AdminMSPContainerPath = '/opt/adminmsp_org2',
  [string]$PeerLocalMSPPath = '/etc/hyperledger/fabric/msp',
  [string]$ChaincodePkg = '/opt/cc/anchoring_1.tgz',
  [string]$ChannelLess = 'true'
)

$ErrorActionPreference = 'Stop'

function Say($msg,[ConsoleColor]$c=[ConsoleColor]::Cyan){
  $old=$Host.UI.RawUI.ForegroundColor; $Host.UI.RawUI.ForegroundColor=$c; Write-Host "==> $msg"; $Host.UI.RawUI.ForegroundColor=$old
}

function Exec($cmd){ Say $cmd; & $cmd }

Say "Verify Admin@org2 MSP exists in WSL ($WSLDistro)"
$adminMspPath = "~/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp"
$exists = & wsl.exe -d $WSLDistro -- bash -lc "test -d $adminMspPath && echo OK || echo MISSING"
if (-not $exists -or ($exists.Trim() -ne 'OK')) {
  throw "Admin MSP not found at $adminMspPath inside $WSLDistro. Start test-network with CAs in WSL first."
}

Say "Copy Admin MSP from WSL to ${PeerContainer}:${AdminMSPContainerPath}"
& wsl.exe -d $WSLDistro -- bash -lc "cd $adminMspPath && tar -czf - ." |
  docker exec -i $PeerContainer bash -lc "rm -rf $AdminMSPContainerPath && mkdir -p $AdminMSPContainerPath && tar -xzf - -C $AdminMSPContainerPath && ls -1 $AdminMSPContainerPath"

Say "Align peer local admincert with Admin@org2 signcert"
docker exec $PeerContainer bash -lc "set -e; mkdir -p $PeerLocalMSPPath/admincerts; cp -f $AdminMSPContainerPath/signcerts/cert.pem $PeerLocalMSPPath/admincerts/admincert.pem; ls -l $PeerLocalMSPPath/admincerts"

Say "Ensure NodeOUs disabled in peer local MSP"
docker exec $PeerContainer bash -lc "set -e; printf 'NodeOUs:\n  Enable: false\n' > $PeerLocalMSPPath/config.yaml; sed -n '1,4p' $PeerLocalMSPPath/config.yaml"

Say "Restart peer container to pick up MSP changes"
docker restart $PeerContainer | Out-Null
Start-Sleep -Seconds 2

Say "Install chaincode as Org2 admin"
$envs = @(
  'CORE_PEER_LOCALMSPID=Org2MSP',
  "CORE_PEER_MSPCONFIGPATH=$AdminMSPContainerPath"
)
$envPrefix = ($envs -join ' ')
docker exec $PeerContainer bash -lc "$envPrefix peer lifecycle chaincode install $ChaincodePkg || true"

Say "Query installed packages"
docker exec $PeerContainer bash -lc "$envPrefix peer lifecycle chaincode queryinstalled || true"

Say "Done"
