import fs from 'fs';
import path from 'path';
import { Wallets } from 'fabric-network';

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
  const ORGS_JSON = env.ORGS_JSON || '';
  let orgs = [];
  try { orgs = JSON.parse(ORGS_JSON); } catch {}
  if (!Array.isArray(orgs) || !orgs.length) {
    // fallback: single org from env
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
  return { DEFAULT_ORG: DEFAULT_ORG || (orgs[0]?.name || ''), orgs };
}

function hasOrderers(ccp) {
  return ccp && ccp.orderers && Object.keys(ccp.orderers).length > 0;
}

function containsPlaceholderPEM(pem) {
  return /REPLACE_WITH/i.test(pem || '');
}

async function checkOrg(o) {
  const result = {
    name: o.name,
    mspId: o.mspId,
    ccpPath: o.ccpPath,
    walletDir: o.walletDir,
    identity: o.identity,
    caUrl: o.caUrl,
    caName: o.caName,
    caAdminIdentity: o.caAdminIdentity,
    files: { ccp: false, credsCert: false, credsKey: false, adminCert: false, adminKey: false },
    ccp: { hasPeers: false, hasCAs: false, hasOrderers: false, placeholders: false },
    wallet: { hasIdentity: false, hasCaAdmin: false },
    issues: []
  };

  // CCP file
  result.files.ccp = fs.existsSync(o.ccpPath);
  if (!result.files.ccp) result.issues.push('CCP_PATH missing');
  let ccp = null;
  if (result.files.ccp) {
    try {
      ccp = JSON.parse(fs.readFileSync(o.ccpPath, 'utf8'));
      result.ccp.hasPeers = !!(ccp.peers && Object.keys(ccp.peers).length);
      result.ccp.hasCAs = !!(ccp.certificateAuthorities && Object.keys(ccp.certificateAuthorities).length);
      result.ccp.hasOrderers = hasOrderers(ccp);
      const pemSamples = [];
      for (const p of Object.values(ccp.peers || {})) pemSamples.push(p?.tlsCACerts?.pem);
      for (const ca of Object.values(ccp.certificateAuthorities || {})) pemSamples.push(ca?.tlsCACerts?.pem);
      for (const ordr of Object.values(ccp.orderers || {})) pemSamples.push(ordr?.tlsCACerts?.pem);
      result.ccp.placeholders = pemSamples.some(containsPlaceholderPEM);
      if (!result.ccp.hasOrderers) result.issues.push('No orderers in CCP');
      if (result.ccp.placeholders) result.issues.push('CCP contains placeholder PEMs');
    } catch (e) {
      result.issues.push('Invalid CCP JSON');
    }
  }

  // Creds PEM presence
  const baseDir = path.resolve(o.walletDir, '..');
  const credsDir = path.join(baseDir, 'creds');
  const certPath = path.join(credsDir, 'cert.pem');
  const keyPath = path.join(credsDir, 'key.pem');
  result.files.credsCert = fs.existsSync(certPath);
  result.files.credsKey = fs.existsSync(keyPath);
  if (!result.files.credsCert || !result.files.credsKey) result.issues.push('Missing operator cert.pem or key.pem');
  const adminDir = path.join(credsDir, 'admin');
  const adminCert = path.join(adminDir, 'cert.pem');
  const adminKey = path.join(adminDir, 'key.pem');
  result.files.adminCert = fs.existsSync(adminCert);
  result.files.adminKey = fs.existsSync(adminKey);

  // Wallet checks
  try {
    const wallet = await Wallets.newFileSystemWallet(o.walletDir);
    result.wallet.hasIdentity = !!(await wallet.get(o.identity));
    if (o.caAdminIdentity) result.wallet.hasCaAdmin = !!(await wallet.get(o.caAdminIdentity));
  } catch (e) {
    result.issues.push('Wallet not accessible');
  }

  // MSP / identity basics
  if (!o.mspId) result.issues.push('MSP ID missing');
  if (!o.identity) result.issues.push('Identity label missing');

  return result;
}

(async () => {
  const cfg = getConfig();
  const results = [];
  for (const o of cfg.orgs) {
    results.push(await checkOrg(o));
  }
  const summary = {
    default: cfg.DEFAULT_ORG,
    orgs: results,
    ok: results.every(r => r.issues.length === 0)
  };
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 2);
})().catch((e) => { console.error(e?.message || e); process.exit(10); });
