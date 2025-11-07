param(
  [Parameter(Mandatory=$true)][string]$SamplesPath,
  [Parameter(Mandatory=$true)][string]$RepoPath
)
# Copies CCPs and (optionally) keys from Fabric Samples test-network into this repo structure.
# Usage:
#   ./scripts/fabric/import-from-samples.ps1 -SamplesPath C:\fabric-samples -RepoPath C:\Users\me\Desktop\CRES-DATA\Wanzo_Backend

$ErrorActionPreference = 'Stop'

function Copy-IfExists($src, $dst) {
  if (Test-Path $src) {
    New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
    Copy-Item -Force -Path $src -Destination $dst
    Write-Host "Copied: $src -> $dst"
  } else {
    Write-Warning "Missing: $src"
  }
}

# CCP JSONs from samples (adjust if your paths differ)
$org1Ccp = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org1.example.com\connection-org1.json'
$org2Ccp = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org2.example.com\connection-org2.json'
Copy-IfExists $org1Ccp (Join-Path $RepoPath 'fabric\org-kiota\ccp\connection.json')
Copy-IfExists $org2Ccp (Join-Path $RepoPath 'fabric\org-bank\ccp\connection.json')

# TLS certificates (peer and orderer) for Explorer
$org1PeerTls = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org1.example.com\peers\peer0.org1.example.com\tls\ca.crt'
$org2PeerTls = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org2.example.com\peers\peer0.org2.example.com\tls\ca.crt'
$ordererTls = Join-Path $SamplesPath 'test-network\organizations\ordererOrganizations\example.com\orderers\orderer.example.com\tls\ca.crt'
Copy-IfExists $org1PeerTls (Join-Path $RepoPath 'fabric\org-kiota\tls\peer\ca.crt')
Copy-IfExists $org2PeerTls (Join-Path $RepoPath 'fabric\org-bank\tls\peer\ca.crt')
Copy-IfExists $ordererTls (Join-Path $RepoPath 'fabric\org-kiota\tls\orderer\ca.crt')
Copy-IfExists $ordererTls (Join-Path $RepoPath 'fabric\org-bank\tls\orderer\ca.crt')

# Explorer admin credentials: use the default User1 from samples for each org
$org1UserKey = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp\keystore\priv_sk'
$org1UserCert = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org1.example.com\users\User1@org1.example.com\msp\signcerts\User1@org1.example.com-cert.pem'
$org2UserKey = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org2.example.com\users\User1@org2.example.com\msp\keystore\priv_sk'
$org2UserCert = Join-Path $SamplesPath 'test-network\organizations\peerOrganizations\org2.example.com\users\User1@org2.example.com\msp\signcerts\User1@org2.example.com-cert.pem'
Copy-IfExists $org1UserKey (Join-Path $RepoPath 'fabric\org-kiota\creds\admin\key.pem')
Copy-IfExists $org1UserCert (Join-Path $RepoPath 'fabric\org-kiota\creds\admin\cert.pem')
Copy-IfExists $org2UserKey (Join-Path $RepoPath 'fabric\org-bank\creds\admin\key.pem')
Copy-IfExists $org2UserCert (Join-Path $RepoPath 'fabric\org-bank\creds\admin\cert.pem')

Write-Host "Imported CCPs, TLS certs, and default admin certs/keys for Explorer."
