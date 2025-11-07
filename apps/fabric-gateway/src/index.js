import express from 'express';
import fs from 'fs';
import path from 'path';
import { Gateway, Wallets } from 'fabric-network';
import FabricCAServices from 'fabric-ca-client';

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 4000;
const CHANNEL = process.env.CHANNEL || 'mychannel';
const CHAINCODE = process.env.CHAINCODE || 'anchoring';
const FN_ANCHOR = process.env.FN_ANCHOR || 'Anchor';
const FN_ANCHOR_CID = process.env.FN_ANCHOR_CID || 'AnchorCID';
const FN_VERIFY = process.env.FN_VERIFY || 'Verify';
// Default discovery to disabled inside container to avoid unresolved internal hostnames (orderer.example.com) when using host.docker.internal mapped URLs in CCP.
const DISCOVERY_ENABLED = process.env.DISCOVERY_ENABLED === 'true';

// Multi-organization support
// Configure via ORGS_JSON (preferred) or single-org envs as fallback
// ORGS_JSON example:
// [
//   { "name": "kiota", "mspId": "KiotaMSP", "ccpPath": "/app/orgs/kiota/ccp/connection.json", "walletDir": "/app/orgs/kiota/wallet", "identity": "kiotaOps", "caUrl": "https://ca.kiota:7054", "caName": "ca-kiota", "caAdminIdentity": "ca-admin", "discoveryAsLocalhost": false },
//   { "name": "bank",  "mspId": "BankMSP",  "ccpPath": "/app/orgs/bank/ccp/connection.json",  "walletDir": "/app/orgs/bank/wallet",  "identity": "bankOps",  "caUrl": "https://ca.bank:8054",  "caName": "ca-bank",  "caAdminIdentity": "ca-admin", "discoveryAsLocalhost": false }
// ]
const ORGS_JSON = process.env.ORGS_JSON || '';
const DEFAULT_ORG = process.env.DEFAULT_ORG || '';

function buildSingleOrgFromEnv() {
  const ccpPath = process.env.CCP_PATH || '/app/ccp/connection.json';
  const mspId = process.env.MSPID || '';
  const identity = process.env.IDENTITY || '';
  const walletDir = process.env.WALLET_DIR || '/app/wallet';
  const discoveryAsLocalhost = String(process.env.DISCOVERY_AS_LOCALHOST || 'false') === 'true';
  const caUrl = process.env.CA_URL || '';
  const caName = process.env.CA_NAME || undefined;
  const caAdminIdentity = process.env.CA_ADMIN_IDENTITY || identity || '';
  return [
    {
      name: DEFAULT_ORG || 'default',
      mspId,
      ccpPath,
      walletDir,
      identity,
      discoveryAsLocalhost,
      caUrl,
      caName,
      caAdminIdentity,
    },
  ];
}

