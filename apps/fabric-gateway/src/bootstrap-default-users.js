import fs from 'fs';
import path from 'path';
import { Wallets } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';

function parseDotEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      out[key] = val;
    }
  }
  return out;
}

function getConfig() {
  const envPath = path.resolve(process.cwd(), 'apps/fabric-gateway/.env');
  const env = { ...parseDotEnv(envPath), ...process.env };
  const DEFAULT_ORG = env.DEFAULT_ORG || '';
  let orgs = [];
  try { orgs = JSON.parse(env.ORGS_JSON || '[]'); } catch {}
  if (!Array.isArray(orgs) || !orgs.length) {
    orgs = [{
      name: DEFAULT_ORG || 'default',
      mspId: env.MSPID || '',
      ccpPath: env.CCP_PATH || '/app/ccp/connection.json',
      walletDir: env.WALLET_DIR || '/app/wallet',
      identity: env.IDENTITY || '',
      caUrl: env.CA_URL || '',
      caName: env.CA_NAME || '',
      caAdminIdentity: env.CA_ADMIN_IDENTITY || '',
    }];
  }
  let users = [];
  try { users = JSON.parse(env.DEFAULT_USERS_JSON || '[]'); } catch {}
  if (!users.length) {
    // Provide a small default set if none supplied
    users = [
      { org: orgs[0]?.name, username: 'pme-default', affiliation: 'org1.department1', attrs: [{ name: 'role', value: 'client', ecert: true }] }
    ];
    if (orgs[1]?.name) users.push({ org: orgs[1].name, username: 'bank-ops', affiliation: 'org1.department1', attrs: [{ name: 'role', value: 'ops', ecert: true }] });
  }
  return { orgs, users };
}

async function ensureAdmin(org) {
  const wallet = await Wallets.newFileSystemWallet(org.walletDir);
  const existing = await wallet.get(org.caAdminIdentity);
  if (existing) return true;
  const adminId = org.caAdminEnrollId || process.env.CA_ADMIN_ENROLL_ID;
  const adminSecret = org.caAdminEnrollSecret || process.env.CA_ADMIN_ENROLL_SECRET;
  if (!adminId || !adminSecret) return false;
  const ccp = JSON.parse(fs.readFileSync(org.ccpPath, 'utf8'));
  const caInfo = ccp.certificateAuthorities && Object.values(ccp.certificateAuthorities)[0];
  const caURL = org.caUrl || caInfo?.url;
  const caName = org.caName || caInfo?.caName;
  const ca = new FabricCAServices(caURL, { verify: false }, caName);
  const enrollment = await ca.enroll({ enrollmentID: adminId, enrollmentSecret: adminSecret });
  const x509Identity = {
    credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
    mspId: org.mspId,
    type: 'X.509',
  };
  await wallet.put(org.caAdminIdentity, x509Identity);
  return true;
}

async function ensureUser(org, username, affiliation, attrs) {
  const issues = [];
  if (!org.caUrl) issues.push('CA_URL missing');
  if (!org.caAdminIdentity) issues.push('CA_ADMIN_IDENTITY missing');
  if (!fs.existsSync(org.walletDir)) issues.push('WALLET_DIR missing');
  if (!fs.existsSync(org.ccpPath)) issues.push('CCP_PATH missing');
  if (issues.length) throw new Error('Org not CA-configured: ' + issues.join(', '));

  const ccp = JSON.parse(fs.readFileSync(org.ccpPath, 'utf8'));
  const caInfo = ccp.certificateAuthorities && Object.values(ccp.certificateAuthorities)[0];
  const caURL = org.caUrl || caInfo?.url;
  const caName = org.caName || caInfo?.caName;
  const ca = new FabricCAServices(caURL, { verify: false }, caName);
  const wallet = await Wallets.newFileSystemWallet(org.walletDir);
  const exists = await wallet.get(username);
  if (exists) return { created: false, username };

  let admin = await wallet.get(org.caAdminIdentity);
  if (!admin) {
    const got = await ensureAdmin(org);
    admin = await wallet.get(org.caAdminIdentity);
    if (!got || !admin) throw new Error('CA admin identity not found in wallet');
  }
  const provider = wallet.getProviderRegistry().getProvider(admin.type);
  const adminUser = await provider.getUserContext(admin, org.caAdminIdentity);

  let secret;
  try {
    secret = await ca.register({ affiliation: affiliation || 'org1.department1', enrollmentID: username, role: 'client', attrs }, adminUser);
  } catch (e) {
    if (!/is already registered/i.test(e?.message || '')) throw e;
    secret = '';
  }
  const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
  const x509Identity = {
    credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
    mspId: org.mspId,
    type: 'X.509',
  };
  await wallet.put(username, x509Identity);
  return { created: true, username };
}

(async () => {
  const { orgs, users } = getConfig();
  const orgByName = (name) => orgs.find(o => (o.name || '').toString() === (name || '').toString());
  const results = [];
  for (const u of users) {
    const org = orgByName(u.org) || orgs[0];
    try {
      const r = await ensureUser(org, u.username, u.affiliation, u.attrs);
      results.push({ org: org.name, username: u.username, ok: true, created: r.created });
    } catch (e) {
      results.push({ org: org?.name, username: u.username, ok: false, error: e?.message || String(e) });
    }
  }
  console.log(JSON.stringify({ ok: results.every(r => r.ok), results }, null, 2));
  process.exit(results.every(r => r.ok) ? 0 : 2);
})().catch((e) => { console.error(e?.message || e); process.exit(10); });
