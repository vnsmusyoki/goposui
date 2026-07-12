export const PHONE_NUMBER_MAX_DIGITS = 10;

export function normalizePhoneNumber(value: string, maxDigits = PHONE_NUMBER_MAX_DIGITS): string {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const normalized = digits.startsWith('0') ? digits : `0${digits}`;
  return normalized.slice(0, maxDigits);
}

export function getPhoneDigitsRemaining(value: string, maxDigits = PHONE_NUMBER_MAX_DIGITS): number {
  return Math.max(maxDigits - normalizePhoneNumber(value, maxDigits).length, 0);
}
