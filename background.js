/**
 * Background Service Worker
 * Handles Gmail API communication and OTP extraction
 * Built by Avenix (https://avenix.dev)
 */

import {
  getAuthToken,
  removeCachedToken,
  isAuthenticated,
  getRecentMessages,
  getMessage,
  extractMessageBody,
  getMessageSubject
} from './services/gmail-api.js';

import { extractOTPFromEmail } from './services/otp-extractor.js';

// State management (stored in chrome.storage for persistence)
const STATE_KEY = 'avenix_otp_state';

/**
 * Get current state from storage
 */
async function getState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(STATE_KEY, (result) => {
      resolve(result[STATE_KEY] || {
        isAuthenticated: false,
        currentCode: null,
        currentCodeMessageId: null,  // Track which message the code came from
        lastChecked: null,
        autoFill: true
      });
    });
  });
}

/**
 * Update state in storage
 */
async function updateState(updates) {
  const current = await getState();
  const newState = { ...current, ...updates };
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STATE_KEY]: newState }, resolve);
  });
}

/**
 * Initialize extension on install
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[Avenix OTP] Extension installed');

  // Check if already authenticated
  const authenticated = await isAuthenticated();
  await updateState({ isAuthenticated: authenticated });

  if (authenticated) {
    // Start checking for OTPs
    startOTPChecking();
  }
});

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

/**
 * Process incoming messages
 */
async function handleMessage(message, sender) {
  switch (message.type) {
    case 'AUTHENTICATE':
      return await authenticate();

    case 'LOGOUT':
      return await logout();

    case 'GET_STATE':
      return await getState();

    case 'GET_CURRENT_CODE':
      const state = await getState();
      return { code: state.currentCode };

    case 'CHECK_NOW':
      return await checkForOTP();

    case 'FILL_CODE':
      return await fillCodeInActiveTab(message.code);

    case 'SET_AUTO_FILL':
      await updateState({ autoFill: message.enabled });
      return { success: true };

    default:
      return { error: 'Unknown message type' };
  }
}

/**
 * Authenticate with Gmail
 */
async function authenticate() {
  try {
    const token = await getAuthToken(true);
    await updateState({ isAuthenticated: true });
    startOTPChecking();
    return { success: true };
  } catch (error) {
    console.error('[Avenix OTP] Authentication failed:', error);
    return { error: error.message };
  }
}

/**
 * Logout and clear tokens
 */
async function logout() {
  try {
    const token = await getAuthToken(false);
    if (token) {
      await removeCachedToken(token);
    }
  } catch {
    // Ignore errors during logout
  }

  await updateState({
    isAuthenticated: false,
    currentCode: null,
    currentCodeMessageId: null
  });

  stopOTPChecking();
  return { success: true };
}

/**
 * Start periodic OTP checking
 */
function startOTPChecking() {
  // Create alarm for periodic checking (every 30 seconds)
  chrome.alarms.create('checkOTP', { periodInMinutes: 0.5 });

  // Initial check
  checkForOTP();
}

/**
 * Stop OTP checking
 */
function stopOTPChecking() {
  chrome.alarms.clear('checkOTP');
}

/**
 * Handle alarm events
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkOTP') {
    await checkForOTP();
  }
});

/**
 * Check Gmail for new OTP codes
 */
async function checkForOTP() {
  const state = await getState();

  if (!state.isAuthenticated) {
    return { error: 'Not authenticated' };
  }

  try {
    let token;
    try {
      token = await getAuthToken(false);
    } catch {
      // Token expired, mark as unauthenticated
      await updateState({ isAuthenticated: false });
      return { error: 'Token expired' };
    }

    // Get recent messages
    const messages = await getRecentMessages(token, 5);

    if (!messages || messages.length === 0) {
      await updateState({ lastChecked: Date.now() });
      return { code: null };
    }

    // Check each message for OTP (newest first - Gmail returns newest first)
    // Find the newest message with an OTP
    for (const msg of messages) {
      const fullMessage = await getMessage(token, msg.id);
      const subject = getMessageSubject(fullMessage.payload);
      const body = extractMessageBody(fullMessage.payload);

      const result = extractOTPFromEmail(subject, body);

      if (result) {
        const previousCode = state.currentCode;
        const previousMessageId = state.currentCodeMessageId;

        // Update state with the code
        await updateState({
          currentCode: result.code,
          currentCodeMessageId: msg.id,
          lastChecked: Date.now()
        });

        // Notify content script if it's a NEW code (different message or different code)
        const isNewCode = msg.id !== previousMessageId || result.code !== previousCode;
        if (isNewCode && state.autoFill) {
          notifyContentScript(result.code);
        }

        return result;
      }
    }

    // No OTP found in any message
    await updateState({ lastChecked: Date.now() });
    return { code: null };

  } catch (error) {
    console.error('[Avenix OTP] Error checking for OTP:', error);

    if (error.message === 'TOKEN_EXPIRED') {
      await updateState({ isAuthenticated: false });
    }

    return { error: error.message };
  }
}

/**
 * Notify content script about new OTP code
 */
async function notifyContentScript(code) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'OTP_FOUND',
        code: code
      }).catch(() => {
        // Content script might not be loaded on this tab
      });
    }
  } catch (error) {
    console.error('[Avenix OTP] Error notifying content script:', error);
  }
}

/**
 * Fill code in active tab
 */
async function fillCodeInActiveTab(code) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab?.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'FILL_OTP',
        code: code
      });
      return { success: true };
    }

    return { error: 'No active tab' };
  } catch (error) {
    return { error: error.message };
  }
}

// Log startup
console.log('[Avenix OTP] Service worker started');
