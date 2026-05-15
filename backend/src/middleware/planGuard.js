/**
 * Plan guard middleware
 * Blocks free users from pro-only endpoints
 */
export const planGuard = (allowedPlans) => {
  return async (c, next) => {
    const user = c.get('user');

    if (!user || !allowedPlans.includes(user.plan)) {
      return c.json({ success: false, error: 'Plan upgrade required' }, 403);
    }

    await next();
  };
};
