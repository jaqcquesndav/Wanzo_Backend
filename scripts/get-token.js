// Simple Node script to fetch an Auth0 M2M access token using env vars (CommonJS-compatible)
// Usage: node scripts/get-token.js
// Attempts to load .env if dotenv is installed, but works without it if env vars are set in shell.

try { require('dotenv').config(); } catch (_) {}

const domain = process.env.AUTH0_DOMAIN;
const audience = process.env.AUTH0_AUDIENCE;
const clientId = process.env.AUTH0_CLIENT_ID;
const clientSecret = process.env.AUTH0_CLIENT_SECRET;

if (!domain || !audience || !clientId || !clientSecret) {
  console.error('Missing one or more required env vars: AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET');
  process.exit(1);
}

async function getToken() {
  try {
  const res = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience,
        grant_type: 'client_credentials'
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Auth0 token request failed: ${res.status} ${res.statusText} - ${text}`);
    }
    const data = await res.json();
    console.log(JSON.stringify({
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in
    }, null, 2));
  } catch (err) {
    console.error('Error fetching token:', err.message);
    process.exit(2);
  }
}

getToken();
