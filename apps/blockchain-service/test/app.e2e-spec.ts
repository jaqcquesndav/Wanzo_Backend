import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

describe('App e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
  // Ensure auth is disabled for baseline e2e tests
  process.env.AUTH0_ENABLED = process.env.AUTH0_ENABLED ?? 'false';
  const { AppModule } = await import('../src/app.module');
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
  });

  it('/blockchain anchor + verify', async () => {
    const anchorRes = await request(app.getHttpServer())
      .post('/blockchain/anchor')
      .send({ type: 'doc', refId: 'e2e-1', dataBase64: Buffer.from('e2e').toString('base64') })
      .expect(201);
    expect(anchorRes.body.refId).toBe('e2e-1');

    const verifyRes = await request(app.getHttpServer())
      .get('/blockchain/verify')
      .query({ refId: 'e2e-1' })
      .expect(200);
    expect(verifyRes.body.valid).toBe(true);
  });
});
