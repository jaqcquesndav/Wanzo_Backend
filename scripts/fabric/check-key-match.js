// Quick helper: verify if X.509 cert public key matches the given private key.
// Usage: node check-key-match.js <certPemPath> <keyPemPath>

const fs = require('fs');
const { X509Certificate, createPublicKey } = require('crypto');

function die(msg) {
  console.error(msg);
  process.exit(2);
}

async function main() {
  const [certPath, keyPath] = process.argv.slice(2);
  if (!certPath || !keyPath) die('Usage: node check-key-match.js <certPemPath> <keyPemPath>');
  const certPem = fs.readFileSync(certPath, 'utf8');
  const keyPem = fs.readFileSync(keyPath, 'utf8');
  const cert = new X509Certificate(certPem);
  const certSpki = cert.publicKey.export({ type: 'spki', format: 'der' });
  const pubFromKey = createPublicKey({ key: keyPem, format: 'pem' }).export({ type: 'spki', format: 'der' });
  const match = Buffer.compare(certSpki, pubFromKey) === 0;
  console.log(JSON.stringify({ match, subject: cert.subject, issuer: cert.issuer }));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
