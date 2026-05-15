import { Hono } from 'hono';

const router = new Hono();

/**
 * POST /drafts/generate
 * Generate AI draft from email/LinkedIn message
 */
router.post('/generate', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

/**
 * GET /drafts
 * Get user's draft queue
 */
router.get('/', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

/**
 * DELETE /drafts/:id
 * Delete draft
 */
router.delete('/:id', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

export default router;
