# Feature 1: Extension Shell + Google OAuth

## Goal

Build the first working slice of ReachAI: a Chrome extension popup that shows an auth screen when the user is signed out, performs Google OAuth when they click sign in, sends the token to the backend, and lands on the dashboard after the backend creates or finds the user.

## Scope

This feature covers:

- Popup shell and startup routing
- Google OAuth in the extension
- Backend verification of the Google access token
- Supabase user create-or-update flow
- Session storage in `chrome.storage.local`
- Authenticated dashboard shell

This feature does not cover Gmail reading, LinkedIn reading, drafts, categorization, or reminders.

## User flow

1. User opens the extension popup.
2. Popup checks whether a valid session exists.
3. If no valid session exists, show the auth screen.
4. User clicks sign in with Google.
5. Extension opens the Google OAuth flow.
6. Extension receives an access token.
7. Extension sends the token to `POST /auth/google`.
8. Backend verifies the token with Google.
9. Backend upserts the user in Supabase.
10. Backend returns the user profile.
11. Extension saves the session and shows the dashboard.

## UI states

### Auth

Show when no valid session exists.

Requirements:

- ReachAI logo or wordmark
- Short product tagline
- Google sign-in button
- Inline error state when sign-in fails
- Loading state while OAuth and backend verification are in progress

### Loading

Show while the popup is waiting for the backend response after OAuth.

Requirements:

- Minimal layout
- Spinner or progress indicator
- Short setup message

### Dashboard

Show after session creation.

Requirements:

- User avatar and name in the header
- Empty-state message for an initial inbox with no drafts
- Settings entry point
- Placeholder category filter for later features

## Frontend files

### Popup entry

- `extension/src/popup/Popup.jsx`

### Auth screen

- `extension/src/popup/pages/Auth.jsx`
- `extension/src/popup/components/GoogleSignInButton.jsx`

### Dashboard shell

- `extension/src/popup/pages/Dashboard.jsx`
- `extension/src/popup/components/Header.jsx`
- `extension/src/popup/components/Avatar.jsx`
- `extension/src/popup/components/EmptyState.jsx`
- `extension/src/popup/components/CategoryFilter.jsx`
- `extension/src/popup/components/PlanBadge.jsx`
- `extension/src/popup/components/LoadingSpinner.jsx`

### Extension helpers

- `extension/src/lib/auth.js`
- `extension/src/lib/api.js`
- `extension/src/lib/storage.js`
- `extension/src/lib/constants.js`

### Extension config

- `extension/manifest.json`

## Backend files

### Auth route

- `backend/src/routes/auth.js`

### Supabase helper

- `backend/src/services/supabase.js`

### Auth middleware

- `backend/src/middleware/auth.js`

### Backend entry point

- `backend/src/index.js`

## Data model

### Supabase `users`

```sql
create table users (
  id            uuid primary key default gen_random_uuid(),
  google_id     text unique not null,
  email         text unique not null,
  name          text,
  avatar_url    text,
  plan          text default 'free',
  draft_count   int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

### Stored session shape

```js
{
  userId: 'uuid',
  email: 'jane@gmail.com',
  name: 'Jane Doe',
  avatar: 'https://...',
  plan: 'free',
  googleToken: 'ya29...',
  tokenExpiry: 1716000000000
}
```

## API contract

### POST /auth/google

Request:

```json
{ "googleToken": "ya29.a0AfH..." }
```

Success response:

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

Error response:

```json
{ "success": false, "error": "Invalid Google token" }
```

## Backend responsibilities

The backend route should:

1. Accept the Google token from the extension.
2. Validate the request body.
3. Verify the token against Google.
4. Extract the user identity fields.
5. Upsert the user in Supabase.
6. Return the user profile in a consistent JSON response.

## Implementation notes

- Keep Google OAuth logic in `extension/src/lib/auth.js`.
- Keep session storage logic in `extension/src/lib/storage.js`.
- Keep backend fetch calls in `extension/src/lib/api.js`.
- Keep the browser API key out of the extension.
- Keep the service key on the backend only.
- Return structured error messages for cancelled sign-in, invalid tokens, and network failures.

## Acceptance checklist

- Popup opens to auth when no session exists.
- Sign-in button launches Google OAuth.
- Extension receives a Google access token.
- Backend verifies the token successfully.
- Supabase user row is created or updated.
- Session is stored locally.
- Popup switches to dashboard after sign-in.
- User name and avatar render in the dashboard header.

## Related documentation

- [Local development guide](docs/local-development.md)
- [Architecture overview](docs/architecture.md)
- [Main README](README.md)
