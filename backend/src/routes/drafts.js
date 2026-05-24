import { Hono } from 'hono';
import authMiddleware from '../middleware/auth.js';
import { PLAN_LIMITS } from '../lib/constants.js';
import { generateComposeEmail, generateDraft } from '../services/openai.js';
import {
  getDraftsForUser,
  mapDraftRowsToApiDrafts,
  normalizeDraftRow,
  saveDraftForUser,
  updateDraftForUser
} from '../services/supabase.js';

const router = new Hono();

/**
 * POST /drafts/generate
 * Generate AI draft from email/LinkedIn message
 */
router.post('/generate', authMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const platform = body.platform === 'linkedin' ? 'linkedin' : 'gmail';
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const threadId = body.threadId || body.thread_id || `${platform}-${Date.now()}`;
    const contact = body.contact || body.name || 'Unknown contact';
    const contactEmail = body.contactEmail || body.email || null;
    const thread = body.thread || body.subject || body.title || 'Draft thread';
    const subject = body.subject || thread;

    if (messages.length === 0) {
      return c.json(
        { success: false, error: 'Missing conversation messages.' },
        400
      );
    }

    const text = await generateDraft(messages, platform);
    let savedDraft = null;
    let storeError = null;

    try {
      savedDraft = await saveDraftForUser(c.get('userId'), {
        platform,
        threadId,
        contact,
        contactEmail,
        subject,
        text,
        status: 'draft'
      }, {
        platform,
        threadId,
        contact,
        contactEmail,
        subject,
        status: 'draft'
      });
    } catch (error) {
      storeError = error;
    }

    const apiDraft = normalizeDraftRow(savedDraft || {
      id: `${platform}-${threadId}-${Date.now()}`,
      user_id: c.get('userId'),
      platform,
      thread_id: threadId,
      contact_name: contact,
      contact_email: contactEmail,
      subject,
      draft_text: text,
      status: 'draft',
      created_at: Date.now(),
      messages
    });

    return c.json({
      success: true,
      data: {
        ...apiDraft,
        threadId,
        thread,
        subject,
        text,
        label: body.label || 'follow-up',
        messages,
        stored: Boolean(savedDraft),
        storeError: storeError?.message || null
      }
    });
  } catch (error) {
    console.error('POST /drafts/generate error:', error);

    return c.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message || 'Failed to generate draft.'
          : 'Failed to generate draft.'
      },
      500
    );
  }
});

/**
 * POST /drafts/regenerate
 * Generate a replacement draft without counting toward usage.
 */
router.post('/regenerate', authMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const draft = body.draft || {};
    const platform = draft.platform === 'linkedin' ? 'linkedin' : 'gmail';
    const messages = Array.isArray(draft.messages)
      ? draft.messages
      : Array.isArray(draft.raw?.messages)
        ? draft.raw.messages
        : [];

    if (messages.length === 0) {
      return c.json(
        { success: false, error: 'Cannot regenerate without the original conversation.' },
        400
      );
    }

    const text = await generateDraft(messages, platform);
    let savedDraft = null;
    let storeError = null;

    if (draft.id || draft.draftId) {
      try {
        savedDraft = await updateDraftForUser(c.get('userId'), draft.id || draft.draftId, {
          text,
          status: draft.status || 'draft'
        });
      } catch (error) {
        storeError = error;
      }
    }

    return c.json({
      success: true,
      data: {
        ...(savedDraft ? normalizeDraftRow(savedDraft) : draft),
        text,
        updatedAt: Date.now(),
        stored: Boolean(savedDraft),
        storeError: storeError?.message || null
      }
    });
  } catch (error) {
    console.error('POST /drafts/regenerate error:', error);

    return c.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message || 'Failed to regenerate draft.'
          : 'Failed to regenerate draft.'
      },
      500
    );
  }
});

/**
 * POST /drafts/compose
 * Generate a brand new email from scratch.
 */
