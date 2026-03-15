/**
 * OpenRouter Provider Adapter
 * Universal API gateway — access hundreds of models via one key
 * Multiple free-tier models available (no credit needed for some)
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Calls OpenRouter API and returns { text }
 * @param {string} prompt
 * @param {string} model
 * @param {AbortSignal} signal
 * @param {string|null} userApiKey
 * @returns {Promise<{ text: string }>}
 */
export async function call(prompt, model, signal, apiKey) {
  if (!apiKey) throw Object.assign(new Error("OpenRouter API key not set"), { code: "NO_KEY" });

  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://miyagilabs.app",
      "X-Title": "EduAI by MiyagiLabs",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || `HTTP ${res.status}`;
    const err = new Error(`[OpenRouter] ${msg}`);
    err.status = res.status;
    err.code = res.status === 429 ? "RATE_LIMIT" : res.status === 401 ? "INVALID_KEY" : "API_ERROR";
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw Object.assign(new Error("[OpenRouter] Empty response"), { code: "EMPTY_RESPONSE" });

  return { text };
}
