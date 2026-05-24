# Implementation Punch List

This document turns the F2/F3/F4 spec review into a practical backlog.
It focuses on closing the biggest product gaps first, without rewriting the
working core loop.

## Quick Wins

- Gmail reader
  - Limit Gmail thread capture to the last 3 messages to match the F2 spec.
  - Keep the existing floating button behavior, but make the draft payload
    leaner and more predictable.
  - File: [`extension/src/content/gmail.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/content/gmail.js)

- LinkedIn reader
  - Tighten LinkedIn DOM selectors and normalize the captured thread shape.
  - Keep the current injection-based send flow, but improve message extraction
    and empty-state handling.
  - File: [`extension/src/content/linkedin.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/content/linkedin.js)

- Draft view cleanup
  - Split the current `DraftView.jsx` into smaller pieces only if the file
    becomes hard to maintain.
  - Keep the existing behavior as the source of truth for now.
  - File: [`extension/src/popup/pages/DraftView.jsx`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/popup/pages/DraftView.jsx)

## Medium Effort

- Backend draft queue
  - Replace the stubbed `GET /drafts` response with real user-scoped queue data.
  - Persist draft status changes in Supabase so dashboard state survives reloads.
  - Add a real `History` flow for `sent` and `discarded` drafts.
  - Files:
    - [`backend/src/routes/drafts.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/backend/src/routes/drafts.js)
    - [`backend/src/services/supabase.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/backend/src/services/supabase.js)
    - [`extension/src/popup/pages/Dashboard.jsx`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/popup/pages/Dashboard.jsx)

- Dashboard structure
  - Split the dashboard list into `DraftList`, `DraftCard`, `TabBar`, and
    `TimeAgo` components if we want the UI to mirror the spec more closely.
  - Add a proper empty-state/history toggle rather than mixing everything in
    one screen.
  - Files:
    - [`extension/src/popup/pages/Dashboard.jsx`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/popup/pages/Dashboard.jsx)
    - [`extension/src/popup/components/DraftCard.jsx`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/popup/components/DraftCard.jsx)

- LinkedIn send parity
  - Decide whether LinkedIn send should stay popup-injection based or move to a
    dedicated backend route.
  - If we keep injection, formalize it in one send helper so Gmail and LinkedIn
    stay conceptually aligned.
  - Files:
    - [`extension/src/popup/pages/DraftView.jsx`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/popup/pages/DraftView.jsx)
    - [`backend/src/routes/send.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/backend/src/routes/send.js)

## Bigger Gaps

- F2 exact toolbar injection
  - The Gmail button works, but it is still floating rather than injected into
    the native reply toolbar as shown in the spec.
  - If exact parity matters, we should move the button into the reply action row.
  - File: [`extension/src/content/gmail.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/content/gmail.js)

- LinkedIn spec parity
  - The LinkedIn flow exists, but the spec’s exact observer and send contract
    are not fully mirrored.
  - A dedicated `linkedin.js` pass should standardize selectors, observers,
    and the send lifecycle.
  - File: [`extension/src/content/linkedin.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/content/linkedin.js)

- Queue persistence
  - The current extension still leans on local queue state in the popup.
  - Full spec parity needs backend-backed queue reads/writes, not just local
    storage plus optimistic UI updates.
  - Files:
    - [`extension/src/lib/storage.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/extension/src/lib/storage.js)
    - [`backend/src/routes/drafts.js`](/home/wamono-benjamin/Documents/outlook_organiser_AI/backend/src/routes/drafts.js)

## Recommended Order

1. Fix backend draft queue persistence.
2. Tighten Gmail/LinkedIn readers to spec shape.
3. Split dashboard UI into smaller components if needed.
4. Only then consider toolbar-level Gmail injection and full LinkedIn parity.

