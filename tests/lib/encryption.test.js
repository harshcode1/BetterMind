import { encryptSensitiveData, decryptSensitiveData, encryptDocument, decryptDocument } from '../../src/app/lib/encryption';
import { POST as moodPost, GET as moodGet } from '../../src/app/api/mood/route';
import { POST as assessmentPost, GET as assessmentGet } from '../../src/app/api/assessment/route';
import { GET as assessmentByIdGet } from '../../src/app/api/assessment/[id]/route';
import { GET as exportGet } from '../../src/app/api/dashboard/export/route';
import { clearDb, closeDb, getDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';

const USER_A = '64b7f0f0f0f0f0f0f0f0f0a1';
const USER_B = '64b7f0f0f0f0f0f0f0f0f0b2';
const PLAINTEXT = 'I felt very anxious about my appointment today';

let errorSpy;
beforeEach(async () => {
  await clearDb();
  // decrypt failures are logged on purpose; keep test output clean
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());
afterAll(closeDb);

describe('encryption library', () => {
  it('round-trips: encrypt then decrypt returns the original text', () => {
    const enc = encryptSensitiveData(USER_A, { notes: PLAINTEXT, mood: 7 }, ['notes']);
    const dec = decryptSensitiveData(USER_A, enc);
    expect(dec.notes).toBe(PLAINTEXT);
    expect(dec.mood).toBe(7); // non-sensitive fields untouched
    expect(dec.decryptionFailedFields).toBeUndefined();
  });

  it('stores AES-256-GCM output (iv + auth tag), not plaintext', () => {
    const enc = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    expect(enc.notes.encrypted).toBe(true);
    expect(enc.notes.iv).toHaveLength(32); // 16-byte IV as hex
    expect(enc.notes.authTag).toHaveLength(32); // 16-byte GCM tag as hex
    expect(JSON.stringify(enc)).not.toContain('anxious');
  });

  it('uses a fresh IV every time, so the same text never encrypts to the same value', () => {
    const a = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    const b = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    expect(a.notes.iv).not.toBe(b.notes.iv);
    expect(a.notes.data).not.toBe(b.notes.data);
  });

  it('two users encrypting the same text get different ciphertexts (per-user keys)', () => {
    const a = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    const b = encryptSensitiveData(USER_B, { notes: PLAINTEXT }, ['notes']);
    expect(a.notes.data).not.toBe(b.notes.data);
  });

  it("one user's key cannot decrypt another user's data (and never returns the raw object)", () => {
    const enc = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    const dec = decryptSensitiveData(USER_B, enc);
    expect(dec.notes).toBeNull();
    expect(dec.decryptionFailedFields).toEqual(['notes']);
    expect(JSON.stringify(dec)).not.toContain('anxious');
  });

  it('tampered ciphertext is rejected by the GCM auth tag', () => {
    const enc = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    const flipped = enc.notes.data[0] === 'a' ? 'b' : 'a';
    enc.notes.data = flipped + enc.notes.data.slice(1);
    const dec = decryptSensitiveData(USER_A, enc);
    expect(dec.notes).toBeNull();
    expect(dec.decryptionFailedFields).toEqual(['notes']);
  });

  it('a tampered auth tag is rejected', () => {
    const enc = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    const flipped = enc.notes.authTag[0] === 'a' ? 'b' : 'a';
    enc.notes.authTag = flipped + enc.notes.authTag.slice(1);
    const dec = decryptSensitiveData(USER_A, enc);
    expect(dec.notes).toBeNull();
    expect(dec.decryptionFailedFields).toEqual(['notes']);
  });

  it('data stops being readable if ENCRYPTION_SECRET changes (rotation needs a migration)', () => {
    const enc = encryptSensitiveData(USER_A, { notes: PLAINTEXT }, ['notes']);
    const original = process.env.ENCRYPTION_SECRET;
    process.env.ENCRYPTION_SECRET = 'a-different-secret-value';
    try {
      const dec = decryptSensitiveData(USER_A, enc);
      expect(dec.notes).toBeNull();
      expect(dec.decryptionFailedFields).toEqual(['notes']);
    } finally {
      process.env.ENCRYPTION_SECRET = original;
    }
  });

  it('encryptDocument/decryptDocument encrypt the right fields per document type', () => {
    const mood = encryptDocument(USER_A, { mood: 5, notes: PLAINTEXT }, 'mood');
    expect(mood.notes.encrypted).toBe(true);
    const assessment = encryptDocument(USER_A, { phq9Score: 4, phq9Answers: [1, 2], gad7Answers: [0, 1] }, 'assessment');
    expect(assessment.phq9Answers.encrypted).toBe(true);
    expect(assessment.gad7Answers.encrypted).toBe(true);
    expect(assessment.phq9Score).toBe(4);
    expect(decryptDocument(USER_A, assessment).phq9Answers).toBe('1,2'); // String() form, as stored today
  });
});

describe('mood API stores encrypted notes and survives tampering', () => {
  it('the value stored in MongoDB is not plaintext, but the API returns plaintext to the owner', async () => {
    const { token, id } = await createTestUser();
    const res = await moodPost(makeRequest('/api/mood', { method: 'POST', json: { mood: 6, notes: PLAINTEXT }, cookies: { token } }));
    expect(res.status).toBe(200);

    const db = await getDb();
    const stored = await db.collection('moods').findOne({});
    expect(stored.notes.encrypted).toBe(true);
    expect(JSON.stringify(stored)).not.toContain('anxious');

    const list = await (await moodGet(makeRequest('/api/mood', { cookies: { token } }))).json();
    expect(list.moods[0].notes).toBe(PLAINTEXT);
    expect(list.moods[0].decryptionFailed).toBeUndefined();
    expect(id).toBeTruthy();
  });

  it('a tampered stored note is returned as null with decryptionFailed, never as the raw encrypted object', async () => {
    const { token } = await createTestUser();
    await moodPost(makeRequest('/api/mood', { method: 'POST', json: { mood: 6, notes: PLAINTEXT }, cookies: { token } }));
    const db = await getDb();
    const stored = await db.collection('moods').findOne({});
    const flipped = stored.notes.data[0] === 'a' ? 'b' : 'a';
    await db.collection('moods').updateOne({ _id: stored._id }, { $set: { 'notes.data': flipped + stored.notes.data.slice(1) } });

    const list = await (await moodGet(makeRequest('/api/mood', { cookies: { token } }))).json();
    expect(list.moods[0].notes).toBeNull();
    expect(list.moods[0].decryptionFailed).toBe(true);
    expect(JSON.stringify(list)).not.toContain('"encrypted"');
  });
});

describe('assessment API stores encrypted answers', () => {
  it('answers are ciphertext in MongoDB and plaintext for the owner when requested', async () => {
    const { token } = await createTestUser();
    const body = {
      phq9Score: 5, gad7Score: 4, depressionSeverity: 'Mild', anxietySeverity: 'Minimal',
      phq9Answers: 'private-phq-answers', gad7Answers: 'private-gad-answers', date: new Date().toISOString(),
    };
    const res = await assessmentPost(makeRequest('/api/assessment', { method: 'POST', json: body, cookies: { token } }));
    expect(res.status).toBe(200);

    const db = await getDb();
    const stored = await db.collection('assessments').findOne({});
    expect(stored.phq9Answers.encrypted).toBe(true);
    expect(stored.gad7Answers.encrypted).toBe(true);
    expect(JSON.stringify(stored)).not.toContain('private-');

    const list = await (await assessmentGet(makeRequest('/api/assessment?includeAnswers=true', { cookies: { token } }))).json();
    expect(list.assessments[0].phq9Answers).toBe('private-phq-answers');
  });

  it('a tampered stored answer is returned as null with decryptionFailed', async () => {
    const { token } = await createTestUser();
    await assessmentPost(makeRequest('/api/assessment', {
      method: 'POST', cookies: { token },
      json: { phq9Score: 5, gad7Score: 4, phq9Answers: 'private-phq-answers', gad7Answers: 'g', date: new Date().toISOString() },
    }));
    const db = await getDb();
    const stored = await db.collection('assessments').findOne({});
    const flipped = stored.phq9Answers.authTag[0] === 'a' ? 'b' : 'a';
    await db.collection('assessments').updateOne({ _id: stored._id }, { $set: { 'phq9Answers.authTag': flipped + stored.phq9Answers.authTag.slice(1) } });

    const list = await (await assessmentGet(makeRequest('/api/assessment?includeAnswers=true', { cookies: { token } }))).json();
    expect(list.assessments[0].phq9Answers).toBeNull();
    expect(list.assessments[0].decryptionFailed).toBe(true);
  });
});

describe('every route that reads encrypted fields decrypts them', () => {
  it('GET /api/assessment/[id] returns plaintext answers, not the encrypted object', async () => {
    const { token } = await createTestUser();
    await assessmentPost(makeRequest('/api/assessment', {
      method: 'POST', cookies: { token },
      json: { phq9Score: 5, gad7Score: 4, phq9Answers: 'private-phq-answers', gad7Answers: 'private-gad-answers', date: new Date().toISOString() },
    }));
    const db = await getDb();
    const stored = await db.collection('assessments').findOne({});
    const res = await assessmentByIdGet(
      makeRequest(`/api/assessment/${stored._id}`, { cookies: { token } }),
      { params: { id: stored._id.toString() } }
    );
    const body = await res.json();
    expect(body.assessment.phq9Answers).toBe('private-phq-answers');
    expect(body.assessment.gad7Answers).toBe('private-gad-answers');
  });

  it('GET /api/dashboard/export (json) returns plaintext notes', async () => {
    const { token } = await createTestUser();
    await moodPost(makeRequest('/api/mood', { method: 'POST', json: { mood: 6, notes: PLAINTEXT }, cookies: { token } }));
    const res = await exportGet(makeRequest('/api/dashboard/export?format=json', { cookies: { token } }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.moods[0].notes).toBe(PLAINTEXT);
  });

  it('GET /api/dashboard/export (csv) works and contains plaintext notes', async () => {
    const { token } = await createTestUser();
    await moodPost(makeRequest('/api/mood', { method: 'POST', json: { mood: 6, notes: PLAINTEXT }, cookies: { token } }));
    const res = await exportGet(makeRequest('/api/dashboard/export?format=csv', { cookies: { token } }));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain(PLAINTEXT);
  });
});
