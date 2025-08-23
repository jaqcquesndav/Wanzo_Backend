// Test de connectivité direct au customer service
console.log('=== Test de connectivité au customer service ===');

// 1. Test : Direct au customer service avec path complet
console.log('\n1. Test direct customer service avec /land/api/v1/users');
fetch('http://kiota-customer-service:3011/land/api/v1/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe"
  })
})
.then(response => {
  console.log(`Status: ${response.status}`);
  return response.text();
})
.then(data => console.log('Response:', data))
.catch(err => console.log('Error:', err.message));

// 2. Test : Direct au customer service sans path
console.log('\n2. Test direct customer service avec /users');
fetch('http://kiota-customer-service:3011/users', {
  method: 'POST',  
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "test@example.com",
    firstName: "John", 
    lastName: "Doe"
  })
})
.then(response => {
  console.log(`Status: ${response.status}`);
  return response.text();
})
.then(data => console.log('Response:', data))
.catch(err => console.log('Error:', err.message));
