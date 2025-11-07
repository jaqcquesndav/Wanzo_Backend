# Fabric Gateway — Test Network (Hyperledger Fabric Samples)

Use this preset to connect the gateway to the Fabric Samples test-network (Org1/Org2 on channel `mychannel`). It lets you validate wallets/CA and basic ledger access locally.

## Prerequisites
- Hyperledger Fabric Samples cloned and started with CA and channel
- Optional: your anchoring chaincode deployed as `anchoring`

## Steps
1) Start the Fabric Samples test-network with CA and channel
2) Export CCPs and certs to this repo
3) Choose an env preset and start the gateway

### 1) Start samples
- Linux/macOS:
  - ./network.sh up createChannel -ca
- Windows:
  - Use WSL for best results and run the same commands inside WSL.

Optional (app chaincode):
- ./network.sh deployCC -ccn anchoring -ccp <path_to_chaincode> -ccl javascript

### 2) Export CCPs and certs
- Copy Org1 connection.json to: fabric/org-kiota/ccp/connection.json
- Copy Org2 connection.json to: fabric/org-bank/ccp/connection.json
- Export an operator identity for each org and place:
  - fabric/org-kiota/creds/{cert.pem,key.pem}   (label: kiotaOps)
  - fabric/org-bank/creds/{cert.pem,key.pem}    (label: bankOps)
- Export CA admin identity for each org and place:
  - fabric/org-kiota/creds/admin/{cert.pem,key.pem} (label: ca-admin)
  - fabric/org-bank/creds/admin/{cert.pem,key.pem}  (label: ca-admin)

Tip: You can skip admin PEMs and instead provide CA_ADMIN_ENROLL_ID and CA_ADMIN_ENROLL_SECRET; the bootstrap script will enroll the admin.

### 3) Select env preset
- Container: copy `.env.testnet.container` to `.env` and run docker compose
- Host scripts: copy `.env.testnet.host` to `.env` and run `npm run verify` / `npm run bootstrap:users`

Endpoints to try:
- GET /orgs
- GET /readiness
- GET /network/summary
- GET /channel/info   (works without app chaincode)
- POST /wallet/import and GET /wallet
- POST /ca/register-enroll (needs ca-admin in wallet)
- POST /anchor and GET /verify (need chaincode)

## Troubleshooting
- If /orgs shows hasIdentity=false, ensure creds were auto-imported or import via /wallet/import.
- If /channel/info fails, verify CCP URLs, TLS PEMs, and discoveryAsLocalhost for local networks.
