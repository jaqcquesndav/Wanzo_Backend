import { BlockchainService } from '../src/modules/blockchain/blockchain.service';

describe('BlockchainService', () => {
  let svc: BlockchainService;

  beforeEach(() => {
    svc = new BlockchainService();
  });

  it('anchors data and returns record', async () => {
    const rec = await svc.anchor({ type: 'doc', refId: 'r1', dataBase64: Buffer.from('hello').toString('base64') });
    expect(rec).toHaveProperty('refId', 'r1');
    expect(rec).toHaveProperty('cid');
    expect(rec).toHaveProperty('txId');
    expect(rec).toHaveProperty('sha256');
  });

  it('verifies anchored record', async () => {
    await svc.anchor({ type: 'doc', refId: 'r2', dataBase64: Buffer.from('abc').toString('base64') });
    const ver = await svc.verify('r2');
    expect(ver.valid).toBe(true);
    expect(ver.refId).toBe('r2');
  });

  it('returns invalid for unknown refId', async () => {
    const ver = await svc.verify('unknown');
    expect(ver.valid).toBe(false);
  });
});
