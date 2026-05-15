import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRouter from './routes/auth.js';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.route('/auth', authRouter);

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
console.log(`ReachAI backend listening on port ${port}`);

export default {
  port,
  fetch: app.fetch
};
