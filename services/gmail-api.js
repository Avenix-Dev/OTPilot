/**
 * Gmail API Service
 * Handles authentication and email fetching via Gmail API
 * Built by Avenix (https://avenix.dev)
 */

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1';

/**
 * Get OAuth token using Chrome Identity API
 * @param {boolean} interactive - Whether to show login prompt
 * @returns {Promise<string>} Access token
 */
export async function getAuthToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!token) {
        reject(new Error('No token received'));
        return;
      }
      resolve(token);
    });
  });
}

/**
 * Remove cached auth token (for re-authentication)
 * @param {string} token - Token to remove
 */
export async function removeCachedToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  try {
    const token = await getAuthToken(false);
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Fetch recent messages from Gmail
 * @param {string} token - OAuth access token
 * @param {number} maxResults - Maximum number of messages to fetch
 * @returns {Promise<Array>} List of message IDs
 */
export async function getRecentMessages(token, maxResults = 5) {
  const query = 'newer_than:10m'; // Messages from last 10 minutes
  const url = `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Gmail API error: ${response.status}`);
  }

  const data = await response.json();
  return data.messages || [];
}

/**
 * Get full message content by ID
 * @param {string} token - OAuth access token
 * @param {string} messageId - Gmail message ID
 * @returns {Promise<Object>} Full message object
 */
export async function getMessage(token, messageId) {
  const url = `${GMAIL_API_BASE}/users/me/messages/${messageId}?format=full`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Gmail API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Decode Base64Url encoded string (used by Gmail API)
 * @param {string} encoded - Base64Url encoded string
 * @returns {string} Decoded string
 */
export function decodeBase64Url(encoded) {
  if (!encoded) return '';

  // Replace URL-safe characters with standard Base64
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');

  // Add padding if necessary
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }

  try {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    // Fallback for non-UTF8 content
    return atob(base64);
  }
}

/**
 * Extract plain text body from Gmail message payload
 * @param {Object} payload - Gmail message payload
 * @returns {string} Plain text body
 */
export function extractMessageBody(payload) {
  if (!payload) return '';

  // Direct body data
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart message - recursively search for text/plain or text/html
  if (payload.parts) {
    for (const part of payload.parts) {
      // Prefer text/plain
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }

      // Recursively check nested parts
      if (part.parts) {
        const nested = extractMessageBody(part);
        if (nested) return nested;
      }
    }

    // Fallback to text/html if no plain text found
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        // Strip HTML tags for OTP extraction
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
      }
    }
  }

  return '';
}

/**
 * Get message subject from headers
 * @param {Object} payload - Gmail message payload
 * @returns {string} Subject line
 */
export function getMessageSubject(payload) {
  if (!payload?.headers) return '';

  const subjectHeader = payload.headers.find(
    h => h.name.toLowerCase() === 'subject'
  );

  return subjectHeader?.value || '';
}

/**
 * Get sender from headers
 * @param {Object} payload - Gmail message payload
 * @returns {string} Sender email/name
 */
export function getMessageSender(payload) {
  if (!payload?.headers) return '';

  const fromHeader = payload.headers.find(
    h => h.name.toLowerCase() === 'from'
  );

  return fromHeader?.value || '';
}
