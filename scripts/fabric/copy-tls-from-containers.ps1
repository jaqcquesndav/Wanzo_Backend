param(
  [string]$NetworkName = 'test-network',
  [string]$Org1PeerContainer = 'peer0.org1.example.com',
  [string]$Org2PeerContainer = 'peer0.org2.example.com',
  [string]$OrdererContainer = 'orderer.example.com'
)
$ErrorActionPreference = 'Stop'

function Copy-From-Container($container, $src, $dst) {
  Write-Host "Copying $src from $container -> $dst" -ForegroundColor Cyan
  $dstDir = Split-Path $dst
  if ($dstDir) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
  # Use $(...) to avoid colon parsing issues in PowerShell interpolation
  docker cp "$("$container" + ":" + "$src")" "$dst"
}

# TLS
Copy-From-Container $Org1PeerContainer '/etc/hyperledger/fabric/tls/ca.crt' 'fabric/org-kiota/tls/peer/ca.crt'
Copy-From-Container $Org2PeerContainer '/etc/hyperledger/fabric/tls/ca.crt' 'fabric/org-bank/tls/peer/ca.crt'
Copy-From-Container $OrdererContainer '/etc/hyperledger/fabric/tls/ca.crt' 'fabric/org-kiota/tls/orderer/ca.crt'
Copy-From-Container $OrdererContainer '/etc/hyperledger/fabric/tls/ca.crt' 'fabric/org-bank/tls/orderer/ca.crt'

# Default User1 cert/key (for Explorer admin)
Copy-From-Container $Org1PeerContainer '/etc/hyperledger/fabric/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem' 'fabric/org-kiota/creds/admin/cert.pem'
Copy-From-Container $Org1PeerContainer '/etc/hyperledger/fabric/users/User1@org1.example.com/msp/keystore/priv_sk' 'fabric/org-kiota/creds/admin/key.pem'
Copy-From-Container $Org2PeerContainer '/etc/hyperledger/fabric/users/User1@org2.example.com/msp/signcerts/User1@org2.example.com-cert.pem' 'fabric/org-bank/creds/admin/cert.pem'
Copy-From-Container $Org2PeerContainer '/etc/hyperledger/fabric/users/User1@org2.example.com/msp/keystore/priv_sk' 'fabric/org-bank/creds/admin/key.pem'

Write-Host "Done. Restart Explorer: docker compose restart explorer" -ForegroundColor Green
