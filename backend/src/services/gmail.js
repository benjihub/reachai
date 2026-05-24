/**
 * Gmail API service
 * Reads threads, sends emails
 */

export const getThread = async (threadId) => {
  throw new Error('Not implemented yet');
};

const encodeBase64Url = (value) => {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const normalizeHeader = (value = '') => {
  return String(value).replace(/[\r\n]+/g, ' ').trim();
};

export const buildRawEmail = ({ to, subject, body }) => {
  const emailLines = [
    `To: ${normalizeHeader(to)}`,
    `Subject: ${normalizeHeader(subject || '')}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    body || ''
  ];

  return encodeBase64Url(emailLines.join('\r\n'));
};

export const sendEmail = async ({
  googleToken,
  to,
  subject,
  body,
  threadId,
  mode = 'reply',
  inReplyTo = null,
  references = null
}) => {
  if (!googleToken) {
    throw new Error('Missing Google token for Gmail send.');
  }

  if (!to) {
    throw new Error('Missing recipient email for Gmail send.');
  }

  const headers = [
    `To: ${normalizeHeader(to)}`,
    `Subject: ${normalizeHeader(subject || 'Re:')}`,
    'Content-Type: text/plain; charset="UTF-8"',
  ];

  if (mode === 'reply') {
    if (inReplyTo) {
      headers.push(`In-Reply-To: ${normalizeHeader(inReplyTo)}`);
    }

    if (references) {
      headers.push(`References: ${normalizeHeader(references)}`);
    }
  }

  const message = [...headers, '', body || ''].join('\r\n');
  const raw = mode === 'new' ? buildRawEmail({ to, subject, body }) : encodeBase64Url(message);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${googleToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw,
      ...(mode === 'reply' && threadId ? { threadId } : {})
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gmail API failed with HTTP ${response.status}`);
  }

  return response.json();
};
