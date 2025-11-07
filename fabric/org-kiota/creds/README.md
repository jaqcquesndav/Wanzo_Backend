Place the operator identity for KiotaMSP here:
- cert.pem: X.509 certificate (PEM)
- key.pem: Private key (PEM)

On gateway startup, if the wallet lacks identity 'kiotaOps', it will auto-import from these two files into /app/orgs/kiota/wallet.
