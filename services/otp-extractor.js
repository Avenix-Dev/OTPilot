/**
 * OTP Extractor Service
 * Multi-tier regex patterns for extracting verification codes from emails
 * Built by Avenix (https://avenix.dev)
 */

import { isValidOTP } from '../utils/validators.js';

/**
 * Keywords that indicate verification/authentication context
 */
const VERIFICATION_KEYWORDS = [
  'verification', 'verify', 'code', 'pin', 'otp', 'passcode',
  'confirmation', 'confirm', 'security', 'secure', 'authorization',
  'authenticate', 'authentication', 'auth', 'login', 'log in',
  'sign in', 'sign-in', '2fa', 'two-factor', 'two factor',
  'one-time', 'one time', 'onetime', 'password', 'token',
  'access code', 'temporary code', 'validation'
];

/**
 * Check if text has verification context
 */
function hasVerificationContext(text) {
  const lowerText = text.toLowerCase();
  return VERIFICATION_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Clean and normalize text for extraction
 */
function cleanText(text) {
  return text
    .replace(/<\/?[^>]+(>|$)/g, ' ')  // Remove HTML tags
    .replace(/&nbsp;/gi, ' ')          // Replace &nbsp;
    .replace(/&#\d+;/g, ' ')           // Replace HTML entities
    .replace(/\s+/g, ' ')              // Normalize whitespace
    .trim();
}

/**
 * Validate and clean a potential code
 */
function processCode(codeString) {
  if (!codeString) return null;

  // Remove non-alphanumeric characters
  const cleaned = codeString.replace(/[^a-zA-Z0-9]/g, '');
  const numericOnly = codeString.replace(/[^0-9]/g, '');

  // Prefer numeric codes (most OTPs are numeric)
  if (numericOnly.length >= 4 && numericOnly.length <= 8 && isValidOTP(numericOnly)) {
    return numericOnly;
  }

  // Fall back to alphanumeric if valid
  if (cleaned.length >= 4 && cleaned.length <= 8 && isValidOTP(cleaned)) {
    return cleaned.toUpperCase();
  }

  return null;
}

/**
 * Extract OTP from email text using tiered pattern matching
 */
export function extractOTP(text) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const clean = cleanText(text);

  // Require verification context
  if (!hasVerificationContext(clean)) {
    return null;
  }

  // ========== TIER 1: Explicit labels (highest confidence) ==========
  const explicitPatterns = [
    // "verification code is 123456", "confirmation code: 789012"
    /(?:verification|confirmation|security|auth(?:entication)?|one[- ]?time|2fa|two[- ]?factor|temporary)\s*code\s*(?:is|:|=|:)\s*([0-9]{4,8})/i,
    // "your code is 123456", "the code is 789012"
    /(?:your|the)\s+(?:verification\s+|security\s+|one[- ]?time\s+)?(?:code|otp|pin|passcode)\s*(?:is|:|=)\s*([0-9]{4,8})/i,
    // "code: 123456", "OTP: 789012", "PIN: 1234"
    /\b(?:code|pin|otp|passcode)\s*[:=]\s*([0-9]{4,8})\b/i,
    // "use code 123456", "enter code 789012"
    /(?:use|enter|input|type)\s+(?:this\s+|the\s+)?(?:code|otp|pin)\s*[:=]?\s*([0-9]{4,8})/i,
    // "123456 is your code"
    /\b([0-9]{4,8})\s+is\s+your\s+(?:verification\s+|security\s+)?(?:code|otp|pin)/i,
    // "here is your code: 123456"
    /here\s+is\s+(?:your\s+)?(?:code|otp|pin)\s*[:=]?\s*([0-9]{4,8})/i,
    // "code to verify: 123456"
    /code\s+to\s+(?:verify|confirm|complete|access)\s*[:=]?\s*([0-9]{4,8})/i
  ];

  for (const pattern of explicitPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const code = processCode(match[1]);
      if (code) {
        return { code, confidence: 'high' };
      }
    }
  }

  // ========== TIER 2: Formatted codes with labels ==========
  const formattedPatterns = [
    // "code: 123-456" or "code: 123 456"
    /\b(?:code|pin|otp|passcode)\s*[:=]?\s*([0-9]{3}[-\s][0-9]{3})\b/i,
    // "code: 12-34-56"
    /\b(?:code|pin|otp|passcode)\s*[:=]?\s*([0-9]{2}[-\s][0-9]{2}[-\s][0-9]{2})\b/i
  ];

  for (const pattern of formattedPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const code = processCode(match[1]);
      if (code) {
        return { code, confidence: 'high' };
      }
    }
  }

  // ========== TIER 3: Quoted/emphasized codes ==========
  const quotedPatterns = [
    // "123456" or '123456'
    /["']([0-9]{4,8})["']/,
    // **123456** or *123456*
    /\*+([0-9]{4,8})\*+/,
    // [123456] with verification context nearby
    /(?:code|otp|pin|verification)[^0-9]{0,30}\[([0-9]{4,8})\]/i
  ];

  for (const pattern of quotedPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const code = processCode(match[1]);
      if (code) {
        return { code, confidence: 'high' };
      }
    }
  }

  // ========== TIER 4: Context proximity (code near keywords) ==========
  const contextPatterns = [
    // "use this code to..." followed by code
    /(?:use\s+)?this\s+code[\s\S]{1,300}?\b([0-9]{4,8})\b/i,
    // "enter the code..." followed by code
    /enter\s+(?:the\s+)?(?:following\s+)?code[\s\S]{1,300}?\b([0-9]{4,8})\b/i,
    // "code will expire..." (code often comes before or after)
    /\b([0-9]{4,8})\b[\s\S]{1,100}?(?:will\s+)?expire/i,
    /expire[\s\S]{1,100}?\b([0-9]{4,8})\b/i,
    // "sign in" followed by code
    /sign\s*(?:in|up)[\s\S]{1,250}?\b([0-9]{4,8})\b/i,
    // "log in" followed by code
    /log\s*in[\s\S]{1,250}?\b([0-9]{4,8})\b/i,
    // Verification with larger window
    /verification[\s\S]{1,200}?\b([0-9]{4,8})\b/i,
    // "one-time" followed by code
    /one[- ]?time[\s\S]{1,150}?\b([0-9]{4,8})\b/i,
    // Generic "code" with nearby number
    /\bcode\b[^0-9]{1,50}([0-9]{4,8})\b/i
  ];

  for (const pattern of contextPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const code = processCode(match[1]);
      if (code) {
        return { code, confidence: 'medium' };
      }
    }
  }

  // ========== TIER 5: Standalone formatted codes ==========
  const standaloneFormatted = [
    /\b([0-9]{3}[-\s][0-9]{3})\b/,
    /\b([0-9]{2}[-\s][0-9]{2}[-\s][0-9]{2})\b/,
    /\b([0-9]{4}[-\s][0-9]{4})\b/
  ];

  for (const pattern of standaloneFormatted) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const code = processCode(match[1]);
      if (code) {
        return { code, confidence: 'medium' };
      }
    }
  }

  // ========== TIER 6: Smart context extraction ==========
  // Look for codes near priority keywords with validation
  const priorityPhrases = [
    'this code', 'your code', 'the code', 'enter code', 'use code',
    'verification code', 'confirmation code', 'security code',
    'one-time code', 'access code', 'login code', 'otp'
  ];

  const lowerClean = clean.toLowerCase();
  for (const phrase of priorityPhrases) {
    const index = lowerClean.indexOf(phrase);
    if (index !== -1) {
      // Search in a window after the phrase
      const searchWindow = clean.substring(index, Math.min(clean.length, index + 400));
      const matches = searchWindow.match(/\b([0-9]{4,8})\b/g);

      if (matches) {
        for (const match of matches) {
          const code = processCode(match);
          if (code) {
            return { code, confidence: 'medium' };
          }
        }
      }
    }
  }

  // ========== TIER 7: Generic fallback by length priority ==========
  // 6-digit codes are most common, then 4, 5, 8
  const fallbackLengths = [6, 4, 5, 8];

  for (const len of fallbackLengths) {
    const pattern = new RegExp(`\\b([0-9]{${len}})\\b`, 'g');
    const matches = [...clean.matchAll(pattern)];

    for (const match of matches) {
      if (match[1]) {
        const code = processCode(match[1]);
        if (code) {
          return { code, confidence: 'low' };
        }
      }
    }
  }

  return null;
}

/**
 * Extract OTP from email subject and body combined
 * Subject gets priority as codes are often there
 */
export function extractOTPFromEmail(subject, body) {
  // Try subject first (often contains the code directly)
  if (subject) {
    // Subjects usually have the code with explicit labels
    const subjectResult = extractOTP(subject);
    if (subjectResult) {
      return { ...subjectResult, source: 'subject' };
    }
  }

  // Then try body
  if (body) {
    const bodyResult = extractOTP(body);
    if (bodyResult) {
      return { ...bodyResult, source: 'body' };
    }
  }

  return null;
}
