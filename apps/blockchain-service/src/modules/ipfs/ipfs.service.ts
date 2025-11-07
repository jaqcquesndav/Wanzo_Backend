import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class IpfsService {
  // Force real Kubo mode in production
  private readonly mode = 'kubo';
  private readonly apiUrl = (process.env.IPFS_API_URL || 'http://ipfs:5001/api/v0').replace(/\/$/, '');
  private readonly pin = String(process.env.IPFS_PIN || 'true') === 'true';
  private readonly basic = process.env.IPFS_API_BASIC || null; // base64 user:pass
  private readonly bearer = process.env.IPFS_API_BEARER || null; // token
  // Removed mock store for production
  private readonly mockStore = undefined;

  private headers(extra: Record<string, string> = {}) {
    const h: Record<string, string> = { ...extra };
    if (this.bearer) h['authorization'] = `Bearer ${this.bearer}`;
    if (this.basic) h['authorization'] = `Basic ${this.basic}`;
    return h;
  }

  async add(dataBase64: string, filename = 'upload.bin', mime = 'application/octet-stream') {
    // Only Kubo path retained
    const buffer = Buffer.from(dataBase64, 'base64');
    const boundary = '----gcopilot' + Math.random().toString(16).slice(2);
    const pre = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename.replace(/"/g, '')}"\r\n` +
        `Content-Type: ${mime}\r\n\r\n`,
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([pre, buffer, post]);
    const url = `${this.apiUrl}/add?pin=${this.pin ? 'true' : 'false'}&cid-version=1`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers({ 'content-type': `multipart/form-data; boundary=${boundary}` }),
      body,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`IPFS add failed: ${res.status} ${text}`);
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const last = JSON.parse(lines[lines.length - 1]);
    return { cid: last.Hash, size: Number(last.Size || buffer.length) };
  }

  async stat(cid: string) {
    // Only Kubo path retained
    const tryRequests = async () => {
      const attempts: Array<() => Promise<Response>> = [
        // POST with arg
        () =>
          fetch(`${this.apiUrl}/block/stat`, {
            method: 'POST',
            headers: this.headers({ 'content-type': 'application/x-www-form-urlencoded' }),
            body: `arg=${encodeURIComponent(cid)}`,
          }),
        // POST with cid
        () =>
          fetch(`${this.apiUrl}/block/stat`, {
            method: 'POST',
            headers: this.headers({ 'content-type': 'application/x-www-form-urlencoded' }),
            body: `cid=${encodeURIComponent(cid)}`,
          }),
        // GET with arg
        () => fetch(`${this.apiUrl}/block/stat?arg=${encodeURIComponent(cid)}`, { headers: this.headers() }),
        // Fallback older API: object/stat
        () => fetch(`${this.apiUrl}/object/stat?arg=${encodeURIComponent(cid)}`, { headers: this.headers() }),
      ];
      let lastText = '';
      let lastStatus = 0;
      for (const fn of attempts) {
        try {
          const res = await fn();
          const text = await res.text();
          if (res.ok) {
            try {
              return JSON.parse(text);
            } catch {
              return { raw: text } as any;
            }
          }
          lastText = text;
          lastStatus = res.status;
        } catch (e: any) {
          lastText = String(e?.message || e);
          lastStatus = 0;
        }
      }
      // Final fallback: cat the content to compute size if allowed
      try {
        const catRes = await fetch(`${this.apiUrl}/cat?arg=${encodeURIComponent(cid)}`, { headers: this.headers() });
        if (catRes.ok) {
          const ab = await catRes.arrayBuffer();
          const len = (ab as any).byteLength ?? Buffer.from(ab as any).length;
          return { Key: cid, Size: len } as any;
        }
        lastStatus = catRes.status;
        lastText = await catRes.text();
      } catch (e: any) {
        lastStatus = 0;
        lastText = String(e?.message || e);
      }
      throw new Error(`IPFS stat failed: ${lastStatus} ${lastText}`);
    };
    return tryRequests();
  }

  async cat(cid: string) {
    // Only Kubo path retained
    const attempts: Array<() => Promise<Response>> = [
      // POST with arg
      () =>
        fetch(`${this.apiUrl}/cat`, {
          method: 'POST',
          headers: this.headers({ 'content-type': 'application/x-www-form-urlencoded' }),
          body: `arg=${encodeURIComponent(cid)}`,
        }),
      // POST with cid
      () =>
        fetch(`${this.apiUrl}/cat`, {
          method: 'POST',
          headers: this.headers({ 'content-type': 'application/x-www-form-urlencoded' }),
          body: `cid=${encodeURIComponent(cid)}`,
        }),
      // GET with arg
      () => fetch(`${this.apiUrl}/cat?arg=${encodeURIComponent(cid)}`, { headers: this.headers() }),
    ];
    let lastStatus = 0;
    let lastText = '';
    for (const fn of attempts) {
      try {
        const res = await fn();
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const b64 = Buffer.from(ab as any).toString('base64');
          return { dataBase64: b64 };
        }
        lastStatus = res.status;
        lastText = await res.text();
      } catch (e: any) {
        lastStatus = 0;
        lastText = String(e?.message || e);
      }
    }
    throw new Error(`IPFS cat failed: ${lastStatus} ${lastText}`);
  }
}
