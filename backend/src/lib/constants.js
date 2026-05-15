/**
 * Backend constants
 */

export const PLAN_LIMITS = {
  free: {
    draftsPerMonth: 50,
    emailsPerDay: 5
  },
  pro: {
    draftsPerMonth: 1000,
    emailsPerDay: 100
  }
};

export const LABEL_TYPES = ['hot', 'follow-up', 'waiting', 'cold'];

export const OPENAI_CONFIG = {
  model: 'gpt-4o',
  maxTokens: {
    draft: 500,
    categorize: 150,
    followup: 50
  },
  temperature: {
    draft: 0.7,
    categorize: 0.2
  }
};

export const DRAFT_EXPIRY_DAYS = 7;
