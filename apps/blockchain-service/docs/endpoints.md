# Endpoints overview

Version: 1.0 (OAS 3.0)
Description: Anchoring and verification API (IPFS + Fabric)

Auth: Bearer JWT (Auth0). Scopes vary per route.

Health
- GET /health — service health

Blockchain
- POST /blockchain/anchor — anchor computed SHA-256 from base64 payload (preferred)
- POST /blockchain/anchor-cid — anchor an existing IPFS CID with optional hash
- GET /blockchain/verify/{refId} — verify latest anchor for refId (preferred)
- GET /blockchain/verify — Deprecated: use path param variant

IPFS
- POST /ipfs/files — Upload to IPFS (preferred)
- GET /ipfs/files/{cid} — Get content (base64)
- GET /ipfs/files/{cid}/stat — Get stat (size, etc.)
- POST /ipfs/upload-file — Deprecated: use /ipfs/files
- GET /ipfs/get-file — Deprecated: use /ipfs/files/{cid}
- GET /ipfs/stat — Deprecated: use /ipfs/files/{cid}/stat

Contracts (stubs)
- GET /contracts/health
- POST /contracts/{id}/documents — Upload document (PDF → IPFS)
- POST /contracts/{id}/documents/generate — Generate a contract PDF
- GET /contracts/{id}/documents — List docs
- GET /contracts/{id}/documents/{docId}/download — Download
- POST /contracts/{id}/documents/{docId}/signature-requests — Create signature request
- POST /contracts/{id}/documents/{docId}/sign — Sign a doc
- POST /contracts/{id}/documents/{docId}/finalize — Finalize
- POST /contracts/{id}/documents/{docId}/anchor — Anchor hash on Fabric
- POST /contracts/{id}/documents/{docId}/hash/verify — Verify doc hash
- POST /contracts/{id}/documents/verify-by-upload — Verify by PDF upload

Credits (stubs)
- POST /credits — Create (DRAFT)
- POST /credits/{id}/submit — Submit (PENDING)
- POST /credits/{id}/analyze — Analyze
- POST /credits/{id}/approve — Approve (Manager)
- POST /credits/{id}/admin-approve — Approve (Admin)
- POST /credits/{id}/reject — Reject

Disbursements (stubs)
- POST /disbursements — Create
- POST /disbursements/{id}/approve — Approve (Manager)
- POST /disbursements/{id}/admin-approve — Approve (Admin)
- POST /disbursements/{id}/confirm-client — Client confirm
- POST /disbursements/{id}/execute — Execute
- POST /disbursements/{id}/cancel — Cancel

Repayments (stubs)
- POST /repayments — Create
- POST /repayments/{id}/process — Process
- POST /repayments/{id}/partial — Partial
- POST /repayments/{id}/resolve-dispute — Resolve dispute

Users
- GET /users/health — Health
- POST /users/register — Register & enroll via Fabric CA (via fabric-gateway). 501 if CA not configured
- GET /users/ca/status — CA status
- POST /users/login — 501 (delegated to Auth0)
- GET /users/me — Profile from JWT
