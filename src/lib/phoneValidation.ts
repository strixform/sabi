/**
 * Phone number validation for Nigerian phone numbers
 */

export function validatePhoneNumber(phone: string): string | null {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove spaces and hyphens
  let cleaned = phone.trim().replace(/[\s\-]/g, '');

  // Handle Nigerian phone formats
  // 1. +234XXXXXXXXXX (international format)
  // 2. 0XXXXXXXXXX (local format)
  // 3. 234XXXXXXXXXX (without +)

  if (cleaned.startsWith('+234')) {
    // Already in international format
    cleaned = cleaned.substring(1); // Remove +
  } else if (cleaned.startsWith('234')) {
    // Convert 234... to +234...
    // Keep as is, will add + later
  } else if (cleaned.startsWith('0')) {
    // Convert 0... to 234...
    cleaned = '234' + cleaned.substring(1);
  } else {
    // Invalid format
    return null;
  }

  // Validate length: should be 12 digits after country code
  // 234 (3 digits) + 10 digit number = 13 total
  if (!cleaned.startsWith('234') || cleaned.length !== 13) {
    return null;
  }

  // Validate that all characters are digits
  if (!/^\d+$/.test(cleaned)) {
    return null;
  }

  // Return in international format with +
  return '+' + cleaned;
}

/**
 * Format phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 13 && digits.startsWith('234')) {
    // International format: +234 701 234 5678
    return `+${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
  }

  if (digits.length === 11 && digits.startsWith('0')) {
    // Local format: 0701 234 5678
    return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }

  return phone;
}

/**
 * Get phone number regex pattern for input validation
 */
export function getPhoneRegex(): RegExp {
  // Matches:
  // +234XXXXXXXXXX
  // 0XXXXXXXXXX
  // 234XXXXXXXXXX
  // With optional spaces and hyphens
  return /^(\+?234|0)[0-9\s\-]{9,12}$/;
}

/**
 * Check if phone number is valid
 */
export function isValidPhoneNumber(phone: string): boolean {
  return validatePhoneNumber(phone) !== null;
}
