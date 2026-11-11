import OpenAI from 'openai';

// The AI chat uses Llama 3.3 hosted on Groq, called through the OpenAI-compatible SDK
// (so the `openai` package is used, but no request goes to OpenAI).
// Key: LLM_API_KEY. OPENAI_API_KEY is still read as a temporary fallback for old deployments.
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

let client = null;

export function getLLMClient() {
  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
  return client;
}
