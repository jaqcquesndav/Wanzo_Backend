import { IpfsService } from '../src/modules/ipfs/ipfs.service';

describe('IpfsService (mock mode)', () => {
  let svc: IpfsService;

  beforeEach(() => {
    process.env.IPFS_MODE = 'mock';
    svc = new IpfsService();
  });

  it('adds and retrieves a file', async () => {
    const content = Buffer.from('hello ipfs').toString('base64');
    const add = await svc.add(content, 'h.txt', 'text/plain');
    expect(add.cid).toMatch(/^bafy/);
    const stat = await svc.stat(add.cid);
    expect(stat.Size).toBe(Buffer.from('hello ipfs').length);
    const got = await svc.cat(add.cid);
    expect(got.dataBase64).toBe(content);
  });

  it('throws on missing cid', async () => {
    await expect(svc.stat('bafyunknown')).rejects.toBeTruthy();
    await expect(svc.cat('bafyunknown')).rejects.toBeTruthy();
  });
});