function parseOrgs() {
  if (ORGS_JSON) {
    try {
      const arr = JSON.parse(ORGS_JSON);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch (e) {
      console.warn('Invalid ORGS_JSON, falling back to single-org envs');
    }
  }
  return buildSingleOrgFromEnv();
}

const ORGS = parseOrgs();
const DEFAULT_USERS_JSON = process.env.DEFAULT_USERS_JSON || '[]';

function replaceLocalhost(url) {
  if (!url || typeof url !== 'string') return url;
  return url.replace('://localhost:', '://host.docker.internal:');
}

function loadCcp(org) {
  const raw = fs.readFileSync(org.ccpPath, 'utf8');
  const ccp = JSON.parse(raw);
  if (process.env.USE_HOST_DOCKER_INTERNAL === 'true') {
    try {
      if (ccp.peers) {
        for (const k of Object.keys(ccp.peers)) {
          const p = ccp.peers[k];
          if (p && p.url) p.url = replaceLocalhost(p.url);
        }
      }
      if (ccp.orderers) {
        for (const k of Object.keys(ccp.orderers)) {
          const o = ccp.orderers[k];
          if (o && o.url) o.url = replaceLocalhost(o.url);
        }
      }
      // We keep CA URL from env (org.caUrl), but normalize CA in CCP too
      if (ccp.certificateAuthorities) {
        for (const k of Object.keys(ccp.certificateAuthorities)) {
          const ca = ccp.certificateAuthorities[k];
          if (ca && ca.url) ca.url = replaceLocalhost(ca.url);
        }
      }
    } catch {}
  }
  return ccp;
}

function resolveOrgName(req) {
  // Prefer header, then query, then env default, then first
  const fromHeader = (req.headers['x-fabric-org'] || '').toString().trim();
  const fromQuery = (req.query.org || '').toString().trim();
  return fromHeader || fromQuery || DEFAULT_ORG || (ORGS[0]?.name || 'default');
}

function getOrgConfig(name) {
  const org = ORGS.find(o => (o.name || '').toString() === name);
  return org || ORGS[0];
}

// Best-effort: ensure CA admin identity exists in wallet by enrolling with env creds
async function ensureCaAdmin(org) {
  try {
    if (!org || !org.walletDir || !org.caAdminIdentity) return false;
    const wallet = await Wallets.newFileSystemWallet(org.walletDir);
    const admin = await wallet.get(org.caAdminIdentity);
    if (admin) return true;
    const enrollId = process.env.CA_ADMIN_ENROLL_ID;
    const enrollSecret = process.env.CA_ADMIN_ENROLL_SECRET;
    if (!enrollId || !enrollSecret) return false;
    if (!fs.existsSync(org.ccpPath)) return false;
    const ccp = JSON.parse(fs.readFileSync(org.ccpPath, 'utf8'));
    const caInfo = ccp.certificateAuthorities && Object.values(ccp.certificateAuthorities)[0];
    const caURL = org.caUrl || caInfo?.url;
    const caName = org.caName || caInfo?.caName;
    if (!caURL) return false;
    let usedUrl = caURL;
    let ca = new FabricCAServices(usedUrl, { verify: false }, caName);
    let enrollment;
    try {
      enrollment = await ca.enroll({ enrollmentID: enrollId, enrollmentSecret: enrollSecret });
    } catch (e) {
      const msg = e?.message || '';
      // If HTTPS was used against a non-TLS CA, retry with HTTP
      if (usedUrl?.startsWith('https://') && /SSL routines:ssl3_get_record:wrong version number|EPROTO|write EPROTO/i.test(msg)) {
        usedUrl = usedUrl.replace('https://', 'http://');
        console.warn(`ensureCaAdmin: HTTPS failed, retrying with HTTP for '${org?.name}' at ${usedUrl}`);
        ca = new FabricCAServices(usedUrl, { verify: false }, caName);
        enrollment = await ca.enroll({ enrollmentID: enrollId, enrollmentSecret: enrollSecret });
      } else {
        throw e;
      }
    }
    const x509Identity = {
      credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
      mspId: org.mspId,
      type: 'X.509',
    };
    await wallet.put(org.caAdminIdentity, x509Identity);
  console.log(`Auto-enrolled CA admin '${org.caAdminIdentity}' for org '${org.name}' at ${usedUrl}`);
    return true;
  } catch (e) {
    console.warn(`ensureCaAdmin failed for org '${org?.name}': ${e?.message || e}`);
    return false;
  }
}

async function ensureIdentity(org) {
  try {
    if (!org || !org.walletDir || !org.identity || !org.mspId) return;
    const wallet = await Wallets.newFileSystemWallet(org.walletDir);
    const exists = await wallet.get(org.identity);
    if (exists) return;
    // Try auto-import from creds folder if present
    const baseDir = path.resolve(org.walletDir, '..');
    const credsDir = path.join(baseDir, 'creds');
    const certPath = path.join(credsDir, 'cert.pem');
    const keyPath = path.join(credsDir, 'key.pem');
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const certificate = fs.readFileSync(certPath, 'utf8');
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      const x509Identity = {
        credentials: { certificate, privateKey },
        mspId: org.mspId,
        type: 'X.509',
      };
      await wallet.put(org.identity, x509Identity);
      console.log(`Auto-imported identity '${org.identity}' for org '${org.name}' from ${credsDir}`);
    }

    // Optionally import CA admin if present in creds/admin
    if (org.caAdminIdentity) {
      const admin = await wallet.get(org.caAdminIdentity);
      if (!admin) {
        const adminDir = path.join(credsDir, 'admin');
        const adminCert = path.join(adminDir, 'cert.pem');
        const adminKey = path.join(adminDir, 'key.pem');
        if (fs.existsSync(adminCert) && fs.existsSync(adminKey)) {
          const certificate = fs.readFileSync(adminCert, 'utf8');
          const privateKey = fs.readFileSync(adminKey, 'utf8');
          const x509Identity = {
            credentials: { certificate, privateKey },
            mspId: org.mspId,
            type: 'X.509',
          };
          await wallet.put(org.caAdminIdentity, x509Identity);
          console.log(`Auto-imported CA admin '${org.caAdminIdentity}' for org '${org.name}' from ${adminDir}`);
        }
      }
    }
  } catch (e) {
    console.warn(`ensureIdentity failed for org '${org?.name}': ${e?.message || e}`);
  }
}

