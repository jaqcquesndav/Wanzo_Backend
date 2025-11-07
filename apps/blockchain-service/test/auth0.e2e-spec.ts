import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('Auth0 M2M e2e (optional)', () => {
  let app: INestApplication;
  const enabled = String(process.env.AUTH0_E2E_ENABLED || 'false') === 'true';

  beforeAll(async () => {
    if (!enabled) return;
    // Require env values for real token flow
    const required = [
      'AUTH0_DOMAIN',
      'AUTH0_AUDIENCE',
      'AUTH0_CLIENT_ID',
      'AUTH0_CLIENT_SECRET',
    ] as const;
    for (const k of required) {
      if (!process.env[k]) {
        throw new Error(`Missing ${k} for Auth0 e2e test`);
      }
    }
    process.env.AUTH0_ENABLED = 'true';
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  const getToken = async (): Promise<string> => {
    const domain = process.env.AUTH0_DOMAIN!;
    const audience = process.env.AUTH0_AUDIENCE!;
    const client_id = process.env.AUTH0_CLIENT_ID!;
    const client_secret = process.env.AUTH0_CLIENT_SECRET!;
    const res = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        audience,
        client_id,
        client_secret,
      }),
    });
    const js = await res.json();
    if (!res.ok) throw new Error(`token error: ${res.status} ${JSON.stringify(js)}`);
    return js.access_token as string;
  };

  (enabled ? it : it.skip)('rejects protected route without token', async () => {
    await request(app.getHttpServer()).get('/blockchain/verify?refId=nope').expect(401);
  });

  (enabled ? it : it.skip)('allows protected route with valid token', async () => {
    const token = await getToken();
    // verify requires blockchain:read scope; anchor requires blockchain:write
    await request(app.getHttpServer())
      .get('/blockchain/verify')
      .query({ refId: 'auth0-e2e' })
      .set('Authorization', `Bearer ${token}`)
      .expect((res) => {
        if (res.status !== 200 && res.status !== 400 && res.status !== 404) {
          throw new Error(`Unexpected status ${res.status}`);
        }
      });
  });
});
