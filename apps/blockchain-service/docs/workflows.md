# Workflows

These flows describe end-to-end steps across modules.

## IPFS upload and retrieval
1) Client POST /ipfs/files with base64 payload (+ filename, mime optional)
2) Service stores on IPFS (mock or Kubo), returns CID and metadata
3) Client GET /ipfs/files/{cid} for content (base64) and /ipfs/files/{cid}/stat for metadata

## Anchoring a document
1) Option A (inline): POST /blockchain/anchor with {refId, type, dataBase64}
   - Service computes sha256 and calls Fabric gateway (or mock), returns tx info
2) Option B (via CID): POST /blockchain/anchor-cid with {refId, type, cid, sha256?}
   - Service uses CIP already stored and anchors provided or computed hash
3) Verify: GET /blockchain/verify/{refId} to view latest anchoring state

## Contracts document lifecycle (planned)
1) POST /contracts/{id}/documents — upload PDF → IPFS
2) POST /contracts/{id}/documents/generate — generate a PDF from template/input
3) POST /contracts/{id}/documents/{docId}/sign — client or manager signs
4) POST /contracts/{id}/documents/{docId}/finalize — freeze a version
5) POST /contracts/{id}/documents/{docId}/anchor — anchor hash on Fabric
6) POST /contracts/{id}/documents/{docId}/hash/verify — verify integrity later

## Credits workflow (planned)
- Create (DRAFT) → Submit (PENDING) → Analyze → Approve (Manager/Admin) or Reject

## Disbursements workflow (planned)
- Create → Approvals (Manager/Admin) → Client confirm → Execute or Cancel

## Repayments workflow (planned)
- Create → Process/Partial → Resolve dispute

## Users and Fabric CA
1) GET /users/ca/status — check CA readiness via fabric-gateway
2) POST /users/register — register+enroll new identity (requires CA configured, wallet + MSPID)
3) Auth — obtain JWT via Auth0 (delegated); include Bearer token on protected routes
