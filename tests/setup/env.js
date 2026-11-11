// Runs before every test file. Test-only values: obviously fake, never used outside tests.
const base = process.env.TEST_MONGO_BASE_URI;
process.env.MONGODB_URI = `${base}bm_test_${process.env.JEST_WORKER_ID || '1'}`;
process.env.JWT_SECRET = 'test-only-jwt-secret-do-not-use-anywhere-else';
process.env.ENCRYPTION_SECRET = 'test-only-encryption-secret-do-not-use-anywhere-else';
process.env.ENCRYPTION_SALT = 'test-only-salt';
delete process.env.LLM_API_KEY;
delete process.env.OPENAI_API_KEY;
