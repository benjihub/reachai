# ReachAI

**AI-assisted communication workflows for Gmail and LinkedIn.**

ReachAI is a Chrome extension and backend platform designed to help users manage professional conversations, draft responses, organize follow-ups and reduce the time spent switching between communication tools.

The project uses a Chrome Manifest V3 extension for the user interface and a separate backend for authentication, AI processing and database access.

## Current Status

The authentication foundation is implemented.

Working functionality currently includes:

- Chrome extension shell
- Google OAuth
- backend authentication endpoint
- Supabase user creation and updates
- local session storage
- authenticated popup dashboard

The following product areas are still under development:

- Gmail thread reading
- AI-assisted Gmail draft generation
- LinkedIn conversation reading
- AI-assisted LinkedIn replies
- draft review queue
- conversation categorization
- follow-up reminders

This README reflects the current implementation rather than presenting planned features as complete.

## Product Direction

ReachAI is intended to provide one lightweight workflow for handling communication across multiple channels.

The planned experience is:

1. Sign in with Google.
2. Connect supported communication sources.
3. Review recent conversations.
4. Generate AI-assisted draft replies.
5. Approve or edit drafts before sending.
6. Categorize conversations.
7. Track follow-ups and reminders.

The system is designed around human review rather than fully autonomous messaging.

## Architecture

ReachAI is split into two main applications.

### Chrome Extension

The extension handles:

- authentication UI
- local session state
- popup navigation
- future Gmail and LinkedIn content integrations
- draft review interfaces

### Backend

The backend handles:

- Google token verification
- user persistence
- authentication
- Supabase access
- future AI requests
- future conversation processing

AI provider credentials remain on the backend and are never exposed directly to the Chrome extension.

## Technology

### Extension

- Chrome Manifest V3
- React
- Vite
- JavaScript
- Chrome Extension APIs
- chrome.storage

### Backend

- Node.js
- Hono
- Supabase
- REST APIs

### Planned AI Layer

- AI-assisted draft generation
- categorization
- response suggestions
- follow-up support

## Repository Structure

`extension/`  
Chrome extension application.

`backend/`  
Backend API and service layer.

`docs/`  
Architecture and development documentation.

`PROJECT_STRUCTURE.md`  
Intended project organization.

`F1-extension-shell-auth.md`  
Documentation for the first implemented feature slice.

## Authentication Flow

The implemented authentication flow works as follows:

1. The user opens the extension.
2. The extension checks for a locally stored session.
3. If no session exists, the authentication screen is displayed.
4. Google OAuth is launched from the extension.
5. The resulting token is sent to the backend.
6. The backend verifies the Google identity.
7. The user is created or updated in Supabase.
8. Session information is stored in `chrome.storage.local`.
9. The extension transitions to the authenticated dashboard.

## Security Design

ReachAI follows several important security rules:

- AI provider keys are never stored in the extension.
- Backend-only secrets remain on the server.
- The extension does not call AI providers directly.
- Authentication is verified server-side.
- Extension storage is separated from backend credentials.
- Popup, content-script and background responsibilities are kept separate.

Production secrets should always be supplied through environment variables.

## Development Principles

The project follows several architectural constraints:

- Manifest V3 only
- backend-mediated AI access
- no hardcoded credentials
- clear separation between extension and backend logic
- centralized backend API calls
- centralized AI prompt handling
- user review before AI-generated communication is sent

## Development Roadmap

The current build order is:

1. Chrome extension shell and Google authentication — implemented
2. Gmail thread reading and AI-assisted draft generation
3. Draft review queue
4. LinkedIn conversation reading and AI-assisted drafts
5. Automatic conversation categorization
6. Follow-up reminders

## Documentation

For local development instructions, see:

`docs/local-development.md`

For architecture details, see:

`docs/architecture.md`

For the first implemented feature slice, see:

`F1-extension-shell-auth.md`

## Project Status

ReachAI is an active work-in-progress.

The core authentication architecture is implemented, while the communication and AI workflow features are being developed incrementally.

## Product Goal

ReachAI is designed to reduce repetitive communication work without removing human control.

The goal is to help users review conversations, generate useful draft responses and manage follow-ups while keeping the final decision to send or edit a message with the user.

