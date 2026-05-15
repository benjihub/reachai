import { Hono } from 'hono';

const router = new Hono();

/**
 * POST /categorize
 * Categorize email threads into labels
 */
router.post('/', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

export default router;
