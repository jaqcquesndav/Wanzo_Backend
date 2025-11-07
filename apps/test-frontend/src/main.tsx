import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const domain = import.meta.env.VITE_AUTH0_DOMAIN as string | undefined;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string | undefined;
const audience = (import.meta.env.VITE_AUTH0_AUDIENCE as string) || 'https://api.wanzo.com';

const Root = (
  <React.StrictMode>
    <BrowserRouter>
      {domain && clientId ? (
        <Auth0Provider
          domain={domain}
          clientId={clientId}
          authorizationParams={{
            audience,
            redirect_uri: window.location.origin,
          }}
          cacheLocation="localstorage"
          useRefreshTokens
        >
          <App />
        </Auth0Provider>
      ) : (
        <App />
      )}
    </BrowserRouter>
  </React.StrictMode>
);

createRoot(document.getElementById('root')!).render(Root);
