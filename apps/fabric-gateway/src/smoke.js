import http from 'http';

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: 'localhost', port: process.env.PORT || 4000, path, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  const res1 = await get('/orgs');
  const res2 = await get('/readiness');
  const res3 = await get('/network/summary');
  const res4 = await get('/channel/info');
  console.log('orgs:', res1.status, res1.body);
  console.log('readiness:', res2.status, res2.body);
  console.log('summary:', res3.status, res3.body);
  console.log('channel/info:', res4.status, res4.body);
})().catch((e) => { console.error(e?.message || e); process.exit(1); });
