SELECT id, auth0Id, email, role, status, institutionId, createdAt 
FROM auth_users 
ORDER BY createdAt DESC;