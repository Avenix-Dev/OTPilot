/**
 * OTP Validation Utilities
 * Filters out false positives from OTP extraction
 * Built by Avenix (https://avenix.dev)
 */

/**
 * Sequential digit patterns to reject
 */
const SEQUENTIAL_PATTERNS = [
  '0123', '1234', '2345', '3456', '4567', '5678', '6789',
  '9876', '8765', '7654', '6543', '5432', '4321', '3210',
  '012345', '123456', '234567', '345678', '456789',
  '987654', '876543', '765432', '654321', '543210'
];

/**
 * Check if code contains sequential digits
 * @param {string} code - Code to check
 * @returns {boolean} True if sequential
 */
function isSequential(code) {
  return SEQUENTIAL_PATTERNS.some(pattern => code.includes(pattern));
}

/**
 * Check if code is all repetitive (e.g., 111111, 000000)
 * @param {string} code - Code to check
 * @returns {boolean} True if repetitive
 */
function isRepetitive(code) {
  if (code.length < 2) return false;
  return /^(.)\1+$/.test(code);
}

/**
 * Check if code looks like a date pattern
 * @param {string} code - Code to check
 * @returns {boolean} True if date-like
 */
function isDatePattern(code) {
  // Only check 6 and 8 digit codes
  if (code.length !== 6 && code.length !== 8) {
    return false;
  }

  // Common date patterns
  const datePatterns = [
    // MMDDYY
    /^(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(\d{2})$/,
    // DDMMYY
    /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(\d{2})$/,
    // YYMMDD
    /^(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/,
    // MMDDYYYY
    /^(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(19|20)\d{2}$/,
    // DDMMYYYY
    /^(0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(19|20)\d{2}$/,
    // YYYYMMDD
    /^(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/
  ];

  return datePatterns.some(pattern => pattern.test(code));
}

/**
 * Check if code looks like a year
 * @param {string} code - Code to check
 * @returns {boolean} True if year-like
 */
function isYearPattern(code) {
  if (code.length !== 4) return false;

  const num = parseInt(code, 10);
  // Check if it's a year between 1900 and 2100
  return num >= 1900 && num <= 2100;
}

/**
 * Check if code is only zeros
 * @param {string} code - Code to check
 * @returns {boolean}
 */
function isAllZeros(code) {
  return /^0+$/.test(code);
}

/**
 * Check if code looks like a CSS value (e.g., 40px, 12em, 100rem)
 * @param {string} code - Code to check
 * @returns {boolean} True if CSS-like
 */
function isCSSValue(code) {
  // Common CSS units: px, em, rem, pt, vh, vw, ch, ex, cm, mm, in, pc
  return /^\d+(PX|EM|REM|PT|VH|VW|CH|EX|CM|MM|IN|PC)$/i.test(code);
}

/**
 * Check if code looks like a hex color code (e.g., 393939, FF0000)
 * Common in HTML emails as styling
 * @param {string} code - Code to check
 * @returns {boolean} True if likely a color code
 */
function isLikelyColorCode(code) {
  // 6-character codes that look like hex colors
  if (code.length !== 6) return false;

  // Check if it's valid hex (only 0-9 and A-F)
  if (!/^[0-9A-F]+$/i.test(code)) return false;

  // Common color patterns: repeated pairs (393939, AABBCC, 333333)
  if (/^([0-9A-F]{2})\1\1$/i.test(code)) return true;

  // Grayscale colors (000000-FFFFFF where R=G=B)
  if (/^([0-9A-F])([0-9A-F])\1\2\1\2$/i.test(code)) return true;

  // Common web colors
  const commonColors = [
    '000000', 'FFFFFF', '333333', '666666', '999999', 'CCCCCC',
    'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
    '808080', 'C0C0C0', '800000', '008000', '000080', '800080'
  ];
  if (commonColors.includes(code.toUpperCase())) return true;

  return false;
}

/**
 * Check if alphanumeric code has proper mix
 * @param {string} code - Code to check
 * @returns {boolean} True if valid alphanumeric
 */
function isValidAlphanumeric(code) {
  const hasLetters = /[A-Za-z]/.test(code);
  const hasNumbers = /\d/.test(code);

  // If it has letters, it should also have numbers (proper alphanumeric OTP)
  // Pure numeric codes are also valid
  if (hasLetters && !hasNumbers) {
    return false;
  }

  return true;
}

/**
 * Validate if a code is likely a legitimate OTP
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid OTP
 */
export function isValidOTP(code) {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Clean the code (remove any remaining spaces/dashes)
  const cleaned = code.replace(/[-\s]/g, '').toUpperCase();

  // Length check: 4-8 characters
  if (cleaned.length < 4 || cleaned.length > 8) {
    return false;
  }

  // Must be alphanumeric only
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return false;
  }

  // Reject all zeros
  if (isAllZeros(cleaned)) {
    return false;
  }

  // Reject sequential patterns
  if (isSequential(cleaned)) {
    return false;
  }

  // Reject repetitive patterns
  if (isRepetitive(cleaned)) {
    return false;
  }

  // Reject date-like patterns (only for numeric codes)
  if (/^\d+$/.test(cleaned) && isDatePattern(cleaned)) {
    return false;
  }

  // Reject year patterns
  if (/^\d+$/.test(cleaned) && isYearPattern(cleaned)) {
    return false;
  }

  // Validate alphanumeric mix
  if (!isValidAlphanumeric(cleaned)) {
    return false;
  }

  // Reject CSS values (e.g., 40px, 12em)
  if (isCSSValue(cleaned)) {
    return false;
  }

  // Reject likely color codes (e.g., 393939, FFFFFF)
  if (isLikelyColorCode(cleaned)) {
    return false;
  }

  return true;
}

/**
 * Get validation failure reason (for debugging)
 * @param {string} code - Code to check
 * @returns {string|null} Failure reason or null if valid
 */
export function getValidationFailureReason(code) {
  if (!code || typeof code !== 'string') {
    return 'Invalid input';
  }

  const cleaned = code.replace(/[-\s]/g, '').toUpperCase();

  if (cleaned.length < 4) return 'Too short (min 4 chars)';
  if (cleaned.length > 8) return 'Too long (max 8 chars)';
  if (!/^[A-Z0-9]+$/.test(cleaned)) return 'Not alphanumeric';
  if (isAllZeros(cleaned)) return 'All zeros';
  if (isSequential(cleaned)) return 'Sequential pattern';
  if (isRepetitive(cleaned)) return 'Repetitive pattern';
  if (/^\d+$/.test(cleaned) && isDatePattern(cleaned)) return 'Date pattern';
  if (/^\d+$/.test(cleaned) && isYearPattern(cleaned)) return 'Year pattern';
  if (!isValidAlphanumeric(cleaned)) return 'Invalid alphanumeric mix';
  if (isCSSValue(cleaned)) return 'CSS value';
  if (isLikelyColorCode(cleaned)) return 'Likely color code';

  return null;
}
