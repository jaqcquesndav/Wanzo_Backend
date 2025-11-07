# Hyperledger Explorer (Windows)

To make Explorer start and load the UI at http://localhost:8081 you need a real Fabric network running and the correct crypto mounted:

- A running Fabric network exposing these host ports:
  - orderer.example.com TLS gRPC: 7050
  - peer0.org1.example.com TLS gRPC: 7051
  - peer0.org2.example.com TLS gRPC: 9051
- Admin user cert/key for Org1MSP and Org2MSP at:
  - fabric/org-kiota/creds/admin/{cert.pem,key.pem}
  - fabric/org-bank/creds/admin/{cert.pem,key.pem}
- TLS CA certs copied to:
  - fabric/org-kiota/tls/peer/ca.crt
  - fabric/org-kiota/tls/orderer/ca.crt
  - fabric/org-bank/tls/peer/ca.crt
  - fabric/org-bank/tls/orderer/ca.crt

Two easy ways to satisfy these on Windows:

1) Preferred: WSL + fabric-samples test-network
- Install WSL (Ubuntu) and run the helper:
  - scripts/fabric/wsl-start-test-network.ps1 (starts test-network with CAs and CouchDB)
  - scripts/fabric/import-from-samples.ps1 -SamplesPath \\wsl$\\Ubuntu-22.04\\home\\<user>\\fabric-samples -RepoPath <this repo>
- Restart Explorer: docker compose restart explorer

2) If the test-network is already running in Docker on this machine
- Run scripts/fabric/copy-tls-from-containers.ps1 to copy TLS certs and default User1 cert/key
- Restart Explorer: docker compose restart explorer

Troubleshooting
- If Explorer keeps restarting with npm ERR! app-start, it usually means the network is unreachable or TLS files/paths are wrong.
- Inside the container, app logs live under /opt/explorer/logs. You can print them with:
  docker compose exec explorer sh -lc "ls -la /opt/explorer/logs; for f in /opt/explorer/logs/*.log; do echo ==== $f ====; sed -n '1,200p' $f; done"