router.post('/compose', authMiddleware, async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const to = String(body.to || body.recipient || '').trim();
    const subject = String(body.subject || '').trim();
    const prompt = String(body.prompt || '').trim();
    const user = c.get('user');

    if (!to || !subject || !prompt) {
      return c.json(
        { success: false, error: 'to, subject and prompt are required.' },
        400
      );
    }

    const text = await generateComposeEmail({
      to,
      subject,
      prompt,
      senderName: user?.name || ''
    });

    const threadId = `compose-${Date.now()}`;
    let draft = null;
    let storeError = null;

    try {
      draft = await saveDraftForUser(c.get('userId'), {
        platform: 'gmail',
        threadId,
        contact: to,
        contactEmail: to,
        subject,
        text,
        status: 'draft'
      }, {
        platform: 'gmail',
        threadId,
        contact: to,
        contactEmail: to,
        subject,
        status: 'draft'
      });
    } catch (error) {
      storeError = error;
    }

    return c.json({
      success: true,
      data: {
        ...(draft ? normalizeDraftRow(draft) : {
          id: threadId,
          draftId: threadId,
          userId: c.get('userId'),
          platform: 'gmail',
          threadId,
          contact: to,
          contactEmail: to,
          thread: subject,
          subject,
          text,
          status: 'draft',
          createdAt: Date.now(),
          raw: {
            user_id: c.get('userId'),
            platform: 'gmail',
            thread_id: threadId,
            draft_text: text,
            status: 'draft'
          }
        }),
        threadId,
        prompt,
        text,
        label: 'all',
        stored: Boolean(draft),
        storeError: storeError?.message || null
      }
    });
  } catch (error) {
    console.error('POST /drafts/compose error:', error);

    return c.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message || 'Failed to generate compose draft.'
          : 'Failed to generate compose draft.'
      },
      500
    );
  }
});

/**
 * GET /drafts
 * Get user's draft queue
 */
router.get('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const userId = c.get('userId');
    const rows = await getDraftsForUser(userId);
    const drafts = mapDraftRowsToApiDrafts(rows);
    const activeDrafts = drafts.filter((draft) => (draft.status || 'draft') === 'draft');
    const history = drafts.filter((draft) => (draft.status || 'draft') !== 'draft');

    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const usageDrafts = drafts.filter((draft) => {
      const createdAt = new Date(draft.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt >= monthStart.getTime();
    });

    const planLimit = user?.plan === 'pro'
      ? PLAN_LIMITS.pro.draftsPerMonth
      : PLAN_LIMITS.free.draftsPerMonth;

    return c.json({
      success: true,
      data: {
        drafts: activeDrafts,
        history,
        usage: {
          used: usageDrafts.length,
          limit: planLimit,
          active: activeDrafts.length,
          history: history.length
        },
        usedDrafts: usageDrafts.length,
        draftsUsed: usageDrafts.length,
        count: activeDrafts.length
      }
    });
  } catch (error) {
    console.error('GET /drafts error:', error);
    return c.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message || 'Failed to load drafts.'
          : 'Failed to load drafts.'
      },
      500
    );
  }
});

/**
 * DELETE /drafts/:id
 * Delete draft
 */
router.delete('/:id', (c) => {
  return c.json({ error: 'Not implemented yet' }, 501);
});

/**
 * PATCH /drafts/:id
 * Update draft status. The local queue is source of truth until Supabase draft persistence lands.
 */
router.patch('/:id', authMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const status = body.status || 'draft';

    if (!['draft', 'sent', 'discarded'].includes(status)) {
      return c.json({ success: false, error: 'Invalid draft status.' }, 400);
    }

    const updated = await updateDraftForUser(c.get('userId'), id, { status });

    return c.json({
      success: true,
      data: normalizeDraftRow(updated)
    });
  } catch (error) {
    console.error('PATCH /drafts/:id error:', error);
    return c.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'development'
          ? error.message || 'Failed to update draft.'
          : 'Failed to update draft.'
      },
      500
    );
  }
});

export default router;
