# ReachAI

ReachAI is a Chrome extension (Manifest V3) that helps manage LinkedIn DMs and Gmail conversations with AI-assisted draft replies, categorization, and follow-up workflows.

## Documentation

- [Local development guide](docs/local-development.md)
- [Architecture overview](docs/architecture.md)
- [Feature 1 implementation guide](F1-extension-shell-auth.md)

## What is in this repo

- `extension/` contains the Chrome extension built with React and Vite.
- `backend/` contains the Node.js + Hono API that handles auth, AI, and database access.
- `rules` contains the project rules and build constraints.
- `PROJECT_STRUCTURE.md` documents the intended folder layout.
- `F1-extension-shell-auth.md` describes the first feature slice: extension shell + Google OAuth.

## Current status

Feature 1 is in place:

- Popup auth screen
- Google OAuth flow
- Backend `POST /auth/google` route
- Supabase user upsert logic
- Session storage in `chrome.storage.local`

The following feature areas are scaffolded but not implemented yet:

- Gmail thread reader + AI draft generation
- Draft queue dashboard
- LinkedIn DM reader + AI draft generation
- Auto-categorization
- Follow-up reminders

## Project structure

See the full intended structure in [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

The main rule set is in [rules](rules).

## Setup

See the [local development guide](docs/local-development.md) for installation, environment variables, and run commands.

## Feature 1 documentation

Feature 1 is documented in [F1-extension-shell-auth.md](F1-extension-shell-auth.md).

### F1 outcome

- The popup opens to an auth screen when no session exists.
- Clicking sign in launches Google OAuth.
- The Google access token is sent to the backend for verification.
- The backend verifies the token and creates or updates the user record in Supabase.
- The extension stores the session locally and moves to the dashboard.

### F1 files

- [extension/manifest.json](extension/manifest.json)
- [extension/src/popup/Popup.jsx](extension/src/popup/Popup.jsx)
- [extension/src/popup/pages/Auth.jsx](extension/src/popup/pages/Auth.jsx)
- [extension/src/popup/pages/Dashboard.jsx](extension/src/popup/pages/Dashboard.jsx)
- [extension/src/popup/components/GoogleSignInButton.jsx](extension/src/popup/components/GoogleSignInButton.jsx)
- [extension/src/lib/auth.js](extension/src/lib/auth.js)
- [extension/src/lib/storage.js](extension/src/lib/storage.js)
- [extension/src/lib/api.js](extension/src/lib/api.js)
- [backend/src/routes/auth.js](backend/src/routes/auth.js)
- [backend/src/services/supabase.js](backend/src/services/supabase.js)
- [backend/src/middleware/auth.js](backend/src/middleware/auth.js)

## Development rules

The project follows a few hard rules:

- Never call OpenAI directly from the extension.
- Never hardcode secrets in the repo.
- Keep popup logic, content scripts, and background logic separated.
- Use Manifest V3 only.
- Keep system prompts in `backend/src/lib/prompts.js`.
- Keep all backend fetch calls in `extension/src/lib/api.js`.

## Build order

1. Extension shell + Google auth
2. Gmail thread reader + AI draft
3. Draft queue dashboard
4. LinkedIn DM reader + AI draft
5. Auto-categorize conversations
6. Follow-up reminders

## Next step

After Feature 1, the next implementation target is Gmail thread reading and AI draft generation.
