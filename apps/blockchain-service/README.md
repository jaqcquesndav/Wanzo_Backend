# Blockchain Service (Production)

Service d’ancrage et de vérification basé sur Hyperledger Fabric + IPFS (Kubo).

## Environnements
Variables clés (via docker-compose ou orchestrateur):
- PORT (par défaut 3015)
- FABRIC_GATEWAY_URL (ex: http://fabric-gateway:4000 en Docker, http://localhost:4010 sur l’hôte)
- IPFS_API_URL (ex: http://ipfs:5001/api/v0)
- IPFS_PIN=true|false (pin automatique)
- AUTH0_ENABLED=true|false, AUTH0_DOMAIN, AUTH0_AUDIENCE (sécurisation JWT)

## Endpoints principaux
Blockchain (Fabric via gateway):
- POST /blockchain/anchor — ancre un hash SHA-256 calculé à partir de `refId` ou `dataBase64`
- POST /blockchain/anchor-cid — ancre un CID IPFS existant
- GET /blockchain/verify?refId=... — vérifie la dernière ancre
- GET /blockchain/verify/:refId — variante path

IPFS (Kubo):
- POST /ipfs/upload — upload base64 -> CID
- GET /ipfs/stat?cid=... — métadonnées (taille)
- GET /ipfs/cat?cid=... — contenu base64

## Swagger / OpenAPI
- UI: http://localhost:3015/api-docs

## Démarrage (Docker Compose)
```pwsh
docker compose build fabric-gateway blockchain-service
docker compose up -d fabric-gateway ipfs blockchain-service
docker logs -f kiota-blockchain-service
```

## Exemple d’ancrage (PowerShell)
```pwsh
$ref = 'doc-123'
$data = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\doc.pdf'))
Invoke-RestMethod -Method POST -Uri http://localhost:3015/blockchain/anchor -ContentType 'application/json' -Body (@{ type='DOCUMENT'; refId=$ref; dataBase64=$data } | ConvertTo-Json)
```

## Sécurité (Auth0)
- Protéger les endpoints `/blockchain` et `/ipfs` via scopes: `blockchain:read`, `blockchain:write`.
- Script de test: `scripts/test-auth0-m2m.ps1` (fournir CLIENT_ID/SECRET, DOMAIN, AUDIENCE).

## Production
- Aucun mode mock conservé.
- Les identités Fabric sont gérées via wallets montés.
- Les paramètres envoyés au chaincode sont strictement conformes (2 arguments).

## Maintenance
- Mettre à jour CCP et certificats avant redéploiement.
- Sur rotation d’identité, remplacer les fichiers dans `fabric/org-*/wallet` puis redémarrer `fabric-gateway`.

## Postman / REST Client
- Collection: `apps/blockchain-service/BlockchainService.postman_collection.json`
- Fichier test REST: `apps/blockchain-service/test.http`
