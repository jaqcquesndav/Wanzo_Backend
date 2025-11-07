// Example: Auth0 M2M client calling the Payment API via Gateway
// Never commit real secrets. Use environment variables.
// Required env: AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, GATEWAY_BASE

const fetch = global.fetch || ((...args) => import('node-fetch').then(({default: f}) => f(...args)));

async function getToken() {
  const domain = process.env.AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;

  const res = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function initiatePayment(token) {
  const base = process.env.GATEWAY_BASE || 'http://localhost:8000';
  const url = `${base}/payments/serdipay/mobile`;

  const payload = {
    clientPhone: '243994972450',
    amount: 400,
    currency: 'CDF',
    telecom: 'AM',
    channel: 'merchant',
    clientReference: `order-${Date.now()}`,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

(async () => {
  try {
    const token = await getToken();
    await initiatePayment(token);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  }
})();
