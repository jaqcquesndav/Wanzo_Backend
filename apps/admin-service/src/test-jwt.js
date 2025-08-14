// Script pour tester la validation du JWT avec la clé publique
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Le token à vérifier (sans le préfixe "Bearer ")
const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjRlQUJzRldHVC1yTnZCeTVjTGNLWiJ9.eyJpc3MiOiJodHRwczovL2Rldi10ZXptbG4wdGswZzFnb3VmLmV1LmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDExMzUzMTY4NjEyMTI2NzA3MDQ4OSIsImF1ZCI6WyJodHRwczovL2FwaS53YW56by5jb20iLCJodHRwczovL2Rldi10ZXptbG4wdGswZzFnb3VmLmV1LmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE3NTUxNzk1OTIsImV4cCI6MTc1NTI2NTk5Miwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsImF6cCI6IjQzZDY0a2dzVll5Q1pIRUZzYXg3emxSQlZVaXJhQ0tMIiwicGVybWlzc2lvbnMiOlsiYWNjb3VudGluZzpyZWFkIiwiYWNjb3VudGluZzp3cml0ZSIsImFkbWluOmZ1bGwiLCJhbmFseXRpY3M6cmVhZCIsImFuYWx5dGljczp3cml0ZSIsImluc3RpdHV0aW9uOm1hbmFnZSIsIm1vYmlsZTpyZWFkIiwibW9iaWxlOndyaXRlIiwicG9ydGZvbGlvOnJlYWQiLCJwb3J0Zm9saW86d3JpdGUiLCJzZXR0aW5nczptYW5hZ2UiLCJ1c2VyczptYW5hZ2UiXX0.d7MeFk4BYzy6L3kg7BdWPc8EbzGfhO8IOLd4EPyRl04PU-FCEYKQzev2_-UdVUM3QUWJzidVZU45MpAR44q3fXPO_M_J5oFweNYwXZok7mnov2prCpROODjRcCAGlstnT5qG90eUCUyIV00AhmmJ2SlyUNCdFttUEtj8oNRaW0756q4PblZK4E9aLZ6nHrKbi3t-C1XyiO5CcuPVASsvOr7j48Fcc_05F34DpXLCy8dlchHLzZtBdi0lnpn1tZE6G6CR39gTld-WL6BiAP5Ytee9bcDAPaGEg-xcqRAuOnieaPWc4Nw7RkLUyqe4WxBnfQU5HdNcEzA6vOIZU8R4xg";

// Décodage des informations sans vérification
console.log("1. Décodage du token sans vérification:");
try {
  const decoded = jwt.decode(token, { complete: true });
  console.log(JSON.stringify(decoded, null, 2));
} catch (err) {
  console.error("Erreur lors du décodage:", err);
}

// Vérification avec le certificat
console.log("\n2. Vérification avec le certificat:");
try {
  const cert = fs.readFileSync('c:\\Users\\DevSpace\\Wanzobe\\Wanzo_Backend\\apps\\admin-service\\auth0-certificate.pem', 'utf8');
  console.log("Certificat chargé");
  const verifyOptions = {
    issuer: "https://dev-tezmln0tk0g1gouf.eu.auth0.com/",
    audience: ["https://api.wanzo.com", "https://dev-tezmln0tk0g1gouf.eu.auth0.com/userinfo"],
    algorithms: ['RS256']
  };
  
  const verified = jwt.verify(token, cert, verifyOptions);
  console.log("Token vérifié avec succès ✅");
  console.log(JSON.stringify(verified, null, 2));
} catch (err) {
  console.error("Erreur lors de la vérification:", err);
}

// Vérification de la structure des claims
console.log("\n3. Vérification de la structure des claims:");
try {
  const decoded = jwt.decode(token);
  
  console.log(`Issuer (iss): ${decoded.iss}`);
  console.log(`Subject (sub): ${decoded.sub}`);
  console.log(`Audience (aud):`, decoded.aud);
  console.log(`Issued At (iat): ${new Date(decoded.iat * 1000).toISOString()}`);
  console.log(`Expiration (exp): ${new Date(decoded.exp * 1000).toISOString()}`);
  console.log(`Permissions:`, decoded.permissions);
} catch (err) {
  console.error("Erreur lors de l'analyse:", err);
}
