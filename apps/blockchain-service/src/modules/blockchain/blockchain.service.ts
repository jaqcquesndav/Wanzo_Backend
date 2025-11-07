import { Injectable } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';

interface AnchorInput {
  type: string;
  refId: string;
  dataBase64?: string;
}

interface AnchorCidInput {
  type: string;
  refId: string;
  cid: string;
  sha256?: string;
}

@Injectable()
export class BlockchainService {
  private store = new Map<string, any>();
  // Production: always Fabric (no mock mode retained)
  private readonly gatewayUrl = process.env.FABRIC_GATEWAY_URL || 'http://fabric-gateway:4000';

  async anchor(input: AnchorInput) {
    const id = randomUUID();
    const sha256 = this.computeSha256(input);
    const payload = { refId: input.refId, sha256 };
    const res = await fetch(`${this.gatewayUrl.replace(/\/$/, '')}/anchor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`fabric anchor failed: ${res.status} ${text}`);
    let js: any = {};
    try { js = text ? JSON.parse(text) : {}; } catch {}
    return { id, refId: input.refId, type: input.type, sha256, cid: null, txId: js.txId || null, block: null, status: 'ACTIVE', fabric: js };
  }

  async verify(refId: string) {
    const url = `${this.gatewayUrl.replace(/\/$/, '')}/verify?refId=${encodeURIComponent(refId)}`;
    const res = await fetch(url);
    const text = await res.text();
    if (!res.ok) throw new Error(`fabric verify failed: ${res.status} ${text}`);
    let js: any = {};
    try { js = text ? JSON.parse(text) : {}; } catch {}
    return { valid: Boolean(js?.ok), result: js?.result ?? null };
  }

  async anchorCid(input: AnchorCidInput) {
    const id = randomUUID();
    const sha256 = input.sha256 || createHash('sha256').update(Buffer.from(String(input.cid))).digest('hex');
    const payload = { refId: input.refId, cid: input.cid };
    const res = await fetch(`${this.gatewayUrl.replace(/\/$/, '')}/anchor-cid`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`fabric anchor-cid failed: ${res.status} ${text}`);
    let js: any = {};
    try { js = text ? JSON.parse(text) : {}; } catch {}
    return { id, refId: input.refId, type: input.type, sha256, cid: input.cid, txId: js.txId || null, block: null, status: 'ACTIVE', fabric: js };
  }

  private computeSha256(input: AnchorInput) {
    const buf = input.dataBase64 ? Buffer.from(String(input.dataBase64), 'base64') : Buffer.from(String(input.refId || ''));
    return createHash('sha256').update(buf).digest('hex');
  }
}
