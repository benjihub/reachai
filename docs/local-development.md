# Local Development Guide

This guide covers how to run ReachAI locally during development.

## Prerequisites

- Node.js 18 or newer
- npm
- A Chrome browser profile for extension testing
- Accounts and credentials for:
  - Google Cloud OAuth
  - Supabase
  - OpenAI
  - Paddle, if you are working on billing

## Repository layout

- `extension/` contains the Chrome extension UI, content scripts, and background service worker.
- `backend/` contains the Hono API that handles auth, AI, and database access.

## Backend setup

1. Install dependencies.
2. Copy `backend/.env.example` to `backend/.env`.
3. Fill in the required secrets and service values.
4. Start the backend server.

### Backend environment variables

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PORT`
- `NODE_ENV`

### Backend run commands

- Install dependencies from `backend/package.json`.
- Run the backend in development mode with the project script that watches `backend/src/index.js`.
- Keep `.env` local only. Never commit it.

## Extension setup

1. Install dependencies.
2. Provide the extension build-time environment values needed by Vite.
3. Build the extension.
4. Load the generated extension into Chrome as an unpacked extension.

### Extension environment values

- `VITE_API_URL` for the backend base URL
- `VITE_GOOGLE_CLIENT_ID` for the OAuth flow

### Extension run commands

- Use the Vite dev or build script inside `extension/`.
- Load the built output into Chrome when you need to test popup and content script behavior.

## Suggested workflow

1. Start the backend first.
2. Build the extension.
3. Load the extension into Chrome.
4. Test the popup auth flow.
5. Confirm the backend receives and verifies the Google token.

## Common issues

- If the popup cannot reach the backend, confirm `VITE_API_URL` matches the running backend URL.
- If Google OAuth fails, confirm the client ID and redirect setup in Google Cloud.
- If Supabase writes fail, confirm the service key belongs to the correct project.
- If the extension does not load, check the manifest and the Vite build output.
