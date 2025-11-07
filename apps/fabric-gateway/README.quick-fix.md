# Quick fix to resolve "IDENTITY not found in wallet"

You need a valid X.509 identity in each org wallet used by the Fabric gateway.

Two fastest options for local testing:

1) Import from Fabric Samples test-network (recommended)
- Ensure Fabric Samples test-network is up with CAs
- Export User1 cert/key into this repo and restart the gateway
  - node scripts/fabric-import-testnet-identities.js /path/to/fabric-samples/test-network
  - docker compose restart fabric-gateway
- Verify
  - curl http://localhost:4010/wallet
  - curl http://localhost:4010/channel/info

2) Enroll via CA (requires running CA)
- Verify CA reachability: http(s)://host.docker.internal:7054 and :8054
- Put the CA admin into wallet first (auto-import from fabric/org-*/creds/admin or enroll with .env creds)
  - apps/fabric-gateway/.env contains CA_ADMIN_ENROLL_ID/SECRET (admin/adminpw for test-network)
  - docker exec -it kiota-fabric-gateway node /app/src/bootstrap-default-users.js
- Then register/enroll a user
  - POST http://localhost:4010/ca/register-enroll {"username":"pme1"}
- Check wallet again

If you cannot run Fabric CAs right now, use option 1 to unblock tests.