function notConfigured(org) {
  const issues = [];
  if (!org) return ['org not found'];
  if (!fs.existsSync(org.ccpPath)) issues.push('CCP_PATH missing');
  if (!org.mspId) issues.push('MSPID missing');
  if (!org.identity) issues.push('IDENTITY missing');
  if (!fs.existsSync(org.walletDir)) issues.push('WALLET_DIR missing');
  return issues;
}

function caNotConfigured(org) {
  const issues = [];
  if (!org) return ['org not found'];
  if (!org.caUrl) issues.push('CA_URL missing');
  if (!fs.existsSync(org.walletDir)) issues.push('WALLET_DIR missing');
  if (!org.caAdminIdentity) issues.push('CA_ADMIN_IDENTITY missing');
  return issues;
}

async function enrollUser(org, { username, affiliation = 'org1.department1', attrs, secret }) {
  if (!org) throw new Error('org not found');
  const issues = caNotConfigured(org);
  if (issues.length) {
    const err = new Error('CA not configured');
    err.issues = issues;
    throw err;
  }

  // Prepare CA client from CCP or env
  const ccp = JSON.parse(fs.readFileSync(org.ccpPath, 'utf8'));
  const caInfo = ccp.certificateAuthorities && Object.values(ccp.certificateAuthorities)[0];
  const caURL = org.caUrl || caInfo?.url;
  const caName = org.caName || caInfo?.caName;
  let usedUrl = caURL;
  let ca = new FabricCAServices(usedUrl, { verify: false }, caName);
  const wallet = await Wallets.newFileSystemWallet(org.walletDir);

  // Ensure CA admin exists, try auto-enroll with env creds if missing
  let admin = await wallet.get(org.caAdminIdentity);
  if (!admin) {
    const got = await ensureCaAdmin(org);
    admin = await wallet.get(org.caAdminIdentity);
    if (!got || !admin) {
      const err = new Error('CA admin identity not found in wallet');
      err.issues = ['ca admin missing'];
      throw err;
    }
  }
  const provider = wallet.getProviderRegistry().getProvider(admin.type);
  const adminUser = await provider.getUserContext(admin, org.caAdminIdentity);

  // Register user (idempotent) with HTTPS->HTTP fallback similar to enroll
  let enrollmentSecret = secret;
  try {
    if (!enrollmentSecret) {
      enrollmentSecret = await ca.register({ affiliation, enrollmentID: username, role: 'client', attrs }, adminUser);
    }
  } catch (e) {
    const msg = e?.message || '';
    if (usedUrl?.startsWith('https://') && /SSL routines:ssl3_get_record:wrong version number|EPROTO|write EPROTO/i.test(msg)) {
      usedUrl = usedUrl.replace('https://', 'http://');
      console.warn(`enrollUser.register: HTTPS failed, retrying with HTTP for '${org?.name}' at ${usedUrl}`);
      ca = new FabricCAServices(usedUrl, { verify: false }, caName);
      // Retry register once
      if (!enrollmentSecret) {
        enrollmentSecret = await ca.register({ affiliation, enrollmentID: username, role: 'client', attrs }, adminUser);
      }
    } else if (/is already registered/i.test(msg)) {
      enrollmentSecret = secret || '';
    } else {
      throw e;
    }
  }

  // Enroll user, with HTTPS->HTTP fallback
  let enrollment;
  try {
    enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret });
  } catch (e) {
    const msg = e?.message || '';
    if (usedUrl?.startsWith('https://') && /SSL routines:ssl3_get_record:wrong version number|EPROTO|write EPROTO/i.test(msg)) {
      usedUrl = usedUrl.replace('https://', 'http://');
      console.warn(`enrollUser: HTTPS failed, retrying with HTTP for '${org?.name}' at ${usedUrl}`);
      ca = new FabricCAServices(usedUrl, { verify: false }, caName);
      enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret });
    } else {
      throw e;
    }
  }
  const x509Identity = {
    credentials: { certificate: enrollment.certificate, privateKey: enrollment.key.toBytes() },
    mspId: org.mspId,
    type: 'X.509',
  };
  await wallet.put(username, x509Identity);
  return { username };
}

