Param(
  [string]$Channel = "mychannel",
  [string]$ChaincodeName = "anchoring",
  [string]$Label = "anchoring_1",
  [string]$Version = "1.0",
  [int]$Sequence = 1,
  [string]$Policy = "OR('Org1MSP.member','Org2MSP.member')",
  [string]$Orderer = "orderer.example.com:7050",
  [string]$OrdererCA = "/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem",
  [string]$Peer0Org1 = "peer0.org1.example.com",
  [string]$Peer0Org2 = "peer0.org2.example.com",
  [string]$Org1MSP = "Org1MSP",
  [string]$Org2MSP = "Org2MSP",
  [string]$Org1AdminMSPPath = "/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp",
  [string]$Org2AdminMSPPath = "/organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp",
  [string]$Org1TLSRoot = "/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt",
  [string]$Org2TLSRoot = "/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt",
  [string]$Lang = "node",
  [switch]$InitRequired
)

$ErrorActionPreference = 'Stop'

function Invoke-PeerCmd {
  param(
    [Parameter(Mandatory)] [string]$PeerContainer,
    [hashtable]$Env = @{},
    [Parameter(Mandatory)] [string]$Cmd
  )
  $envArgs = @()
  foreach ($k in $Env.Keys) { $envArgs += @('-e', "$k=$($Env[$k])") }
  $full = "docker exec -i $PeerContainer bash -lc `"$Cmd`""
  Write-Host "→ $full" -ForegroundColor Cyan
  docker exec @envArgs -i $PeerContainer bash -lc $Cmd | Write-Host
}

function Invoke-PackageChaincode {
  param(
    [Parameter(Mandatory)] [string]$PeerContainer,
    [Parameter(Mandatory)] [string]$SrcHostPath,
    [Parameter(Mandatory)] [string]$Label
  )
  Write-Host "== Packaging chaincode on $PeerContainer ==" -ForegroundColor Yellow
  $dst = "/opt/cc/$Label"
  docker exec -i $PeerContainer bash -lc "rm -rf $dst && mkdir -p $dst"
  docker cp (Join-Path $SrcHostPath ".") "$PeerContainer`:$dst/"
  Invoke-PeerCmd -PeerContainer $PeerContainer -Env @{} -Cmd "peer lifecycle chaincode package /opt/cc/$Label.tgz --path $dst --lang $Lang --label $Label"
}

function Invoke-InstallChaincode {
  param(
    [Parameter(Mandatory)] [string]$PeerContainer,
    [Parameter(Mandatory)] [string]$MSPID,
    [Parameter(Mandatory)] [string]$MSPPath,
    [Parameter(Mandatory)] [string]$Addr
  )
  $env = @{ 'CORE_PEER_LOCALMSPID'=$MSPID; 'CORE_PEER_MSPCONFIGPATH'=$MSPPath; 'CORE_PEER_ADDRESS'=$Addr }
  Write-Host "== Installing on $PeerContainer ($MSPID) ==" -ForegroundColor Yellow
  Invoke-PeerCmd -PeerContainer $PeerContainer -Env $env -Cmd "peer lifecycle chaincode install /opt/cc/$Label.tgz"
}

function Get-PackageId {
  param(
    [Parameter(Mandatory)] [string]$PeerContainer,
    [Parameter(Mandatory)] [string]$MSPID,
    [Parameter(Mandatory)] [string]$MSPPath,
    [Parameter(Mandatory)] [string]$Addr,
    [Parameter(Mandatory)] [string]$Label
  )
  $out = docker exec -e CORE_PEER_LOCALMSPID=$MSPID -e CORE_PEER_MSPCONFIGPATH=$MSPPath -e CORE_PEER_ADDRESS=$Addr -i $PeerContainer bash -lc "peer lifecycle chaincode queryinstalled | sed -n \"s/Package ID: \(.*\), Label: $Label/\\1/p\""
  $pkgId = ($out | Select-Object -First 1).Trim()
  if (-not $pkgId) { throw "Package ID not found for label $Label" }
  Write-Host "PackageID: $pkgId" -ForegroundColor Green
  return $pkgId
}

