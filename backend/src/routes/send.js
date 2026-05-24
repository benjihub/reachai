import { Hono } from 'hono';
import authMiddleware from '../middleware/auth.js';
import { sendEmail } from '../services/gmail.js';
import { updateDraftForUser } from '../services/supabase.js';

const router = new Hono();

/**
 * POST /send/gmail
 * Send approved Gmail draft
 */
router.post('/gmail', authMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await sendEmail({
      googleToken: body.googleToken,
      to: body.to,
      subject: body.subject,
      body: body.body,
      threadId: body.threadId,
      mode: body.mode || body.sendMode || 'reply',
      inReplyTo: body.inReplyTo || body.gmailMessageId || body.messageId || null,
      references: body.references || body.threadReferences || null
    });

    if (body.draftId) {
      try {
        await updateDraftForUser(c.get('userId'), body.draftId, {
          status: 'sent'
        });
      } catch (updateError) {
        console.warn('Could not mark Gmail reply as sent in Supabase:', updateError);
      }
    }

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('POST /send/gmail error:', error);

    return c.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message || 'Failed to send Gmail reply.'
          : 'Failed to send Gmail reply.'
      },
      500
    );
  }
});

/**
 * POST /send/gmail/new
 * Send a brand new composed email.
 */
router.post('/gmail/new', authMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const result = await sendEmail({
      googleToken: body.googleToken,
      to: body.to,
      subject: body.subject,
      body: body.body,
      mode: 'new'
    });

    if (body.draftId) {
      try {
        await updateDraftForUser(c.get('userId'), body.draftId, {
          status: 'sent'
        });
      } catch (updateError) {
        console.warn('Could not mark Gmail email as sent in Supabase:', updateError);
      }
    }

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('POST /send/gmail/new error:', error);

    return c.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message || 'Failed to send Gmail email.'
          : 'Failed to send Gmail email.'
      },
      500
    );
  }
});

/**
 * POST /send/linkedin-inject
 * Inject approved LinkedIn draft via content script
 */
router.post('/linkedin-inject', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

export default router;
