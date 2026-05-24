import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRouter from './routes/auth.js';
import billingRouter from './routes/billing.js';
import draftsRouter from './routes/drafts.js';
import sendRouter from './routes/send.js';
import { createServer } from 'node:http';

const app = new Hono();

// Middleware
app.options('*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Private-Network': 'true',
      'Vary': 'Access-Control-Request-Headers'
    }
  });
});

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Private-Network', 'true');
  await next();
});
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.route('/auth', authRouter);
app.route('/billing', billingRouter);
app.route('/drafts', draftsRouter);
app.route('/send', sendRouter);

// Health check
app.get('/', (c) => {
  return c.json({ success: true, message: 'ReachAI backend running' });
});

// 404 handler
app.all('*', (c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Start server
const port = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const init = {
      method: req.method,
      headers: req.headers
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req;
      // Required by undici when streaming request bodies
      init.duplex = 'half';
    }

    const request = new Request(url, init);
    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`ReachAI backend listening on port ${port}`);
});

export default {
  port,
  fetch: app.fetch
};