function Invoke-ApproveForOrg {
  param(
    [Parameter(Mandatory)] [string]$PeerContainer,
    [Parameter(Mandatory)] [string]$MSPID,
    [Parameter(Mandatory)] [string]$MSPPath,
    [Parameter(Mandatory)] [string]$Addr,
    [Parameter(Mandatory)] [string]$PkgId
  )
  $env = @{ 'CORE_PEER_LOCALMSPID'=$MSPID; 'CORE_PEER_MSPCONFIGPATH'=$MSPPath; 'CORE_PEER_ADDRESS'=$Addr }
  $initFlag = if ($InitRequired) { "--init-required" } else { "" }
  $cmd = @(
    "peer lifecycle chaincode approveformyorg",
    "-o $Orderer",
    "--tls --cafile $OrdererCA",
    "--channelID $Channel",
    "--name $ChaincodeName",
    "--version $Version",
    "--package-id $PkgId",
    "--sequence $Sequence",
    "--signature-policy '$Policy'",
    $initFlag
  ) -join ' '
  Write-Host "== Approving for $MSPID ==" -ForegroundColor Yellow
  Invoke-PeerCmd -PeerContainer $PeerContainer -Env $env -Cmd $cmd
}

function Invoke-CommitChaincode {
  param(
    [Parameter(Mandatory)] [string]$PeerContainer
  )
  $initFlag = if ($InitRequired) { "--init-required" } else { "" }
  $cmd = @(
    "peer lifecycle chaincode commit",
    "-o $Orderer",
    "--tls --cafile $OrdererCA",
    "--channelID $Channel",
    "--name $ChaincodeName",
    "--version $Version",
    "--sequence $Sequence",
    "--signature-policy '$Policy'",
    "--peerAddresses $Peer0Org1:7051 --tlsRootCertFiles $Org1TLSRoot",
    "--peerAddresses $Peer0Org2:9051 --tlsRootCertFiles $Org2TLSRoot",
    $initFlag
  ) -join ' '
  Write-Host "== Committing definition ==" -ForegroundColor Yellow
  Invoke-PeerCmd -PeerContainer $PeerContainer -Env @{} -Cmd $cmd
  Invoke-PeerCmd -PeerContainer $PeerContainer -Env @{} -Cmd "peer lifecycle chaincode querycommitted --channelID $Channel --name $ChaincodeName"
}

function Main() {
  $repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  $src = Join-Path $repoRoot "fabric/chaincode/anchoring-js"
  if (-not (Test-Path $src)) { throw "Chaincode source not found at $src" }

  Write-Host "Packaging chaincode from: $src" -ForegroundColor Cyan
  Invoke-PackageChaincode -PeerContainer $Peer0Org1 -SrcHostPath $src -Label $Label

  Invoke-InstallChaincode -PeerContainer $Peer0Org1 -MSPID $Org1MSP -MSPPath $Org1AdminMSPPath -Addr "$Peer0Org1:7051"
  $pkgId = Get-PackageId -PeerContainer $Peer0Org1 -MSPID $Org1MSP -MSPPath $Org1AdminMSPPath -Addr "$Peer0Org1:7051" -Label $Label
  Invoke-ApproveForOrg -PeerContainer $Peer0Org1 -MSPID $Org1MSP -MSPPath $Org1AdminMSPPath -Addr "$Peer0Org1:7051" -PkgId $pkgId

  # Repeat for Org2
  Invoke-PackageChaincode -PeerContainer $Peer0Org2 -SrcHostPath $src -Label $Label
  Invoke-InstallChaincode -PeerContainer $Peer0Org2 -MSPID $Org2MSP -MSPPath $Org2AdminMSPPath -Addr "$Peer0Org2:9051"
  $pkgId2 = Get-PackageId -PeerContainer $Peer0Org2 -MSPID $Org2MSP -MSPPath $Org2AdminMSPPath -Addr "$Peer0Org2:9051" -Label $Label
  Invoke-ApproveForOrg -PeerContainer $Peer0Org2 -MSPID $Org2MSP -MSPPath $Org2AdminMSPPath -Addr "$Peer0Org2:9051" -PkgId $pkgId2

  Invoke-CommitChaincode -PeerContainer $Peer0Org1

  Write-Host "Done. Now re-run scripts/fabric/smoke-test.ps1 to verify anchor/verify." -ForegroundColor Green
}

Main
