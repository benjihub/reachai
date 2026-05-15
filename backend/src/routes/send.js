import { Hono } from 'hono';

const router = new Hono();

/**
 * POST /send/gmail
 * Send approved Gmail draft
 */
router.post('/gmail', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

/**
 * POST /send/linkedin-inject
 * Inject approved LinkedIn draft via content script
 */
router.post('/linkedin-inject', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

export default router;
