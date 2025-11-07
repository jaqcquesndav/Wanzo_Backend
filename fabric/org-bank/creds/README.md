Place the operator identity for BankMSP here:
- cert.pem: X.509 certificate (PEM)
- key.pem: Private key (PEM)

On gateway startup, if the wallet lacks identity 'bankOps', it will auto-import from these two files into /app/orgs/bank/wallet.
