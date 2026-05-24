# Architecture Overview

ReachAI is split into a Chrome extension frontend and a backend API.
The separation is intentional so the browser never talks directly to OpenAI or Supabase service credentials.

## High-level flow

1. The user opens the extension popup.
2. The popup checks local session state.
3. If no session exists, the user signs in with Google.
4. The extension sends the Google token to the backend.
5. The backend verifies the token with Google and upserts the user in Supabase.
6. The backend returns the user profile data.
7. The extension stores the session locally and renders the dashboard.

## Responsibilities by layer

### Popup

Location: `extension/src/popup/`

The popup is UI only.
It renders the auth screen, dashboard, settings, and draft views.
It reads session state from `chrome.storage.local` and calls the shared API helper when it needs backend data.

Do not put DOM scraping, background work, or backend logic here.

### Content scripts

Location: `extension/src/content/`

Content scripts read and modify the page DOM.
They detect Gmail and LinkedIn conversation contexts, inject buttons, and collect message/thread data.

Do not put popup state or backend fetch logic here.

### Background service worker

Location: `extension/src/background/`

The background worker handles extension-level coordination such as alarms, notifications, auth, and message routing.
It acts as the middle layer between popup and content scripts when they need to exchange messages.

Do not put page-specific DOM logic or popup rendering here.

### Extension shared utilities

Location: `extension/src/lib/`

This folder contains shared extension helpers.

- `api.js` owns all backend fetch calls.
- `auth.js` owns all Chrome identity and OAuth logic.
- `storage.js` owns session and preference access.
- `constants.js` owns shared constant values.

### Backend API

Location: `backend/src/`

The backend owns all trusted server-side behavior.
It verifies Google tokens, talks to Supabase, sends requests to OpenAI, verifies billing webhooks, and returns consistent JSON responses.

#### Route layer

Routes should validate input, call services, and return structured responses.

#### Service layer

Services contain integration logic for OpenAI, Gmail, Supabase, and Paddle.
Prompts should live in `backend/src/lib/prompts.js` instead of being inlined in routes.

#### Middleware layer

Middleware handles authentication, plan gating, and global error handling.

## Data ownership

- Session data lives in `chrome.storage.local`.
- User records live in Supabase.
- AI prompts live in backend prompt files.
- OAuth tokens should never be handled by the browser beyond the extension auth flow.

## Feature boundaries

### Feature 1

Owns extension shell, auth UI, Google OAuth, backend token verification, and user session creation.

### Feature 2

Owns Gmail thread reading and AI draft generation.

### Feature 3

Owns the draft queue dashboard.

### Feature 4

Owns LinkedIn DM thread reading and draft generation.

### Feature 5

Owns auto-categorization.

### Feature 6

Owns follow-up reminders.
