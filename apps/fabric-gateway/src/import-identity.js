import fs from 'fs';
import path from 'path';
import { Wallets } from 'fabric-network';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

async function main() {
  const { org: orgName, label, cert, key } = parseArgs();
  if (!orgName || !label || !cert || !key) {
    console.error('Usage: node src/import-identity.js --org <name> --label <walletLabel> --cert <cert.pem> --key <key.pem>');
    process.exit(1);
  }
  const ORGS_JSON = process.env.ORGS_JSON || '';
  const DEFAULT_ORG = process.env.DEFAULT_ORG || '';
  const orgs = ORGS_JSON ? JSON.parse(ORGS_JSON) : [{ name: DEFAULT_ORG || 'default', walletDir: '/app/wallet', mspId: process.env.MSPID }];
  const org = orgs.find(o => (o.name || '').toString() === orgName);
  if (!org) {
    console.error(`Org '${orgName}' not found. Configure DEFAULT_ORG/ORGS_JSON or pass correct name.`);
    process.exit(2);
  }
  if (!org.walletDir || !org.mspId) {
    console.error('Org missing walletDir or mspId. Fix your env/ORGS_JSON.');
    process.exit(3);
  }
  const certPath = path.resolve(cert);
  const keyPath = path.resolve(key);
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.error('cert or key file not found');
    process.exit(4);
  }
  const certificate = fs.readFileSync(certPath, 'utf8');
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  const wallet = await Wallets.newFileSystemWallet(org.walletDir);
  await wallet.put(label, { credentials: { certificate, privateKey }, mspId: org.mspId, type: 'X.509' });
  console.log(`Imported identity '${label}' into wallet ${org.walletDir} for org '${orgName}'`);
}

main().catch((e) => { console.error(e?.message || e); process.exit(10); });
import fs from 'fs';
import path from 'path';
import { Wallets } from 'fabric-network';

async function main() {
  const [,, label, certPath, keyPath, mspId] = process.argv;
  if (!label || !certPath || !keyPath || !mspId) {
    console.error('Usage: node src/import-identity.js <label> <cert.pem> <key.pem> <MSPID>');
    process.exit(1);
  }
  const walletDir = process.env.WALLET_DIR || path.join(process.cwd(), 'wallet');
  const wallet = await Wallets.newFileSystemWallet(walletDir);
  const certificate = fs.readFileSync(certPath, 'utf8');
  const privateKey = fs.readFileSync(keyPath, 'utf8');
  const identity = { credentials: { certificate, privateKey }, mspId, type: 'X.509' };
  await wallet.put(label, identity);
  console.log(`Imported identity '${label}' into wallet at ${walletDir}`);
}

main().catch(err => { console.error(err); process.exit(1); });
