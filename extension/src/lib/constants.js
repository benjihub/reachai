export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export const PLAN_LIMITS = {
  free: {
    draftsPerMonth: 10,
    emailsPerDay: 5,
    features: ['draft', 'categorize']
  },
  pro: {
    draftsPerMonth: 1000,
    emailsPerDay: 100,
    features: ['draft', 'categorize', 'auto-send', 'follow-up']
  }
};

export const LABEL_TYPES = ['hot', 'follow-up', 'waiting', 'cold'];

export const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
export const SESSION_EXPIRY_DAYS = 7;