async function getContract(org) {
  const issues = notConfigured(org);
  if (issues.length) {
    const err = new Error('Fabric gateway not configured');
    err.issues = issues;
    throw err;
  }
  const ccp = loadCcp(org);
  const wallet = await Wallets.newFileSystemWallet(org.walletDir);
  const identity = await wallet.get(org.identity);
  if (!identity) {
    const err = new Error('IDENTITY not found in wallet');
    err.issues = ['IDENTITY not in wallet'];
    throw err;
  }
  const gateway = new Gateway();
  const asLocalhost = Boolean(org.discoveryAsLocalhost) && process.env.USE_HOST_DOCKER_INTERNAL !== 'true';
  await gateway.connect(ccp, {
    wallet,
    identity: org.identity,
  discovery: { enabled: DISCOVERY_ENABLED, asLocalhost }
  });
  const network = await gateway.getNetwork(CHANNEL);
  const contract = network.getContract(CHAINCODE);
  return { gateway, contract };
}

async function getNetworkOnly(org) {
  const issues = notConfigured(org);
  if (issues.length) {
    const err = new Error('Fabric gateway not configured');
    err.issues = issues;
    throw err;
  }
  const ccp = loadCcp(org);
  const wallet = await Wallets.newFileSystemWallet(org.walletDir);
  const identity = await wallet.get(org.identity);
  if (!identity) {
    const err = new Error('IDENTITY not found in wallet');
    err.issues = ['IDENTITY not in wallet'];
    throw err;
  }
  const gateway = new Gateway();
  const asLocalhost = Boolean(org.discoveryAsLocalhost) && process.env.USE_HOST_DOCKER_INTERNAL !== 'true';
  await gateway.connect(ccp, {
    wallet,
    identity: org.identity,
  discovery: { enabled: DISCOVERY_ENABLED, asLocalhost }
  });
  const network = await gateway.getNetwork(CHANNEL);
  return { gateway, network };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/readiness', (req, res) => {
  const orgName = resolveOrgName(req);
  const org = getOrgConfig(orgName);
  const issues = notConfigured(org);
  const ready = issues.length === 0;
  res.status(ready ? 200 : 503).json({ ready, org: orgName, issues });
});

app.get('/status', (req, res) => {
  const orgName = resolveOrgName(req);
  const org = getOrgConfig(orgName);
  const issues = notConfigured(org);
  const caIssues = caNotConfigured(org);
  res.json({
    org: orgName,
    channel: CHANNEL,
    chaincode: CHAINCODE,
    mspId: org?.mspId,
    identity: org?.identity,
    configured: issues.length === 0,
    issues,
    ca: caIssues.length === 0,
    caIssues,
  });
});

