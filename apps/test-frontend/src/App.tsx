import React, { useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const isPreview = typeof window !== 'undefined' && window.location.port === '5173';
const apiBase = {
  customers: isPreview ? 'http://localhost:3011' : '',
  blockchain: isPreview ? 'http://localhost:3015' : '',
  fabric: isPreview ? 'http://localhost:4010' : '',
};
const api = {
  customers: `${apiBase.customers}/api/customers`,
  blockchainRegister: `${apiBase.blockchain}/blockchain/users/register`,
  blockchainMe: `${apiBase.blockchain}/blockchain/users/me`,
  fabricChannelInfo: `${apiBase.fabric}/channel/info`,
};

export default function App() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently, user } = useAuth0();
  const [manualToken, setManualToken] = useState<string>('');
  const [username, setUsername] = useState('pme-ui');
  const [affiliation, setAffiliation] = useState('org1.department1');
  const [log, setLog] = useState<string>('');

  const [autoToken, setAutoToken] = useState<string>('');
  const token = useMemo(() => autoToken || manualToken, [autoToken, manualToken]);

  async function ensureToken(scope?: string) {
    try {
      if (!isAuthenticated) return;
      const t = await getAccessTokenSilently(scope ? { authorizationParams: { scope } } : undefined);
      setAutoToken(t);
    } catch (e) {
      // fallback to manual
    }
  }

  const withAuth = (headers: Record<string, string> = {}) => (token ? { ...headers, Authorization: `Bearer ${token}` } : headers);

  async function createCustomer() {
    try {
  await ensureToken('users:register');
      const res = await fetch(`${api.customers}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...withAuth() },
        body: JSON.stringify({ name: username, email: `${username}@test.local` })
      });
      const text = await res.text();
      setLog(`createCustomer ${res.status}: ${text}`);
    } catch (e: any) {
      setLog(`createCustomer error: ${e?.message || e}`);
    }
  }

  async function registerOnFabric() {
    try {
  await ensureToken('users:register');
      const res = await fetch(api.blockchainRegister, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...withAuth() },
        body: JSON.stringify({ username, affiliation })
      });
      const text = await res.text();
      setLog(`registerOnFabric ${res.status}: ${text}`);
    } catch (e: any) {
      setLog(`registerOnFabric error: ${e?.message || e}`);
    }
  }

  async function me() {
    try {
  await ensureToken();
      const res = await fetch(api.blockchainMe, { headers: withAuth() });
      const text = await res.text();
      setLog(`me ${res.status}: ${text}`);
    } catch (e: any) {
      setLog(`me error: ${e?.message || e}`);
    }
  }

  async function channelInfo() {
    try {
      const res = await fetch(api.fabricChannelInfo);
      const text = await res.text();
      setLog(`channelInfo ${res.status}: ${text}`);
    } catch (e: any) {
      setLog(`channelInfo error: ${e?.message || e}`);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 720, margin: '2rem auto' }}>
      <h2>Wanzo Test Frontend</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {isLoading ? (
          <span>Auth: loading…</span>
        ) : isAuthenticated ? (
          <>
            <span>Connecté: {user?.email || user?.name || 'user'}</span>
            <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Logout</button>
          </>
        ) : (
          <button onClick={() => loginWithRedirect()}>Login with Auth0</button>
        )}
      </div>
      <p>Token: auto si connecté via Auth0, sinon collez un JWT (audience https://api.wanzo.com).</p>
      <textarea
        placeholder="Bearer JWT"
        value={manualToken}
        onChange={(e) => setManualToken(e.target.value)}
        rows={4}
        style={{ width: '100%' }}
      />

      <h3>Créer un client (Customer Service)</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <button onClick={createCustomer}>POST /api/customers</button>
      </div>

      <h3>Créer un utilisateur Fabric (via Blockchain Service)</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} placeholder="affiliation" />
        <button onClick={registerOnFabric}>POST /blockchain/users/register</button>
      </div>

      <h3>Mon profil JWT</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={me}>GET /blockchain/users/me</button>
      </div>

      <h3>Fabric Gateway</h3>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={channelInfo}>GET /fabric/channel/info</button>
      </div>

      <h3>Log</h3>
      <pre style={{ background: '#111', color: '#0f0', padding: 12, minHeight: 120 }}>{log}</pre>
    </div>
  );
}
