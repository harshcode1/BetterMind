// The AI client is built with the OpenAI-compatible SDK but talks to Groq (Llama 3.3).
// Key lookup: LLM_API_KEY first, OPENAI_API_KEY as a temporary fallback for old deployments.
const ORIGINAL_ENV = { ...process.env };

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((options) => ({ __options: options })),
}));

function loadFresh() {
  let mod;
  jest.isolateModules(() => {
    mod = require('../../src/app/lib/llmClient');
  });
  return mod;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('getLLMClient', () => {
  it('returns null when no key is configured (chat then uses the keyword fallback)', () => {
    delete process.env.LLM_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(loadFresh().getLLMClient()).toBeNull();
  });

  it('uses LLM_API_KEY and points the SDK at Groq', () => {
    process.env.LLM_API_KEY = 'llm-key';
    delete process.env.OPENAI_API_KEY;
    const client = loadFresh().getLLMClient();
    expect(client.__options).toEqual({ apiKey: 'llm-key', baseURL: 'https://api.groq.com/openai/v1' });
  });

  it('falls back to OPENAI_API_KEY (temporary, for old deployments)', () => {
    delete process.env.LLM_API_KEY;
    process.env.OPENAI_API_KEY = 'old-key';
    expect(loadFresh().getLLMClient().__options.apiKey).toBe('old-key');
  });

  it('LLM_API_KEY wins when both are set', () => {
    process.env.LLM_API_KEY = 'new-key';
    process.env.OPENAI_API_KEY = 'old-key';
    expect(loadFresh().getLLMClient().__options.apiKey).toBe('new-key');
  });

  it('reuses one client instance', () => {
    process.env.LLM_API_KEY = 'llm-key';
    const { getLLMClient } = loadFresh();
    expect(getLLMClient()).toBe(getLLMClient());
  });
});
