# Bring up a real Fabric network (WSL) and wire the gateway

This enables /channel/info and chaincode calls to work for real.

## 1) Start test-network in WSL Ubuntu

PowerShell (Windows):

```powershell
# Option A: use helper
./scripts/fabric/wsl-start-test-network.ps1 -Distro Ubuntu-20.04 -Channel mychannel

# Option B: manually
wsl -d Ubuntu-20.04 -- bash -lc "set -e; \
  [ -d \"$HOME/fabric-samples\" ] || git clone -b v2.5.6 https://github.com/hyperledger/fabric-samples.git $HOME/fabric-samples; \
  cd $HOME/fabric-samples/test-network; \
  bash network.sh down || true; \
  bash network.sh up createChannel -c mychannel -ca -s couchdb"
```

## 2) Copy CCPs (connection profiles) into this repo

```powershell
./scripts/fabric/import-from-samples.ps1 -SamplesPath C:\fabric-samples -RepoPath $pwd
```

If your samples path differs, adjust `-SamplesPath` (e.g. `C:\Users\you\fabric-samples`).

## 3) Make CCP endpoints reachable from Docker

- If peers/orderer run in WSL, expose their ports via the samples (default) and set CCP URLs to use `host.docker.internal` with TLS.
- Ensure TLS PEMs are present in each CCP under `tlsCACerts.pem`.

Quick check (from Windows):

```powershell
Invoke-WebRequest http://localhost:7051 -UseBasicParsing | Out-Null  # peer0.org1 (if mapped)
```

## 4) Restart the fabric-gateway

```powershell
docker compose up -d --no-deps --build fabric-gateway
```

## 5) Test from the gateway

```powershell
Invoke-RestMethod http://localhost:4010/channel/info
Invoke-RestMethod http://localhost:4010/channel/info -Headers @{ 'x-fabric-org'='bank' }
```

If channel discovery fails, re-check CCP URLs/ports and TLS PEMs.
