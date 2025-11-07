#!/usr/bin/env node
/**
 * Copy User1 identities from Hyperledger Fabric Samples test-network into this repo's creds folders
 * so the fabric-gateway can auto-import them into wallets (labels from ORGS_JSON like 'pme1', 'bank-ops').
 *
 * Usage:
 *   node scripts/fabric-import-testnet-identities.js [TEST_NETWORK_DIR]
 *
 * Defaults:
 *   TEST_NETWORK_DIR env var, or $HOME/fabric-samples/test-network
 */
const fs = require('fs');
const path = require('path');

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function pickSingleFile(dir) {
  const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
  if (files.length === 0) throw new Error(`No files in ${dir}`);
  if (files.length > 1) {
    // Prefer .pem
    const pem = files.filter((f) => f.toLowerCase().endsWith('.pem'));
    if (pem.length === 1) return path.join(dir, pem[0]);
  }
  return path.join(dir, files[0]);
}

function copyIdentity({ base, orgIndex, destOrgDir }) {
  const domain = orgIndex === 1 ? 'org1.example.com' : 'org2.example.com';
  const user = `User1@${domain}`;
  const mspDir = path.join(base, 'organizations', 'peerOrganizations', domain, 'users', user, 'msp');
  const signcertsDir = path.join(mspDir, 'signcerts');
  const keystoreDir = path.join(mspDir, 'keystore');
  const certSrc = pickSingleFile(signcertsDir);
  const keySrc = pickSingleFile(keystoreDir);

  const destCredsDir = path.join(process.cwd(), 'fabric', destOrgDir, 'creds');
  ensureDir(destCredsDir);
  const certDest = path.join(destCredsDir, 'cert.pem');
  const keyDest = path.join(destCredsDir, 'key.pem');

  fs.copyFileSync(certSrc, certDest);
  fs.copyFileSync(keySrc, keyDest);
  return { certDest, keyDest, user, domain };
}

function main() {
  const argDir = process.argv[2];
  const envDir = process.env.TEST_NETWORK_DIR;
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const defaultDir = path.join(home, 'fabric-samples', 'test-network');
  const base = argDir || envDir || defaultDir;

  if (!fs.existsSync(base)) {
    console.error(`Test network directory not found: ${base}`);
    console.error('Provide the path as an argument or set TEST_NETWORK_DIR env var.');
    process.exit(2);
  }

  const results = [];
  try {
    results.push(copyIdentity({ base, orgIndex: 1, destOrgDir: 'org-kiota' }));
  } catch (e) {
    console.warn(`Org1 copy failed: ${e.message}`);
  }
  try {
    results.push(copyIdentity({ base, orgIndex: 2, destOrgDir: 'org-bank' }));
  } catch (e) {
    console.warn(`Org2 copy failed: ${e.message}`);
  }

  if (results.length === 0) {
    console.error('No identities copied. Ensure the test-network is started with CAs and users.');
    process.exit(1);
  }

  console.log('Copied identities:');
  for (const r of results) {
    console.log(`- ${r.user} (${r.domain}) -> cert: ${r.certDest}, key: ${r.keyDest}`);
  }
  console.log('Now restart the fabric-gateway container so it auto-imports these identities into wallets.');
}

if (require.main === module) main();
