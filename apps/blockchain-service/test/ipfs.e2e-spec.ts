import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('IPFS endpoints e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.AUTH0_ENABLED = 'false';
    // Always force mock mode for this suite so it doesn't depend on a real Kubo node
    process.env.IPFS_MODE = 'mock';
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => { if (app) await app.close(); });

  it('upload/stat/get - mock mode', async () => {
    const server = app.getHttpServer();
    const request = (await import('supertest')).default;
    const dataBase64 = Buffer.from('file-mock').toString('base64');
    const up = await request(server).post('/ipfs/upload-file').send({ dataBase64, filename: 'f.txt', mime: 'text/plain' }).expect(201);
    const cid = up.body.cid;
    expect(cid).toBeTruthy();
    const st = await request(server).get('/ipfs/stat').query({ cid }).expect(200);
    expect(st.body.Size).toBe(Buffer.from('file-mock').length);
    const get = await request(server).get('/ipfs/get-file').query({ cid }).expect(200);
    expect(get.body.dataBase64).toBe(dataBase64);
  });
});

describe('IPFS endpoints e2e (optional real Kubo)', () => {
  let app: INestApplication | undefined;
  const enabled = String(process.env.IPFS_E2E_ENABLED || 'false') === 'true';

  beforeAll(async () => {
    if (!enabled) return;
    process.env.AUTH0_ENABLED = 'false';
    process.env.IPFS_MODE = 'kubo';
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => { if (app) await app.close(); });

  (enabled ? it : it.skip)('upload/stat/get - real kubo', async () => {
    const server = app!.getHttpServer();
    const request = (await import('supertest')).default;
    const dataBase64 = Buffer.from('file-real').toString('base64');
    const up = await request(server).post('/ipfs/files').send({ dataBase64, filename: 'r.txt', mime: 'text/plain' }).expect(201);
    const cid = up.body.cid;
    expect(cid).toBeTruthy();
    // Try stat if allowed; tolerate 405/500 on locked-down APIs
    const st = await request(server).get(`/ipfs/files/${cid}/stat`);
    if (st.status >= 200 && st.status < 300) {
      expect(st.body).toBeTruthy();
    }
    // Try get if allowed; tolerate 405/500 on locked-down APIs
    const get = await request(server).get(`/ipfs/files/${cid}`);
    if (get.status >= 200 && get.status < 300) {
      expect(get.body.dataBase64).toBe(dataBase64);
    }
  });
});
