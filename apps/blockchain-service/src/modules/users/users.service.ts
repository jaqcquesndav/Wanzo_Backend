import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly gatewayUrl = process.env.FABRIC_GATEWAY_URL || 'http://fabric-gateway:4000';

  async isCaSupported(): Promise<boolean> {
    try {
      const url = `${this.gatewayUrl.replace(/\/$/, '')}/status`;
      const res = await fetch(url);
      if (!res.ok) return false;
  const js = await res.json();
  return Boolean(js && js.ca === true);
    } catch {
      return false;
    }
  }

  async getCaStatus(): Promise<{ ca: boolean; issues?: string[] } | { error: string }> {
    try {
      const url = `${this.gatewayUrl.replace(/\/$/, '')}/ca/status`;
      const res = await fetch(url);
      const text = await res.text();
      if (!res.ok) return { error: `CA status failed: ${res.status} ${text}` };
      const js = text ? JSON.parse(text) : {};
      return js;
    } catch (e: any) {
      return { error: e?.message || 'CA status error' };
    }
  }

  async register(body: { username: string; affiliation?: string }) {
    const url = `${this.gatewayUrl.replace(/\/$/, '')}/ca/register-enroll`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`CA register failed: ${res.status} ${text}`);
    }
    return res.json();
  }
}
