import fs from 'fs';
import path from 'path';

// authServer imports the DB module; these tests never need a connection.
jest.mock('../../src/app/lib/db', () => ({ __esModule: true, default: Promise.resolve({}) }));

const ORIGINAL_ENV = { ...process.env };
const SRC = path.join(__dirname, '..', '..', 'src');

function loadFresh(modulePath) {
  let mod;
  jest.isolateModules(() => {
    mod = require(modulePath);
  });
  return mod;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe.each(['production', 'development', 'test'])('secrets (NODE_ENV=%s)', (env) => {
  beforeEach(() => {
    process.env.NODE_ENV = env;
  });

  it('getJwtSecret throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    const { getJwtSecret } = loadFresh('../../src/app/lib/secrets');
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
  });

  it('getEncryptionSecret throws when ENCRYPTION_SECRET is missing', () => {
    delete process.env.ENCRYPTION_SECRET;
    const { getEncryptionSecret } = loadFresh('../../src/app/lib/secrets');
    expect(() => getEncryptionSecret()).toThrow(/ENCRYPTION_SECRET is not set/);
  });

  it('treats an empty / whitespace-only value as missing', () => {
    process.env.JWT_SECRET = '   ';
    const { getJwtSecret } = loadFresh('../../src/app/lib/secrets');
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET is not set/);
  });

  it('returns the configured values when they are set', () => {
    process.env.JWT_SECRET = 'jwt-value';
    process.env.ENCRYPTION_SECRET = 'enc-value';
    const { getJwtSecret, getEncryptionSecret } = loadFresh('../../src/app/lib/secrets');
    expect(getJwtSecret()).toBe('jwt-value');
    expect(getEncryptionSecret()).toBe('enc-value');
  });
});

describe('modules that use secrets fail closed when they are missing', () => {
  it('generateToken throws without JWT_SECRET (no insecure default token)', () => {
    delete process.env.JWT_SECRET;
    const { generateToken } = loadFresh('../../src/app/lib/auth');
    expect(() => generateToken({ _id: 'abc', email: 'a@b.c', name: 'A' })).toThrow(/JWT_SECRET/);
  });

  it('encryptSensitiveData throws without ENCRYPTION_SECRET (nothing is stored under a default key)', () => {
    delete process.env.ENCRYPTION_SECRET;
    const { encryptSensitiveData } = loadFresh('../../src/app/lib/encryption');
    expect(() => encryptSensitiveData('user1', { notes: 'secret' }, ['notes'])).toThrow(/ENCRYPTION_SECRET/);
  });

  it('verifyAuth rejects a token signed with the old public fallback secret', async () => {
    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ id: '64b7f0f0f0f0f0f0f0f0f0f0', role: 'admin' }, 'fallback_secret_for_development_only');
    const { verifyAuth } = loadFresh('../../src/app/lib/authServer');
    const result = await verifyAuth(forged);
    expect(result.authenticated).toBe(false);
  });
});

describe('no hard-coded secret fallbacks remain in source', () => {
  const files = [
    'middleware.js',
    'app/lib/auth.js',
    'app/lib/authServer.js',
    'app/lib/encryption.js',
  ];
  it.each(files)('%s has no default secret string', (file) => {
    const text = fs.readFileSync(path.join(SRC, file), 'utf8');
    expect(text).not.toMatch(/fallback_secret_for_development_only/);
    expect(text).not.toMatch(/development-secret-key/);
    expect(text).not.toMatch(/process\.env\.(JWT_SECRET|ENCRYPTION_SECRET)\s*\|\|/);
  });
});
