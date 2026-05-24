import { Hono } from 'hono';
import authMiddleware from '../middleware/auth.js';
import { updateUserPlan } from '../services/supabase.js';

const router = new Hono();

const buildPlanCatalog = () => ({
  free: {
    id: 'free',
    label: 'Free',
    price: '$0',
    billingCycle: 'month',
    description: 'Start with the essentials for drafting and organizing replies.',
    features: [
      '10 drafts per month',
      'Draft queue dashboard',
      'Google and LinkedIn session support'
    ]
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: process.env.PADDLE_PRO_PRICE_LABEL || 'Set in Paddle',
    billingCycle: 'month',
    description: 'Unlock higher limits and the full premium workflow.',
    features: [
      '1,000 drafts per month',
      'Priority plan access',
      'Everything in Free'
    ]
  }
});

const extractPlanFromWebhook = (payload) => {
  const candidates = [
    payload?.data?.plan,
    payload?.data?.status,
    payload?.plan,
    payload?.status,
    payload?.event_type,
    payload?.eventType,
    payload?.event
  ];

  const normalized = candidates.find(Boolean);
  if (!normalized) return null;

  const value = String(normalized).toLowerCase();
  if (value.includes('pro') || value.includes('active') || value.includes('paid')) {
    return 'pro';
  }

  if (value.includes('free') || value.includes('trial') || value.includes('canceled') || value.includes('cancelled')) {
    return 'free';
  }

  return null;
};

const extractUserIdFromWebhook = (payload) => {
  return (
    payload?.data?.custom_data?.user_id ||
    payload?.data?.custom_data?.userId ||
    payload?.data?.user_id ||
    payload?.data?.userId ||
    payload?.custom_data?.user_id ||
    payload?.custom_data?.userId ||
    payload?.user_id ||
    payload?.userId ||
    payload?.customer_id ||
    payload?.customerId ||
    null
  );
};

/**
 * POST /billing/webhook
 * Best-effort Paddle webhook handler for local development.
 */
router.post('/webhook', async (c) => {
  try {
    const payload = await c.req.json().catch(() => null);

    if (!payload) {
      return c.json({ success: false, error: 'Invalid webhook payload' }, 400);
    }

    const userId = extractUserIdFromWebhook(payload);
    const nextPlan = extractPlanFromWebhook(payload);

    if (userId && nextPlan) {
      await updateUserPlan(userId, nextPlan);
      return c.json({
        success: true,
        data: {
          updated: true,
          userId,
          plan: nextPlan
        }
      });
    }

    return c.json({
      success: true,
      data: {
        received: true,
        updated: false
      }
    });
  } catch (error) {
    console.error('POST /billing/webhook error:', error);
    const message = process.env.NODE_ENV === 'development'
      ? (error?.message || 'Internal server error')
      : 'Internal server error';

    return c.json({ success: false, error: message }, 500);
  }
});

/**
 * GET /billing/status
 * Get the signed-in user's plan and plan catalog.
 */
router.get('/status', authMiddleware, (c) => {
  const user = c.get('user');
  const checkoutUrl = process.env.PADDLE_CHECKOUT_URL || null;
  const manageUrl = process.env.PADDLE_MANAGE_URL || null;

  return c.json({
    success: true,
    data: {
      plan: user?.plan || 'free',
      canUpgrade: (user?.plan || 'free') !== 'pro',
      checkoutUrl,
      manageUrl,
      configured: Boolean(checkoutUrl || manageUrl),
      plans: buildPlanCatalog()
    }
  });
});

export default router;