app.get('/orgs', (req, res) => {
  const list = ORGS.map((o) => ({
    name: o.name,
    mspId: o.mspId,
    walletDir: o.walletDir,
    hasCCP: fs.existsSync(o.ccpPath),
    hasWallet: fs.existsSync(o.walletDir),
    hasIdentity: (async () => {
      try {
        const w = await Wallets.newFileSystemWallet(o.walletDir);
        return Boolean(await w.get(o.identity));
      } catch { return false; }
    })(),
  }));
  // Resolve the async booleans
  Promise.all(list.map(async (item) => ({
    ...item,
    hasIdentity: await item.hasIdentity,
  }))).then((resolved) => res.json({ default: DEFAULT_ORG || ORGS[0]?.name, orgs: resolved }));
});

// Production anchor: strict 2-argument call (refId, sha256) expected by chaincode
app.post('/anchor', async (req, res) => {
  try {
    const { refId, sha256 } = req.body || {};
    if (!refId || !sha256) return res.status(400).json({ error: 'refId and sha256 are required' });
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const { gateway, contract } = await getContract(org);
    try {
      // Direct submitTransaction (simpler framing than createTransaction variant juggling)
      const resultBuf = await contract.submitTransaction(FN_ANCHOR, refId, sha256);
      const result = resultBuf?.toString?.() || null;
      return res.json({ ok: true, org: orgName, result });
    } finally {
      await gateway.disconnect();
    }
  } catch (e) {
    res.status(500).json({ error: e.message || 'anchor failed' });
  }
});

// Production anchor-cid: strict 2-argument call (refId, cid) expected by chaincode
app.post('/anchor-cid', async (req, res) => {
  try {
    const { refId, cid } = req.body || {};
    if (!refId || !cid) return res.status(400).json({ error: 'refId and cid are required' });
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const { gateway, contract } = await getContract(org);
    try {
      const resultBuf = await contract.submitTransaction(FN_ANCHOR_CID, refId, cid);
      const result = resultBuf?.toString?.() || null;
      return res.json({ ok: true, org: orgName, result });
    } finally {
      await gateway.disconnect();
    }
  } catch (e) {
    res.status(500).json({ error: e.message || 'anchor-cid failed' });
  }
});

app.get('/verify', async (req, res) => {
  try {
    const refId = req.query.refId;
    if (!refId) return res.status(400).json({ error: 'refId is required' });
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const { gateway, contract } = await getContract(org);
    try {
      const result = await contract.evaluateTransaction(FN_VERIFY, refId);
      const text = result?.toString?.() || '';
      let data = undefined;
      try { data = JSON.parse(text); } catch {}
      res.json({ ok: true, org: orgName, result: data ?? text });
    } finally {
      await gateway.disconnect();
    }
  } catch (e) {
    const status = e.issues ? 501 : 500;
    res.status(status).json({ error: e.message || 'verify failed', issues: e.issues || undefined });
  }
});

app.get('/ca/status', (req, res) => {
  const orgName = resolveOrgName(req);
  const org = getOrgConfig(orgName);
  const issues = caNotConfigured(org);
  res.json({ org: orgName, ca: issues.length === 0, issues });
});

// Explicitly enroll CA admin using env creds (admin/adminpw for samples)
app.post('/ca/admin/enroll', async (req, res) => {
  try {
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const got = await ensureCaAdmin(org);
    if (!got) return res.status(501).json({ error: 'failed to enroll CA admin (check CA availability and env creds)' });
    return res.json({ ok: true, org: orgName, caAdminIdentity: org.caAdminIdentity });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'CA admin enroll failed' });
  }
});

// Debug endpoint guarded by FABRIC_DEBUG=true
app.get('/debug/ccp', (req, res) => {
  try {
    if (process.env.FABRIC_DEBUG !== 'true') return res.status(404).json({ error: 'not found' });
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    if (!org || !fs.existsSync(org.ccpPath)) return res.status(404).json({ error: 'ccp not found' });
    const ccp = loadCcp(org);
    const clone = JSON.parse(JSON.stringify(ccp));
    if (clone.peers) {
      for (const k of Object.keys(clone.peers)) {
        if (clone.peers[k]?.tlsCACerts?.pem) clone.peers[k].tlsCACerts.pem = '---PEM OMITTED---';
      }
    }
    if (clone.orderers) {
      for (const k of Object.keys(clone.orderers)) {
        if (clone.orderers[k]?.tlsCACerts?.pem) clone.orderers[k].tlsCACerts.pem = '---PEM OMITTED---';
      }
    }
    return res.json({ org: orgName, discoveryEnabled: DISCOVERY_ENABLED, ccp: clone });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'failed to load ccp' });
  }
});

