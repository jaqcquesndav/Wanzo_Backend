# Hyperledger Explorer Troubleshooting

Common causes of startup loop or `DiscoveryService access denied`:

- Wrong identity mounted (User1 instead of Admin). Ensure `fabric/org-kiota/creds/admin/{cert.pem,key.pem}` and `fabric/org-bank/creds/admin/{cert.pem,key.pem}` belong to Admin of each org or a peer admin that is a member of `mychannel`.
- TLS CA paths invalid. Verify the mounted files exist in container at:
  - `/opt/explorer/crypto/*/tls/peer/ca.crt`
  - `/opt/explorer/crypto/*/tls/orderer/ca.crt`
- Endpoint mapping mismatch. If using `host.docker.internal`, set `DISCOVERY_AS_LOCALHOST: "false"` in Explorer environment.

Quick checks:

- Print certificate subject from host using a throwaway container:
  docker run --rm -v "$PWD/fabric/org-kiota/creds/admin:/a:ro" alpine sh -lc "apk add --no-cache openssl >/dev/null; openssl x509 -in /a/cert.pem -noout -subject -issuer"

- Recreate Explorer after updating files:
  docker compose -f monitoring/explorer/docker-compose.yml up -d --force-recreate explorer

If access denied persists, ensure the Admin identities are from the same running Fabric network and have joined `mychannel`. You can copy the peer MSP cert/key as a temporary admin identity:

- For Org1: docker cp peer0.org1.example.com:/etc/hyperledger/fabric/msp/signcerts/cert.pem fabric/org-kiota/creds/admin/cert.pem
- For Org2: docker cp peer0.org2.example.com:/etc/hyperledger/fabric/msp/signcerts/cert.pem fabric/org-bank/creds/admin/cert.pem

Note: Some Fabric sample layouts move users under `organizations/fabric-ca/*`. Use the CA to enroll Admin@ if needed.
