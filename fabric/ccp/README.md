# Fabric CCP and wallet setup

1) Put your connection profile as `connection.json` in this folder.
   - Use `connection.template.json` as a guide and fill real URLs/tls certs.
2) Ensure your wallet identities are in `../wallet/` (mounted to /app/wallet).
   - Required labels: `IDENTITY` for submit/evaluate; `CA_ADMIN_IDENTITY` for CA ops.
3) Set env in docker-compose for fabric-gateway:
   - MSPID, CHANNEL, CHAINCODE, IDENTITY, CCP_PATH=/app/ccp/connection.json
   - For CA: CA_URL, CA_NAME (optional), CA_ADMIN_IDENTITY.
4) Restart fabric-gateway and verify:
   - GET http://localhost:4010/status
   - GET http://localhost:4010/network/summary
   - GET http://localhost:4010/ca/status

If using test-network, you can copy `connection-org1.json` here and rename to `connection.json`.Place your Hyperledger Fabric connection profile JSON here as connection.json.

Example keys:
- name, version
- client.organization
- organizations[MSP].mspid
- peers, orderers, certificateAuthorities
- channels.mychannel.peers

Do not commit real credentials to Git.
