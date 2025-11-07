# Fabric gateway — exemples de configuration

Ce guide montre comment configurer la gateway Fabric et le service blockchain selon vos environnements, avec le mapping acteurs → actions → endpoints/scopes.

## Acteurs, actions, endpoints, scopes

- Admin (Auth0 permission: admin:full ou scopes granulaires)
  - Actions: approuver contrats/décaissements, ancrer documents
  - Endpoints: /contracts/... (stubs), /blockchain/anchor, /blockchain/anchor-cid
  - Scopes typiques: contracts:admin, disbursements:admin, blockchain:write
- Manager
  - Actions: approbations manager
  - Endpoints: /contracts/:id/approve-manager, /disbursements/:id/approve
  - Scopes: contracts:approve, disbursements:approve
- Agent/Client
  - Actions: upload/sign/finalize documents, vérifier hash
  - Endpoints: /contracts/:id/documents..., /blockchain/verify/:refId
  - Scopes: contracts:documents, blockchain:read
- Service (technique) pour ancrage
  - Actions: ancrage/verify via Fabric
  - Endpoints: /blockchain/anchor, /blockchain/anchor-cid, /blockchain/verify/:refId
  - Scopes: blockchain:write, blockchain:read
- Enrôlement CA (optionnel)
  - Endpoint: /users/register (via fabric-gateway CA)
  - Scope: users:register

Note: Si `ADMIN_SUPER_SCOPE=admin:full`, ce scope bypasse les contrôles fins.

## Variables de la gateway (conteneur `fabric-gateway`)

Obligatoires côté exécution contrat:
- PORT: 4000 (par défaut)
- CCP_PATH: /app/ccp/connection.json (profil de connexion Fabric)
- MSPID: ex. Org1MSP
- CHANNEL: ex. mychannel
- CHAINCODE: ex. anchoring
- IDENTITY: label de l’identité dans le wallet (ex. appUser)
- WALLET_DIR: /app/wallet
- DISCOVERY_AS_LOCALHOST: true (test-network local), false (cluster distant)

Optionnels CA:
- CA_URL: URL du CA (ex. https://ca.org1.example.com:7054)
- CA_NAME: nom du CA (ex. ca-org1)
- CA_ADMIN_IDENTITY: label d’identité admin CA dans le wallet (ex. admin)

Fonctions chaincode (si noms différents):
- FN_ANCHOR (par défaut Anchor)
- FN_ANCHOR_CID (par défaut AnchorCID)
- FN_VERIFY (par défaut Verify)

## Exemple A — Dev local (test-network)

- docker-compose (extrait):

```yaml
services:
  fabric-gateway:
    environment:
      - PORT=4000
      - CCP_PATH=/app/ccp/connection.json
      - MSPID=Org1MSP
      - CHANNEL=mychannel
      - CHAINCODE=anchoring
      - IDENTITY=appUser
      - WALLET_DIR=/app/wallet
      - DISCOVERY_AS_LOCALHOST=true
      - CA_URL=https://localhost:7054
      - CA_NAME=ca-org1
      - CA_ADMIN_IDENTITY=admin
    volumes:
      - ./fabric/ccp:/app/ccp
      - ./fabric/wallet:/app/wallet
    ports:
      - "4010:4000"
```

- Profil de connexion minimal `fabric/ccp/connection.json` (adapter hôtes/ports/certs):

```json
{
  "name": "test-network-org1",
  "version": "1.0.0",
  "client": { "organization": "Org1" },
  "organizations": {
    "Org1": {
      "mspid": "Org1MSP",
      "peers": ["peer0.org1.example.com"],
      "certificateAuthorities": ["ca.org1.example.com"]
    }
  },
  "peers": {
    "peer0.org1.example.com": {
      "url": "grpcs://localhost:7051",
      "tlsCACerts": { "pem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n" }
    }
  },
  "certificateAuthorities": {
    "ca.org1.example.com": {
      "url": "https://localhost:7054",
      "caName": "ca-org1",
      "tlsCACerts": { "pem": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n" }
    }
  },
  "channels": {
    "mychannel": { "peers": { "peer0.org1.example.com": {} } }
  }
}
```

- Wallet `fabric/wallet/` (fichiers JSON nommés par label):
  - `appUser.id` (ou `appUser`)
  - `admin.id` (si CA utilisé)

Exemple contenu d’identité (simplifié):

```json
{
  "credentials": {
    "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  },
  "mspId": "Org1MSP",
  "type": "X.509"
}
```

## Exemple B — Cluster distant (Docker/Kubernetes)

- docker-compose (diff principal):
  - `DISCOVERY_AS_LOCALHOST=false`
  - Les URLs du CCP pointent sur des hôtes/ports accessibles depuis le conteneur (pas localhost).

```yaml
services:
  fabric-gateway:
    environment:
      - MSPID=OrgXMSP
      - CHANNEL=mychannel
      - CHAINCODE=anchoring
      - IDENTITY=serviceUser
      - DISCOVERY_AS_LOCALHOST=false
      - CCP_PATH=/app/ccp/connection.json
      - WALLET_DIR=/app/wallet
    volumes:
      - ./fabric/ccp:/app/ccp
      - ./fabric/wallet:/app/wallet
    ports: ["4010:4000"]
```

- CCP: utilisez les FQDN/Ingress de vos peers/orderers/CA.

## Côté Blockchain Service

- Variables:
  - `FABRIC_GATEWAY_URL=http://fabric-gateway:4000` (en Docker) ou `http://localhost:4010` (hôte)

- Vérifications:
  1) `GET http://localhost:4010/status` → doit indiquer `configured: true`
  2) `GET http://localhost:4010/readiness` → 200 si prêt (503 sinon)
  3) `POST /blockchain/anchor` avec JWT → doit renvoyer un `txId`

## Pièges et diagnostics

- 501 "Fabric gateway not configured": CCP/MSPID/IDENTITY/wallet manquants → compléter les volumes/env.
- 500 TLS/connexion peer: vérifier les `tlsCACerts` dans le CCP et la connectivité réseau.
- 405/401 côté service: fournir un JWT valide (Auth0) et scopes requis; en dev, `AUTH0_SKIP_SCOPES=true`.
- asLocalhost: `true` seulement si les peers sont exposés sur localhost du poste qui exécute la gateway.

## Mapping endpoints ↔ gateway ↔ chaincode

- /blockchain/anchor → gateway POST /anchor → fn Anchor(refId, sha256)
- /blockchain/anchor-cid → gateway POST /anchor-cid → fn AnchorCID(refId, cid)
- /blockchain/verify/:refId → gateway GET /verify?refId=... → fn Verify(refId)
- /users/register → gateway POST /ca/register-enroll (requiert CA_* et CA_ADMIN_IDENTITY)

Ajustez FN_ANCHOR/FN_ANCHOR_CID/FN_VERIFY si vos fonctions chaincode ont d’autres noms.
