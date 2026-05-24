import React from 'react';

export default function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-card">
        <div className="empty-illustration">✉</div>
        <div>
          <h2 className="empty-title">No drafts yet</h2>
          <p className="empty-copy">
            Open Gmail or LinkedIn and start a conversation to generate your first draft.
          </p>
        </div>

        <div className="empty-actions">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="button-secondary"
          >
            Open Gmail
          </a>
          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="button-primary"
          >
            Open LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