app.post('/ca/register-enroll', async (req, res) => {
  try {
  const orgName = resolveOrgName(req);
  const org = getOrgConfig(orgName);
  const issues = caNotConfigured(org);
    if (issues.length) return res.status(501).json({ error: 'CA not configured', issues });
  let { username, affiliation = 'org1.department1', attrs } = req.body || {};
    username = (username || req.query?.username || org.identity || '').toString().trim();
    if (!username) return res.status(400).json({ error: 'username is required (body.username or ?username=...)' });
    const result = await enrollUser(org, { username, affiliation, attrs, secret: req.body?.secret });
    res.json({ ok: true, org: orgName, username: result.username });
  } catch (e) {
    res.status(500).json({ error: e.message || 'CA register/enroll failed' });
  }
});

// Bootstrap multiple users across orgs from body.users or DEFAULT_USERS_JSON
app.post('/ca/bootstrap', async (req, res) => {
  try {
    const requested = Array.isArray(req.body?.users) ? req.body.users : undefined;
    let users = [];
    if (requested) {
      users = requested;
    } else {
      try {
        const parsed = JSON.parse(DEFAULT_USERS_JSON);
        if (Array.isArray(parsed)) users = parsed;
      } catch {}
    }

    // If still empty, create sensible defaults per org
    if (users.length === 0) {
      for (const org of ORGS) {
        const aff = org.name?.toLowerCase().includes('bank') ? 'org2.department1' : 'org1.department1';
        users.push(
          { org: org.name, username: org.identity || 'pme1', affiliation: aff, attrs: [{ name: 'role', value: 'client', ecert: true }] },
          { org: org.name, username: 'manager1', affiliation: aff, attrs: [{ name: 'role', value: 'manager', ecert: true }] },
          { org: org.name, username: 'analyst1', affiliation: aff, attrs: [{ name: 'role', value: 'analyst', ecert: true }] },
        );
      }
    }

    const results = [];
    for (const u of users) {
      const orgName = (u.org || resolveOrgName(req));
      const org = getOrgConfig(orgName);
      try {
        const r = await enrollUser(org, { username: u.username, affiliation: u.affiliation, attrs: u.attrs, secret: u.secret });
        results.push({ org: orgName, username: r.username, ok: true });
      } catch (e) {
        results.push({ org: orgName, username: u.username, ok: false, error: e.message || String(e), issues: e.issues });
      }
    }
    res.json({ ok: results.every(r => r.ok), results });
  } catch (e) {
    res.status(500).json({ error: e.message || 'bootstrap failed' });
  }
});

app.get('/network/summary', (req, res) => {
  try {
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    if (!fs.existsSync(org.ccpPath)) return res.status(501).json({ error: 'CCP_PATH missing' });
  const ccp = loadCcp(org);
    const orgs = Object.keys(ccp.organizations || {});
    const cas = Object.keys(ccp.certificateAuthorities || {});
    const orderers = Object.keys(ccp.orderers || {});
    const peers = Object.keys(ccp.peers || {});
    const detail = orgs.map((name) => {
      const o = ccp.organizations[name] || {};
      return {
        name,
        mspid: o.mspid,
        peers: (o.peers || []).length,
        certificateAuthorities: (o.certificateAuthorities || []).length,
      };
    });
    res.json({
      org: orgName,
      organizations: orgs.length,
      organizationNames: orgs,
      certificateAuthorities: cas.length,
      certificateAuthorityNames: cas,
      orderers: orderers.length,
      peers: peers.length,
      detail,
    });
  } catch (e) {
    res.status(500).json({ error: e.message || 'failed to parse CCP' });
  }
});

