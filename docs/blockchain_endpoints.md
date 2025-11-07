# Blockchain stack endpoints

This document lists and explains the endpoints across layers: blockchain-service (public API), fabric-gateway (internal adapter), and chaincode intents.

Note: Most business endpoints are scaffolded with guards and return 501/Not implemented until wired to persistence and chaincode. Security uses Auth0 JWT (bearer) when AUTH0_ENABLED=true.

## 1) Auth & Identity (blockchain-service)
- POST /users/register — Provisions Fabric identity via gateway CA.
  - Role: ensure Auth0 user has matching Fabric X.509 identity.
- POST /users/login — Delegated to Auth0, returns 501 here.
  - Role: obtain JWT from Auth0 (use OAuth2 client credentials or password/ROPC per tenant policy).
- GET /users/me — Returns current user profile from JWT (sub, email, scope).
  - Role: confirm Auth0 identity mapping.

## 2) Blockchain (anchoring/proofs) (blockchain-service)
- POST /blockchain/anchor — Hash payload and anchor (mock or via Fabric gateway).
- POST /blockchain/anchor-cid — Anchor an IPFS CID (optional sha256 override).
- GET /blockchain/verify?refId=... — Verify anchor by refId.
- GET /blockchain/verify/:refId — Route param alias.

## 3) Credits (blockchain-service)
- POST /credits — Create credit request (DRAFT).
- POST /credits/:id/submit — Submit (PENDING).
- POST /credits/:id/analyze — Analyst risk/scoring.
- POST /credits/:id/approve — Manager approval.
- POST /credits/:id/admin-approve — Admin approval for high amounts.
- POST /credits/:id/reject — Reject.

## 4) Disbursements (blockchain-service)
- POST /disbursements — Create disbursement.
- POST /disbursements/:id/approve — Manager approval.
- POST /disbursements/:id/admin-approve — Admin approval.
- POST /disbursements/:id/confirm-client — Client confirmation.
- POST /disbursements/:id/execute — Execute funds transfer.
- POST /disbursements/:id/cancel — Cancel.

## 5) Repayments (blockchain-service)
- POST /repayments — Create repayment.
- POST /repayments/:id/process — Process repayment.
- POST /repayments/:id/partial — Partial repayment.
- POST /repayments/:id/resolve-dispute — Resolve dispute.

## 6) Contracts (blockchain-service)
- POST /contracts/:id/modify — Propose modification.
- POST /contracts/:id/approve-manager — Manager approval.
- POST /contracts/:id/approve-admin — Admin approval.
- POST /contracts/:id/approve-client — Client approval.
- POST /contracts/:id/reject — Reject modification.

### Document management (contract documents)
- POST /contracts/:id/documents — Upload contract PDF (to IPFS) [stub].
- POST /contracts/:id/documents/generate — Generate PDF [stub].
- GET  /contracts/:id/documents — List documents [stub].
- GET  /contracts/:id/documents/:docId/download — Download signed PDF [stub].
- POST /contracts/:id/documents/:docId/signature-requests — Create signature flow [stub].
- POST /contracts/:id/documents/:docId/sign — Sign a document [stub].
- POST /contracts/:id/documents/:docId/finalize — Finalize (FULLY_SIGNED) [stub].
- POST /contracts/:id/documents/:docId/anchor — Anchor document hash in Fabric [stub].
- POST /contracts/:id/documents/:docId/hash/verify — Verify hash [stub].
- POST /contracts/:id/documents/verify-by-upload — Upload-and-verify [stub].

## 7) Audit (blockchain-service)
- GET /audit/logs — Application audit logs [future].
- GET /transactions/:id/history — Transaction history [future].

## 8) IPFS (blockchain-service)
- POST /ipfs/upload-file — Upload file (base64) to IPFS Kubo.
- GET /ipfs/stat?cid=... — Block stat.
- GET /ipfs/get-file?cid=... — Download (base64).

## 9) Fabric-gateway (internal)
- POST /anchor — Submit chaincode Anchor.
- POST /anchor-cid — Submit chaincode AnchorCID.
- GET  /verify?refId=... — Evaluate Verify.
- GET  /ca/status — CA configuration status.
- POST /ca/register-enroll — Register & enroll identity.
- GET  /network/summary — CCP summary.

## Security / scopes (suggested)
- blockchain:read, blockchain:write
- ipfs:read, ipfs:write
- users:register
- credits:write, credits:analyze, credits:approve, credits:admin
- disbursements:write, disbursements:approve, disbursements:admin, disbursements:confirm, disbursements:execute
- repayments:write, repayments:process, repayments:resolve
- contracts:write, contracts:approve, contracts:admin, contracts:client, contracts:documents

Swagger UI: http://localhost:3015/api-docs

> Protected routes require Bearer JWT (Auth0). Disable with AUTH0_ENABLED=false for local smoke tests.
