const path = '/land/api/v1/users';
const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

console.log('Original path:', path);
console.log('Normalized path:', normalizedPath);

const routes = [
  {
    service: 'customer',
    baseUrl: 'http://kiota-customer-service:3011',
    prefix: 'land/api/v1',
    healthCheck: '/health',
  }
];

console.log('Available routes:');
routes.forEach(route => {
  console.log(`- Service: ${route.service}, Prefix: "${route.prefix}"`);
  console.log(`  Normalized path starts with prefix: ${normalizedPath.startsWith(route.prefix)}`);
});

const route = routes.find(r => normalizedPath.startsWith(r.prefix));
console.log('Found route:', route ? route.service : 'null');
