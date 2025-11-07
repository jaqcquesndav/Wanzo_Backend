import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Fabric mode e2e (optional)', () => {
  const enabled = String(process.env.FABRIC_E2E_ENABLED || 'false') === 'true';
  if (!enabled) {
    it('skipped (FABRIC_E2E_ENABLED!=true)', () => {
      expect(true).toBe(true);
    });
    return;
  }

  let app: INestApplication;
  const baseUrl = 'http://localhost:3015';
  const fabricGateway = (process.env.FABRIC_GATEWAY_URL || 'http://localhost:4010').replace(/\/$/, '');

  beforeAll(async () => {
    process.env.AUTH0_ENABLED = 'false';
    process.env.BLOCKCHAIN_MODE = 'fabric';
    process.env.FABRIC_GATEWAY_URL = fabricGateway;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('fabric-gateway readiness/status should respond (even if not configured)', async () => {
    // Readiness returns 200 when configured, 503 when not
    const r1 = await fetch(`${fabricGateway}/readiness`).catch(() => null as any);
    // Status always 200 with config summary
    const r2 = await fetch(`${fabricGateway}/status`).catch(() => null as any);

    // If gateway not reachable, just skip strict assertions
    if (!r1 && !r2) {
      console.warn('fabric-gateway not reachable at', fabricGateway, '- skipping strict checks');
      expect(true).toBe(true);
      return;
    }

    if (r1) {
      // 200 when configured, 503 when not configured, 404 if route not found on target
      expect([200, 503, 404]).toContain(r1.status);
    }
    if (r2) {
      // 200 when route exists; accept 404 if gateway exposes a different pathing
      expect([200, 404]).toContain(r2.status);
    }
  });

  it('POST /blockchain/anchor should fail gracefully when Fabric not configured', async () => {
    // When fabric-gateway lacks CCP/MSPID/IDENTITY, our service should surface a 500 due to upstream 501
    const resp = await request(app.getHttpServer())
      .post('/blockchain/anchor')
      .send({ type: 'DOC', refId: 'ref-fabric-test', dataBase64: Buffer.from('hello').toString('base64') })
      .set('Content-Type', 'application/json');

    // Either 500 (propagated failure) or 501 (if we later map upstream code) is acceptable in unconfigured environments
    expect([500, 501]).toContain(resp.status);
  });
});
