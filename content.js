/**
 * Content Script
 * Detects OTP input fields and handles autofill
 * Built by Avenix (https://avenix.dev)
 */

(function() {
  'use strict';

  // Scoring configuration for OTP field detection
  const FIELD_SCORING = {
    attributes: {
      id: {
        patterns: ['otp', 'code', 'verify', 'pin', 'token', '2fa', 'mfa', 'totp', 'verification'],
        score: 30
      },
      name: {
        patterns: ['otp', 'code', 'verify', 'pin', 'verification', 'token'],
        score: 25
      },
      placeholder: {
        patterns: ['enter code', 'verification', 'otp', '6 digit', 'enter otp', 'code', 'pin'],
        score: 20
      },
      'aria-label': {
        patterns: ['verification', 'code', 'otp', 'one-time', 'pin'],
        score: 20
      },
      class: {
        patterns: ['otp', 'verification', 'code-input', 'pin-input'],
        score: 15
      }
    },
    properties: {
      autocomplete: { value: 'one-time-code', score: 50 },
      inputMode: { value: 'numeric', score: 15 },
      maxLength: { values: [1, 4, 5, 6, 7, 8], score: 25 }
    },
    type: {
      tel: 15,
      number: 15,
      text: 5
    }
  };

  // Minimum score threshold for OTP field detection
  const MIN_SCORE_THRESHOLD = 20;

  /**
   * Score an input field for OTP likelihood
   */
  function scoreOTPField(input) {
    let score = 0;

    // Check element attributes
    for (const [attr, config] of Object.entries(FIELD_SCORING.attributes)) {
      const value = (input.getAttribute(attr) || '').toLowerCase();
      if (value && config.patterns.some(p => value.includes(p))) {
        score += config.score;
      }
    }

    // Check autocomplete (highest priority)
    if (input.autocomplete === 'one-time-code') {
      score += FIELD_SCORING.properties.autocomplete.score;
    }

    // Check maxLength
    const maxLen = parseInt(input.maxLength, 10);
    if (!isNaN(maxLen) && FIELD_SCORING.properties.maxLength.values.includes(maxLen)) {
      score += FIELD_SCORING.properties.maxLength.score;
    }

    // Check inputMode
    if (input.inputMode === 'numeric') {
      score += FIELD_SCORING.properties.inputMode.score;
    }

    // Check input type
    const typeScore = FIELD_SCORING.type[input.type] || 0;
    score += typeScore;

    // Check nearby labels
    const label = findAssociatedLabel(input);
    if (label) {
      const labelText = label.textContent.toLowerCase();
      if (['code', 'otp', 'verification', 'pin'].some(t => labelText.includes(t))) {
        score += 20;
      }
    }

    // Check parent/sibling text content
    const parentText = (input.parentElement?.textContent || '').toLowerCase();
    if (['verification', 'code', 'otp'].some(t => parentText.includes(t))) {
      score += 10;
    }

    return score;
  }

  /**
   * Find associated label for an input
   */
  function findAssociatedLabel(input) {
    // Check for label with 'for' attribute
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label;
    }

    // Check for parent label
    const parentLabel = input.closest('label');
    if (parentLabel) return parentLabel;

    // Check for nearby label sibling
    const parent = input.parentElement;
    if (parent) {
      const sibling = parent.querySelector('label');
      if (sibling) return sibling;
    }

    return null;
  }

  /**
   * Find all potential OTP fields
   */
  function findOTPFields() {
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="password"]):not([type="email"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])'
    );

    const candidates = [];

    inputs.forEach(input => {
      // Skip invisible inputs
      if (!isVisible(input)) return;

      const score = scoreOTPField(input);
      if (score >= MIN_SCORE_THRESHOLD) {
        candidates.push({ element: input, score });
      }
    });

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);
    return candidates;
  }

  /**
   * Detect multi-field OTP inputs (6 separate boxes)
   */
  function findMultiFieldOTP() {
    const singleCharInputs = Array.from(
      document.querySelectorAll('input[maxlength="1"]')
    ).filter(isVisible);

    if (singleCharInputs.length < 4 || singleCharInputs.length > 8) {
      return [];
    }

    // Group consecutive inputs
    const groups = groupConsecutiveInputs(singleCharInputs);
    return groups.filter(g => g.length >= 4 && g.length <= 8);
  }

  /**
   * Group inputs that are likely part of the same OTP
   */
  function groupConsecutiveInputs(inputs) {
    if (inputs.length === 0) return [];

    const groups = [];
    let currentGroup = [inputs[0]];

    for (let i = 1; i < inputs.length; i++) {
      const current = inputs[i];
      const prev = inputs[i - 1];

      // Check if inputs are close to each other
      if (areInputsRelated(prev, current)) {
        currentGroup.push(current);
      } else {
        if (currentGroup.length >= 4) {
          groups.push(currentGroup);
        }
        currentGroup = [current];
      }
    }

    if (currentGroup.length >= 4) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Check if two inputs are likely related (part of same OTP)
   */
  function areInputsRelated(a, b) {
    // Same parent or grandparent
    if (a.parentElement === b.parentElement) return true;
    if (a.parentElement?.parentElement === b.parentElement?.parentElement) return true;

    // Check horizontal distance
    const rectA = a.getBoundingClientRect();
    const rectB = b.getBoundingClientRect();
    const distance = Math.abs(rectB.left - rectA.right);

    // Should be close horizontally and on same line
    return distance < 50 && Math.abs(rectA.top - rectB.top) < 10;
  }

  /**
   * Check if element is visible
   */
  function isVisible(element) {
    const style = window.getComputedStyle(element);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    );
  }

  /**
   * Fill OTP into a single field
   */
  function fillSingleField(input, code) {
    // Focus the input
    input.focus();

    // Method 1: Direct value assignment
    input.value = code;

    // Method 2: Native setter (bypasses React/Vue getters)
    try {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(input, code);
      }
    } catch (e) {
      // Ignore errors
    }

    // Dispatch events for framework compatibility
    const events = [
      new Event('input', { bubbles: true, cancelable: true }),
      new Event('change', { bubbles: true, cancelable: true }),
      new KeyboardEvent('keydown', { bubbles: true, key: code }),
      new KeyboardEvent('keyup', { bubbles: true, key: code }),
      new KeyboardEvent('keypress', { bubbles: true, key: code })
    ];

    events.forEach(event => {
      try {
        input.dispatchEvent(event);
      } catch (e) {
        // Ignore dispatch errors
      }
    });

    // Blur to trigger validation
    input.blur();
  }

  /**
   * Fill OTP into multiple fields (one digit per field)
   */
  function fillMultiField(inputs, code) {
    const digits = code.split('');

    inputs.forEach((input, index) => {
      if (digits[index]) {
        // Small delay between fills for framework compatibility
        setTimeout(() => {
          fillSingleField(input, digits[index]);

          // Move focus to next input
          if (inputs[index + 1]) {
            inputs[index + 1].focus();
          }
        }, index * 30);
      }
    });
  }

  /**
   * Main function to fill OTP code
   */
  function fillOTP(code) {
    if (!code || typeof code !== 'string') return false;

    // First, try multi-field OTP
    const multiFieldGroups = findMultiFieldOTP();
    if (multiFieldGroups.length > 0) {
      fillMultiField(multiFieldGroups[0], code);
      return true;
    }

    // Then, try single field OTP
    const otpFields = findOTPFields();
    if (otpFields.length > 0) {
      fillSingleField(otpFields[0].element, code);
      return true;
    }

    return false;
  }

  /**
   * Listen for messages from background script
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'OTP_FOUND':
      case 'FILL_OTP':
        const success = fillOTP(message.code);
        sendResponse({ success });
        break;

      case 'CHECK_OTP_FIELDS':
        const fields = findOTPFields();
        const multiFields = findMultiFieldOTP();
        sendResponse({
          hasOTPFields: fields.length > 0 || multiFields.length > 0,
          fieldCount: fields.length,
          multiFieldCount: multiFields.length
        });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }

    return true;
  });

  /**
   * MutationObserver to handle dynamically added fields
   */
  let pendingCode = null;

  const observer = new MutationObserver((mutations) => {
    if (!pendingCode) return;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if new OTP fields were added
        setTimeout(() => {
          if (pendingCode && fillOTP(pendingCode)) {
            pendingCode = null;
          }
        }, 100);
        break;
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  /**
   * Set pending code for dynamic field detection
   */
  function setPendingCode(code) {
    pendingCode = code;
    // Clear after 30 seconds
    setTimeout(() => {
      pendingCode = null;
    }, 30000);
  }

  // Expose for debugging
  window.__avenixOTP = {
    findOTPFields,
    findMultiFieldOTP,
    fillOTP,
    scoreOTPField
  };

  console.log('[Avenix OTP] Content script loaded');
})();
