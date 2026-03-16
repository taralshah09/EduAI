/**
 * Groq Provider Adapter
 * Uses Groq's OpenAI-compatible REST API
 * Free tier: generous rate limits on LLaMA-3 models
 */

import { proxyDispatcher } from "../../utils/proxy.js";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Calls Groq API and returns { text }
 * @param {string} prompt
 * @param {string} model
 * @param {AbortSignal} signal
 * @param {string|null} userApiKey
 * @returns {Promise<{ text: string }>}
 */
export async function call(prompt, model, signal, apiKey) {
  if (!apiKey) throw Object.assign(new Error("Groq API key not set"), { code: "NO_KEY" });

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
    dispatcher: proxyDispatcher,
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || `HTTP ${res.status}`;
    const err = new Error(`[Groq] ${msg}`);
    err.status = res.status;
    err.code = res.status === 429 ? "RATE_LIMIT" : res.status === 401 ? "INVALID_KEY" : "API_ERROR";
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw Object.assign(new Error("[Groq] Empty response"), { code: "EMPTY_RESPONSE" });

  return { text };
}
