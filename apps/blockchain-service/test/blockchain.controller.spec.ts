import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { BlockchainController } from '../src/modules/blockchain/blockchain.controller';
import { BlockchainService } from '../src/modules/blockchain/blockchain.service';

describe('BlockchainController', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BlockchainController],
      providers: [BlockchainService],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('anchor and verify flow (unit-ish)', async () => {
    const svc = app.get(BlockchainService);
    const rec = await svc.anchor({ type: 'doc', refId: 'u1', dataBase64: Buffer.from('foo').toString('base64') });
    expect(rec.refId).toBe('u1');
    const ver = await svc.verify('u1');
    expect(ver.valid).toBe(true);
  });
});
