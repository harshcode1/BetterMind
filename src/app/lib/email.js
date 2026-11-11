// Emails are compared case-insensitively, so they are stored and looked up in one normal form:
// trimmed and lower-cased. Returns null for anything that is not a non-empty string.
export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email || null;
}
