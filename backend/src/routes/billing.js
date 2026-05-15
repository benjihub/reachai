import { Hono } from 'hono';

const router = new Hono();

/**
 * POST /billing/webhook
 * LemonSqueezy webhook handler
 */
router.post('/webhook', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

/**
 * GET /billing/status
 * Get user's billing status
 */
router.get('/status', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

export default router;
