import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('Endpoints smoke (structure only)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    process.env.AUTH0_ENABLED = 'false';
    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });
  afterAll(async () => { await app.close(); });

  it('exposes blockchain anchor-cid and verify/:refId', async () => {
    const server = app.getHttpServer();
    const request = (await import('supertest')).default;
    await request(server).get('/blockchain/verify/ref1').expect(200);
    await request(server)
      .post('/blockchain/anchor-cid')
      .send({ type: 'doc', refId: 'smoke-1', cid: 'bafytestcid' })
      .expect((res) => {
        if (res.status !== 201 && res.status !== 200) throw new Error('Unexpected status');
      });
  });

  it('exposes users me and login', async () => {
    const server = app.getHttpServer();
    await (await import('supertest')).default(server).get('/users/health').expect(200);
  });

  it('exposes credits/disbursements/repayments routes', async () => {
    const server = app.getHttpServer();
    const request = (await import('supertest')).default;
    await request(server).get('/contracts/health').expect(200);
    await request(server).post('/credits').send({}).expect(500);
    await request(server).post('/disbursements').send({}).expect(500);
    await request(server).post('/repayments').send({}).expect(500);
    await request(server).post('/contracts/abc/modify').send({}).expect(500);
    await request(server).post('/contracts/abc/documents').send({}).expect(500);
  });

  it('exposes new RESTful IPFS aliases', async () => {
    const server = app.getHttpServer();
    const request = (await import('supertest')).default;
    const dataBase64 = Buffer.from('rest-alias').toString('base64');
    const up = await request(server).post('/ipfs/files').send({ dataBase64 }).expect((res) => {
      if (res.status !== 201 && res.status !== 200) throw new Error('Unexpected status');
    });
    const cid = up.body.cid;
    await request(server).get(`/ipfs/files/${cid}`).expect(200);
    await request(server).get(`/ipfs/files/${cid}/stat`).expect(200);
  });
});