app.get('/channel/info', async (req, res) => {
  try {
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const { gateway, network } = await getNetworkOnly(org);
    try {
      const channel = network.getChannel();
      const info = await channel.queryInfo();
      const height = info?.height?.toString?.() || String(info?.height || '');
      res.json({ ok: true, org: orgName, height, currentBlockHash: info?.currentBlockHash?.toString('hex') || undefined });
    } finally {
      await gateway.disconnect();
    }
  } catch (e) {
    const status = e.issues ? 501 : 500;
    res.status(status).json({ error: e.message || 'channel info failed', issues: e.issues || undefined });
  }
});

app.get('/wallet', async (req, res) => {
  try {
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const wallet = await Wallets.newFileSystemWallet(org.walletDir);
    const list = await wallet.list();
    res.json({ org: orgName, identities: list.map(i => ({ label: i.label, type: i.type })) });
  } catch (e) {
    res.status(500).json({ error: e.message || 'wallet list failed' });
  }
});

// Query System Chaincode (QSCC) helper endpoints for Explorer-style queries
// Note: These require a running peer/orderer network and proper CCPs.
app.get('/qscc/block/:num', async (req, res) => {
  try {
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const { gateway, network } = await getNetworkOnly(org);
    try {
      const contract = network.getContract('qscc');
      const blockNum = (req.params.num || '0').toString();
      const result = await contract.evaluateTransaction('GetBlockByNumber', CHANNEL, blockNum);
      res.json({ ok: true, org: orgName, channel: CHANNEL, number: blockNum, block: result.toString('base64'), encoding: 'base64' });
    } finally {
      await gateway.disconnect();
    }
  } catch (e) {
    const status = e.issues ? 501 : 500;
    res.status(status).json({ error: e.message || 'qscc block query failed', issues: e.issues || undefined });
  }
});

app.get('/qscc/tx/:txId', async (req, res) => {
  try {
    const txId = (req.params.txId || '').toString().trim();
    if (!txId) return res.status(400).json({ error: 'txId is required' });
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const { gateway, network } = await getNetworkOnly(org);
    try {
      const contract = network.getContract('qscc');
      const result = await contract.evaluateTransaction('GetTransactionByID', CHANNEL, txId);
      res.json({ ok: true, org: orgName, channel: CHANNEL, txId, transaction: result.toString('base64'), encoding: 'base64' });
    } finally {
      await gateway.disconnect();
    }
  } catch (e) {
    const status = e.issues ? 501 : 500;
    res.status(status).json({ error: e.message || 'qscc tx query failed', issues: e.issues || undefined });
  }
});

// List peers defined in the CCP (static topology view)
app.get('/network/peers-ccp', (req, res) => {
  try {
    const orgName = resolveOrgName(req);
    const org = getOrgConfig(orgName);
    if (!fs.existsSync(org.ccpPath)) return res.status(501).json({ error: 'CCP_PATH missing' });
    const ccp = loadCcp(org);
    const peers = Object.keys(ccp.peers || {});
    res.json({ org: orgName, peers });
  } catch (e) {
    res.status(500).json({ error: e.message || 'failed to list peers from CCP' });
  }
});

app.post('/wallet/import', async (req, res) => {
  try {
    const orgName = (req.query.org || req.headers['x-fabric-org'] || '').toString().trim() || resolveOrgName(req);
    const org = getOrgConfig(orgName);
    const { label, certificate, privateKey } = req.body || {};
    if (!label || !certificate || !privateKey) return res.status(400).json({ error: 'label, certificate, privateKey are required' });
    const wallet = await Wallets.newFileSystemWallet(org.walletDir);
    await wallet.put(label, { credentials: { certificate, privateKey }, mspId: org.mspId, type: 'X.509' });
    res.json({ ok: true, org: orgName, label });
  } catch (e) {
    res.status(500).json({ error: e.message || 'wallet import failed' });
  }
});

app.listen(PORT, () => console.log(`Fabric gateway listening on ${PORT}`));

// Best-effort auto-import on startup
(async () => {
  for (const org of ORGS) {
    await ensureIdentity(org);
  }
})();
