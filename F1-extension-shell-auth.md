# F1 — Extension Shell + Google OAuth
**Tier 1 · Day 1–2 · Foundation for every other feature**

---

## Overview
The entry point of the entire product. When a user installs the extension and clicks
the icon for the first time, they see an auth screen. After signing in with Google
and granting Gmail permission, they land on a dashboard. This feature creates the
user record, stores the session, and unlocks the rest of the app.

---

## User flow — step by step

```
[User finds extension on Chrome Web Store]
        ↓
[Clicks "Add to Chrome"]
        ↓
[Chrome shows permissions dialog]
  - Read your browsing history (for activeTab)
  - Manage your downloads (not needed — remove)
  → User clicks "Add extension"
        ↓
[Extension icon appears in Chrome toolbar]
        ↓
[User clicks the icon]
        ↓
[Popup opens — Auth screen]
  - ReachAI logo
  - Tagline: "AI-powered outreach for LinkedIn + Gmail"
  - "Sign in with Google" button
        ↓
[User clicks "Sign in with Google"]
        ↓
[chrome.identity.launchWebAuthFlow() opens Google OAuth popup]
  - Scopes requested:
    · https://www.googleapis.com/auth/gmail.readonly
    · https://www.googleapis.com/auth/gmail.send
    · https://www.googleapis.com/auth/userinfo.email
    · https://www.googleapis.com/auth/userinfo.profile
        ↓
[User selects Google account + clicks "Allow"]
        ↓
[Extension receives OAuth token]
        ↓
[Token sent to backend POST /auth/google]
        ↓
[Backend verifies token with Google tokeninfo endpoint]
        ↓
[Backend checks if user exists in Supabase]
  → If new user: creates record in users table
  → If existing user: returns existing record
        ↓
[Backend returns: { userId, email, name, avatar, plan }]
        ↓
[Extension stores session in chrome.storage.local]
  - { userId, email, name, avatar, plan, googleToken, tokenExpiry }
        ↓
[Popup transitions to Dashboard screen]
  - Shows user avatar + name in header
  - Empty draft queue with onboarding message
```

---

## Screens

### Screen 1 — Auth (unauthenticated)

```
┌─────────────────────────────────┐
│                                 │
│         [ReachAI Logo]          │
│                                 │
│   AI-powered outreach for       │
│   LinkedIn + Gmail              │
│                                 │
│  ┌───────────────────────────┐  │
│  │  🔵  Sign in with Google  │  │
│  └───────────────────────────┘  │
│                                 │
│  By signing in you agree to     │
│  our Terms · Privacy Policy     │
│                                 │
└─────────────────────────────────┘
```

**Dimensions:** 380px wide × 480px tall (standard extension popup)
**States:** default, loading (spinner on button), error (inline error message)

---

### Screen 2 — Loading (post OAuth, waiting for backend)

```
┌─────────────────────────────────┐
│                                 │
│         [ReachAI Logo]          │
│                                 │
│         ⟳  Setting up...        │
│                                 │
└─────────────────────────────────┘
```

---

### Screen 3 — Dashboard (authenticated, empty state)

```
┌─────────────────────────────────┐
│ [Avatar] Jane D.      [⚙] [··] │  ← header
├─────────────────────────────────┤
│ [All] [Hot] [Follow-up] [Cold]  │  ← category tabs (disabled until F5)
├─────────────────────────────────┤
│                                 │
│   📭  No drafts yet             │
│                                 │
│   Open Gmail or LinkedIn and    │
│   click "Draft reply" to get    │
│   started.                      │
│                                 │
│  [Open Gmail]  [Open LinkedIn]  │
│                                 │
└─────────────────────────────────┘
```

---

## Component tree

