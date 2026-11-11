import { ObjectId } from 'mongodb';
import { POST as chatPost, GET as chatGet } from '../../src/app/api/chat/route';
import { getLLMClient } from '../../src/app/lib/llmClient';
import { clearDb, closeDb, getDb } from '../helpers/db';
import { createTestUser, makeRequest } from '../helpers/http';

// Never call the real AI API: the client module is replaced by a mock in every test.
jest.mock('../../src/app/lib/llmClient', () => ({ getLLMClient: jest.fn() }));

const DAY = 24 * 60 * 60 * 1000;
let ipCounter = 0;
let errorSpy;
let create; // the mocked chat.completions.create

beforeEach(async () => {
  await clearDb();
  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  create = jest.fn().mockResolvedValue({ choices: [{ message: { content: 'AI reply' } }] });
  getLLMClient.mockReturnValue({ chat: { completions: { create } } });
});
afterEach(() => errorSpy.mockRestore());
afterAll(closeDb);

const send = (token, message = 'I feel low today') =>
  chatPost(makeRequest('/api/chat', {
    method: 'POST', json: { message }, cookies: { token }, headers: { 'x-forwarded-for': `192.0.2.${(ipCounter += 1)}` },
  }));

async function addMood(userId, value, daysAgo) {
  const db = await getDb();
  await db.collection('moods').insertOne({
    userId: new ObjectId(userId), mood: value, activities: [], createdAt: new Date(Date.now() - daysAgo * DAY),
  });
}

async function addAssessment(userId, fields, daysAgo) {
  const db = await getDb();
  const when = new Date(Date.now() - daysAgo * DAY);
  await db.collection('assessments').insertOne({
    userId: new ObjectId(userId), createdAt: when, date: when.toISOString(), ...fields,
  });
}

const systemPrompt = () => create.mock.calls[0][0].messages[0].content;

describe('personalisation sent to the model', () => {
  it('averages the moods from the last 7 days and ignores older ones', async () => {
    const u = await createTestUser();
    await addMood(u.id, 8, 1);
    await addMood(u.id, 6, 3);
    await addMood(u.id, 4, 6);
    await addMood(u.id, 1, 8);  // older than 7 days: must not count
    await addMood(u.id, 1, 20); // much older: must not count
    await send(u.token);
    expect(systemPrompt()).toContain("User's average mood over the last 7 days: 6.0/10");
  });

  it('is a time window, not "the last 7 entries": every entry in the last 7 days counts', async () => {
    const u = await createTestUser();
    for (let i = 0; i < 10; i++) await addMood(u.id, 10, 0.5 + i * 0.1); // ten entries, all within 7 days
    await addMood(u.id, 1, 6.5);
    await send(u.token);
    // (10 * 10 + 1) / 11 = 9.18 -> 9.2
    expect(systemPrompt()).toContain('average mood over the last 7 days: 9.2/10');
  });

  it('leaves the mood line out when there are no moods in the last 7 days', async () => {
    const u = await createTestUser();
    await addMood(u.id, 5, 10);
    await send(u.token);
    expect(systemPrompt()).not.toContain('average mood');
  });

  it('uses the latest PHQ-9 / GAD-7 assessment', async () => {
    const u = await createTestUser();
    await addAssessment(u.id, { phq9Score: 20, depressionSeverity: 'Severe', gad7Score: 15, anxietySeverity: 'Severe' }, 30);
    await addAssessment(u.id, { phq9Score: 7, depressionSeverity: 'Mild', gad7Score: 3, anxietySeverity: 'Minimal' }, 2);
    await send(u.token);
    expect(systemPrompt()).toContain('PHQ-9 (depression) score 7/27 (Mild), GAD-7 (anxiety) score 3/21 (Minimal)');
    expect(systemPrompt()).not.toContain('score 20/27');
  });

  it("never includes another user's data", async () => {
    const me = await createTestUser();
    const other = await createTestUser();
    await addMood(other.id, 1, 1);
    await addAssessment(other.id, { phq9Score: 27, depressionSeverity: 'Severe', gad7Score: 21, anxietySeverity: 'Severe' }, 1);
    await send(me.token);
    expect(systemPrompt()).not.toContain('average mood');
    expect(systemPrompt()).not.toContain('Latest assessment');
  });

  it('sends the user message and the safety system prompt', async () => {
    const u = await createTestUser();
    await send(u.token, 'hello there');
    const args = create.mock.calls[0][0];
    expect(args.messages[1]).toEqual({ role: 'user', content: 'hello there' });
    expect(args.messages[0].content).toMatch(/988/); // crisis resources stay in the prompt
  });
});

describe('AI reply and keyword fallback', () => {
  it('returns the AI reply and stores both messages', async () => {
    const u = await createTestUser();
    const body = await (await send(u.token)).json();
    expect(body.message).toBe('AI reply');
    expect(body.recommendation).toBeNull();
    const history = await (await chatGet(makeRequest('/api/chat', { cookies: { token: u.token } }))).json();
    expect(history.messages.map((m) => m.sender)).toEqual(['user', 'bot']);
  });

  it('falls back to keyword matching when the AI client throws', async () => {
    create.mockRejectedValue(new Error('upstream 503'));
    const u = await createTestUser();
    const res = await send(u.token, 'I have a lot of anxiety lately');
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.message).toMatch(/Psychiatrist/);
    expect(body.recommendation.specialist).toBe('Psychiatrist');
    expect(JSON.stringify(body)).not.toContain('503'); // upstream error details are not leaked
  });

  it('falls back when no AI key is configured (client is null)', async () => {
    getLLMClient.mockReturnValue(null);
    const u = await createTestUser();
    const body = await (await send(u.token, 'my insomnia is back')).json();
    expect(body.recommendation.specialist).toBe('Sleep Specialist');
    expect(create).not.toHaveBeenCalled();
  });

  it('falls back when the AI returns an empty answer', async () => {
    create.mockResolvedValue({ choices: [{ message: { content: '' } }] });
    const u = await createTestUser();
    const body = await (await send(u.token, 'I feel stress at work')).json();
    expect(body.recommendation.specialist).toBe('Psychologist');
  });

  it('uses the general fallback when no keyword matches', async () => {
    getLLMClient.mockReturnValue(null);
    const u = await createTestUser();
    const body = await (await send(u.token, 'hello')).json();
    expect(body.recommendation.specialist).toBe('General Physician');
  });

  it('rejects unauthenticated requests and empty messages', async () => {
    expect((await send(undefined)).status).toBe(401);
    const u = await createTestUser();
    expect((await send(u.token, '   ')).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
