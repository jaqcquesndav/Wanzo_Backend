# Auth0 Machine-to-Machine (Client Credentials)

But: permettre à des services (backends) d’appeler Payment via l’API Gateway avec un jeton M2M.

## Pré-requis
- API Gateway configuré avec:
  - AUTH0_DOMAIN = dev-tezmln0tk0g1gouf.eu.auth0.com
  - AUTH0_AUDIENCE = https://api.wanzo.com
- Application M2M dans Auth0 avec les permissions nécessaires et l’audience ci-dessus.

## Obtenir un jeton (client_credentials)
Exemple Node (sans secret en dur):

```js
const res = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
    grant_type: 'client_credentials'
  }),
});
const { access_token } = await res.json();
```

## Appeler l’API Payment via Gateway
- Méthode: POST
- URL: `${GATEWAY_BASE}/payments/serdipay/mobile`
- Header: `Authorization: Bearer <access_token>`
- Corps: voir `payment-service-api.md` (InitiateSerdiPayRequest)

## Exemple complet
Voir `apps/payment-service/examples/auth0-m2m-client.js`.

Variables d’environnement (client):
- AUTH0_DOMAIN
- AUTH0_AUDIENCE
- AUTH0_CLIENT_ID
- AUTH0_CLIENT_SECRET
- GATEWAY_BASE (ex: http://localhost:8000)

Note: Ne pas committer de secrets. Utilisez un gestionnaire de secrets ou un fichier .env non versionné.