```
Popup.jsx (root)
├── AuthPage.jsx              ← shown when no session in storage
│   ├── Logo.jsx
│   ├── GoogleSignInButton.jsx
│   └── ErrorMessage.jsx
│
└── DashboardPage.jsx         ← shown when session exists
    ├── Header.jsx
    │   ├── Avatar.jsx
    │   ├── UserName.jsx
    │   └── SettingsButton.jsx
    ├── CategoryTabs.jsx      ← placeholder tabs (active in F5)
    └── EmptyState.jsx        ← shown until F2 produces drafts
```

---

## Files to create

```
extension/src/popup/pages/Auth.jsx
extension/src/popup/pages/Dashboard.jsx
extension/src/popup/components/Header.jsx
extension/src/popup/components/Avatar.jsx
extension/src/popup/components/EmptyState.jsx
extension/src/popup/components/GoogleSignInButton.jsx
extension/src/lib/auth.js
extension/src/lib/storage.js
extension/src/lib/api.js               ← stub with just authGoogle()
extension/src/lib/constants.js
extension/manifest.json
backend/src/routes/auth.js
backend/src/services/supabase.js
backend/src/middleware/auth.js
```

---

## Data model

### Supabase — users table
```sql
create table users (
  id            uuid primary key default gen_random_uuid(),
  google_id     text unique not null,
  email         text unique not null,
  name          text,
  avatar_url    text,
  plan          text default 'free',   -- 'free' | 'pro'
  draft_count   int default 0,         -- resets monthly
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

### chrome.storage.local schema
```js
{
  session: {
    userId: "uuid",
    email: "jane@gmail.com",
    name: "Jane Doe",
    avatar: "https://...",
    plan: "free",
    googleToken: "ya29...",
    tokenExpiry: 1716000000000   // unix ms
  }
}
```

---

## API contract

### POST /auth/google
**Request:**
```json
{ "googleToken": "ya29.a0AfH..." }
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "userId": "550e8400-...",
    "email": "jane@gmail.com",
    "name": "Jane Doe",
    "avatar": "https://lh3.googleusercontent.com/...",
    "plan": "free"
  }
}
```

**Response (error):**
```json
{ "success": false, "error": "Invalid Google token" }
```

---

## Backend logic — auth.js route

```
1. Receive googleToken from extension
2. Call GET https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={token}
3. If response.error → return 401
4. Extract: email, sub (google_id), name, picture
5. Upsert into users table:
   - ON CONFLICT (google_id) DO UPDATE SET updated_at = now()
6. Return user record
```

---

## Error states

| Scenario | UI behaviour |
|---|---|
| User cancels Google OAuth | Auth screen stays, no error shown |
| Google token invalid | Show: "Sign in failed. Please try again." |
| Backend unreachable | Show: "Connection error. Check your internet." |
| User denies Gmail scope | Show: "Gmail access is required to draft replies." with retry button |
| Token expired on subsequent open | Silent re-auth via chrome.identity (no UI change) |

---

## Edge cases

- **Token refresh:** Google OAuth tokens expire in 1 hour. On each popup open,
  check tokenExpiry. If < 5 minutes remaining, call chrome.identity.getAuthToken
  with interactive: false to silently refresh before any API call.

- **Multiple Google accounts:** chrome.identity defaults to the primary Chrome
  account. If user wants to switch, they must go to Settings → Sign out → Sign in again.

- **Extension update:** chrome.storage.local persists across extension updates.
  Session stays valid.

- **Chrome profile switch:** Storage is per Chrome profile. Each profile needs
  its own sign-in.

---

## Acceptance criteria

- [ ] Clicking extension icon opens popup within 200ms
- [ ] Auth screen renders correctly with logo, tagline, and Google button
- [ ] Clicking Google button opens OAuth consent screen
- [ ] After approval, popup transitions to dashboard within 2 seconds
- [ ] User name and avatar appear in header
- [ ] Session persists across popup close/reopen
- [ ] Session persists across browser restart
- [ ] Backend creates user record in Supabase
- [ ] Expired token triggers silent re-auth (no logout)
- [ ] All error states display correct messages
