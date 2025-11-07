// Minimal Express mock for Payment Service so docker-compose can run without building TS
const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment-service' }));

// Mimic routes the gateway forwards after stripping '/payments' prefix
app.post('/serdipay/mobile', (req, res) => {
  res.status(202).json({ status: 'pending', provider: 'SerdiPay', echoed: req.body });
});

app.post('/serdipay/callback', (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3007;
app.listen(port, () => console.log(`Payment mock running on ${port}`));
