/**
 * Popup Script - Avenix OTP Autofill
 * Handles UI interactions and communication with background script
 * Built by Avenix (https://avenix.dev)
 */

// DOM Elements
const elements = {
  authSection: document.getElementById('auth-section'),
  codeSection: document.getElementById('code-section'),
  settingsSection: document.getElementById('settings-section'),
  actionsSection: document.getElementById('actions-section'),

  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),

  authBtn: document.getElementById('auth-btn'),
  authBtnText: document.getElementById('auth-btn-text'),

  currentCode: document.getElementById('current-code'),
  codeMeta: document.getElementById('code-meta'),
  copyBtn: document.getElementById('copy-btn'),
  fillBtn: document.getElementById('fill-btn'),

  autoFillToggle: document.getElementById('auto-fill-toggle'),
  checkBtn: document.getElementById('check-btn'),

  toast: document.getElementById('toast')
};

// State
let currentState = {
  isAuthenticated: false,
  currentCode: null,
  lastChecked: null,
  autoFill: true
};

/**
 * Initialize popup
 */
async function init() {
  await loadState();
  updateUI();
  setupEventListeners();
}

/**
 * Load state from background script
 */
async function loadState() {
  try {
    const response = await sendMessage({ type: 'GET_STATE' });
    if (response && !response.error) {
      currentState = { ...currentState, ...response };
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
}

/**
 * Send message to background script
 */
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}

/**
 * Update UI based on current state
 */
function updateUI() {
  if (currentState.isAuthenticated) {
    showAuthenticatedUI();
  } else {
    showUnauthenticatedUI();
  }

  // Update code display
  if (currentState.currentCode) {
    elements.currentCode.textContent = formatCode(currentState.currentCode);
    elements.currentCode.classList.remove('empty');
  } else {
    elements.currentCode.textContent = '------';
    elements.currentCode.classList.add('empty');
  }

  // Update last checked time
  if (currentState.lastChecked) {
    const timeAgo = getTimeAgo(currentState.lastChecked);
    elements.codeMeta.textContent = `Last checked ${timeAgo}`;
  } else {
    elements.codeMeta.textContent = '';
  }

  // Update auto-fill toggle
  elements.autoFillToggle.checked = currentState.autoFill;
}

/**
 * Show UI for authenticated state
 */
function showAuthenticatedUI() {
  // Status
  elements.statusDot.className = 'status-dot connected';
  elements.statusText.textContent = 'Connected to Gmail';

  // Auth button
  elements.authBtnText.textContent = 'Disconnect';
  elements.authBtn.classList.remove('btn-primary');
  elements.authBtn.classList.add('btn-danger');

  // Show sections
  elements.codeSection.classList.remove('hidden');
  elements.settingsSection.classList.remove('hidden');
  elements.actionsSection.classList.remove('hidden');
}

/**
 * Show UI for unauthenticated state
 */
function showUnauthenticatedUI() {
  // Status
  elements.statusDot.className = 'status-dot disconnected';
  elements.statusText.textContent = 'Not connected';

  // Auth button
  elements.authBtnText.textContent = 'Connect Gmail';
  elements.authBtn.classList.add('btn-primary');
  elements.authBtn.classList.remove('btn-danger');

  // Hide sections
  elements.codeSection.classList.add('hidden');
  elements.settingsSection.classList.add('hidden');
  elements.actionsSection.classList.add('hidden');
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Auth button
  elements.authBtn.addEventListener('click', handleAuthClick);

  // Copy button
  elements.copyBtn.addEventListener('click', handleCopyClick);

  // Fill button
  elements.fillBtn.addEventListener('click', handleFillClick);

  // Auto-fill toggle
  elements.autoFillToggle.addEventListener('change', handleAutoFillToggle);

  // Check button
  elements.checkBtn.addEventListener('click', handleCheckClick);
}

/**
 * Handle auth button click
 */
async function handleAuthClick() {
  elements.authBtn.disabled = true;

  if (currentState.isAuthenticated) {
    // Logout
    const response = await sendMessage({ type: 'LOGOUT' });
    if (response.success) {
      currentState.isAuthenticated = false;
      currentState.currentCode = null;
      showToast('Disconnected from Gmail');
    } else {
      showToast('Failed to disconnect', 'error');
    }
  } else {
    // Login
    elements.statusDot.className = 'status-dot checking';
    elements.statusText.textContent = 'Connecting...';

    const response = await sendMessage({ type: 'AUTHENTICATE' });
    if (response.success) {
      currentState.isAuthenticated = true;
      showToast('Connected to Gmail', 'success');

      // Check for OTP immediately
      handleCheckClick();
    } else {
      showToast(response.error || 'Failed to connect', 'error');
    }
  }

  elements.authBtn.disabled = false;
  updateUI();
}

/**
 * Handle copy button click
 */
async function handleCopyClick() {
  if (!currentState.currentCode) {
    showToast('No code to copy', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(currentState.currentCode);
    showToast('Code copied!', 'success');
  } catch (error) {
    showToast('Failed to copy', 'error');
  }
}

/**
 * Handle fill button click
 */
async function handleFillClick() {
  if (!currentState.currentCode) {
    showToast('No code to fill', 'error');
    return;
  }

  const response = await sendMessage({
    type: 'FILL_CODE',
    code: currentState.currentCode
  });

  if (response.success) {
    showToast('Code filled!', 'success');
  } else {
    showToast(response.error || 'Failed to fill', 'error');
  }
}

/**
 * Handle auto-fill toggle
 */
async function handleAutoFillToggle() {
  currentState.autoFill = elements.autoFillToggle.checked;

  await sendMessage({
    type: 'SET_AUTO_FILL',
    enabled: currentState.autoFill
  });
}

/**
 * Handle check now button click
 */
async function handleCheckClick() {
  elements.checkBtn.disabled = true;
  elements.statusDot.className = 'status-dot checking';

  const response = await sendMessage({ type: 'CHECK_NOW' });

  if (response.code) {
    currentState.currentCode = response.code;
    currentState.lastChecked = Date.now();
    showToast(`Found code: ${response.code}`, 'success');
  } else if (response.error) {
    showToast(response.error, 'error');
  } else {
    currentState.lastChecked = Date.now();
    showToast('No new codes found');
  }

  elements.checkBtn.disabled = false;
  updateUI();
}

/**
 * Format code for display (add spaces)
 */
function formatCode(code) {
  if (!code) return '';

  // Add space in the middle for 6-digit codes
  if (code.length === 6) {
    return code.slice(0, 3) + ' ' + code.slice(3);
  }

  return code;
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 120) return '1 minute ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 7200) return '1 hour ago';

  return `${Math.floor(seconds / 3600)} hours ago`;
}

/**
 * Show toast notification
 */
function showToast(message, type = '') {
  elements.toast.textContent = message;
  elements.toast.className = 'toast' + (type ? ` ${type}` : '');
  elements.toast.classList.remove('hidden');

  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3000);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
