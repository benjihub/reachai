import { Hono } from 'hono';

const router = new Hono();

/**
 * GET /reminders/pending
 * Get pending follow-up reminders
 */
router.get('/pending', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

/**
 * POST /reminders/snooze
 * Snooze a reminder
 */
router.post('/snooze', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

export default router;
