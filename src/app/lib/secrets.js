// Required secrets. There is deliberately NO default value: if a secret is missing the app
// fails loudly instead of silently running with a key that is public in the source code.
// Read lazily (at request time) so `next build` works without secrets present.
// Safe for the Edge runtime (middleware) — it only reads process.env.

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `${name} is not set. Add it to .env.local (development) or to your hosting provider's ` +
        'environment variables (production). See .env.example.'
    );
  }
  return value;
}

export function getJwtSecret() {
  return required('JWT_SECRET');
}

export function getEncryptionSecret() {
  return required('ENCRYPTION_SECRET');
}
