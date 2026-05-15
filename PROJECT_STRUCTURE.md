# Project Structure — AI LinkedIn + Gmail Chrome Extension

```
reachai/                                  ← root of your project
│
├── extension/                            ← Chrome extension (React + Vite)
│   ├── public/
│   │   └── icons/
│   │       ├── icon16.png
│   │       ├── icon48.png
│   │       └── icon128.png
│   │
│   ├── src/
│   │   ├── popup/                        ← main popup UI (what user sees on click)
│   │   │   ├── Popup.jsx                 ← root popup component
│   │   │   ├── pages/
│   │   │   │   ├── Auth.jsx              ← sign in with Google screen
│   │   │   │   ├── Dashboard.jsx         ← draft queue + category overview
│   │   │   │   ├── DraftView.jsx         ← single draft edit/approve/discard
│   │   │   │   └── Settings.jsx          ← user prefs, plan status
│   │   │   └── components/
│   │   │       ├── DraftCard.jsx         ← one draft item in the queue
│   │   │       ├── CategoryFilter.jsx    ← hot/follow-up/waiting/cold tabs
│   │   │       ├── PlanBadge.jsx         ← free vs pro badge
│   │   │       └── LoadingSpinner.jsx
│   │   │
│   │   ├── content/                      ← scripts injected into web pages
│   │   │   ├── gmail.js                  ← injects "Draft reply" button into Gmail UI
│   │   │   ├── linkedin.js               ← reads LinkedIn DM DOM, injects button
│   │   │   └── utils/
│   │   │       ├── domHelpers.js         ← safe DOM query helpers
│   │   │       └── observer.js           ← MutationObserver wrapper (for SPA routing)
│   │   │
│   │   ├── background/                   ← service worker (runs in background)
│   │   │   ├── index.js                  ← service worker entry point
│   │   │   ├── alarms.js                 ← chrome.alarms for follow-up reminders
│   │   │   ├── notifications.js          ← chrome.notifications helper
│   │   │   └── messageRouter.js          ← routes messages between popup ↔ content
│   │   │
│   │   ├── lib/                          ← shared utilities across extension
│   │   │   ├── api.js                    ← all fetch calls to your backend
│   │   │   ├── auth.js                   ← chrome.identity OAuth helpers
│   │   │   ├── storage.js                ← chrome.storage.local wrappers
│   │   │   └── constants.js              ← API_URL, plan limits, label types
│   │   │
│   │   └── styles/
│   │       └── index.css                 ← Tailwind base import
│   │
│   ├── manifest.json                     ← Chrome extension config (Manifest V3)
│   ├── vite.config.js                    ← Vite build config for extension
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                              ← Node.js + Hono API server
│   ├── src/
│   │   ├── index.js                      ← Hono app entry, registers all routes
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.js                   ← POST /auth/google — verify token, create user
│   │   │   ├── drafts.js                 ← POST /drafts/generate, GET /drafts, DELETE /drafts/:id
│   │   │   ├── send.js                   ← POST /send/gmail, POST /send/linkedin-inject
│   │   │   ├── categorize.js             ← POST /categorize — batch label threads
│   │   │   ├── reminders.js              ← GET /reminders/pending, POST /reminders/snooze
│   │   │   └── billing.js                ← POST /billing/webhook (LemonSqueezy), GET /billing/status
│   │   │
│   │   ├── services/
│   │   │   ├── openai.js                 ← all GPT-4o calls (draft, categorize, follow-up)
│   │   │   ├── gmail.js                  ← Gmail API: read threads, send email
│   │   │   ├── supabase.js               ← Supabase client + query helpers
│   │   │   └── lemonsqueezy.js           ← webhook verification, license check
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                   ← verify user token on every request
│   │   │   ├── planGuard.js              ← block free users from pro endpoints
│   │   │   └── errorHandler.js           ← global error catcher
│   │   │
│   │   └── lib/
│   │       ├── prompts.js                ← all GPT-4o system prompts in one place
│   │       └── constants.js              ← plan limits, label enums, timeouts
│   │
│   ├── .env                              ← secrets (never commit this)
│   ├── .env.example                      ← template for env vars (commit this)
│   ├── package.json
│   └── Dockerfile                        ← for Digital Ocean deployment
│
├── .gitignore
├── README.md
└── PROJECT_STRUCTURE.md                  ← this file
```

---

## Key files explained

### `extension/manifest.json`
Defines permissions, content script targets, and background service worker.
Permissions needed: `identity`, `storage`, `alarms`, `notifications`, `activeTab`
Host permissions: `https://mail.google.com/*`, `https://www.linkedin.com/*`, `https://*.googleapis.com/*`

### `extension/src/lib/api.js`
Single file for ALL backend calls. Every fetch goes through here.
Never call the backend directly from components — always through this file.

### `extension/src/content/linkedin.js`
Uses MutationObserver to watch for LinkedIn DM panel opening (LinkedIn is a SPA).
Reads `.msg-thread` DOM elements to extract conversation text.

### `backend/src/lib/prompts.js`
All GPT-4o system prompts live here. Never hardcode prompts inside route handlers.
Makes it easy to tune AI behaviour without hunting through routes.

### `backend/src/.env.example`
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LEMONSQUEEZY_WEBHOOK_SECRET=...
LEMONSQUEEZY_STORE_ID=...
PORT=3000
```

---

## Build order (vertical — one feature at a time)

| # | Feature | Folder focus |
|---|---|---|
| 1 | Extension shell + Google auth | `extension/src/popup/pages/Auth.jsx` + `extension/src/lib/auth.js` + `backend/src/routes/auth.js` |
| 2 | Gmail read + AI draft | `extension/src/content/gmail.js` + `backend/src/routes/drafts.js` + `backend/src/services/openai.js` |
| 3 | Draft queue UI | `extension/src/popup/pages/Dashboard.jsx` + `DraftView.jsx` + `DraftCard.jsx` |
| 4 | LinkedIn DM + draft | `extension/src/content/linkedin.js` + reuse drafts route |
| 5 | Auto-categorize | `backend/src/routes/categorize.js` + `CategoryFilter.jsx` |
| 6 | Follow-up reminders | `extension/src/background/alarms.js` + `notifications.js` |
