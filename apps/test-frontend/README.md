# Wanzo Test Frontend

Petit front Vite/React pour tester rapidement:
- Customer Service via /api/customers (proxy -> localhost:3011)
- Blockchain Service via /blockchain (proxy -> localhost:3015)
- Fabric Gateway via /fabric (proxy -> localhost:4010)

Lancer avec Docker:
- docker compose up -d test-frontend
- Ouvrir http://localhost:5173

Local (si workspaces npm posent problème, préférez Docker):
- npm install
- npm run dev

Note: Collez un JWT Auth0 (audience https://api.wanzo.com) dans la zone de texte pour appeler les routes protégées.