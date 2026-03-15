/**
 * Together AI Provider Adapter
 * Supports both chat completions and embeddings
 * Free tier: $25 credit on sign-up
 */

import { getSystemKeysForProvider } from "../../utils/apiKeys.js";

const TOGETHER_CHAT_URL = "https://api.together.xyz/v1/chat/completions";
const TOGETHER_EMBED_URL = "https://api.together.xyz/v1/embeddings";

/**
 * Calls Together AI chat completions and returns { text }
 * @param {string} prompt
 * @param {string} model
 * @param {AbortSignal} signal
 * @returns {Promise<{ text: string }>}
 */
export async function call(prompt, model, signal, apiKey) {
  if (!apiKey) throw Object.assign(new Error("Together API key not set"), { code: "NO_KEY" });

  const res = await fetch(TOGETHER_CHAT_URL, {
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
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message || `HTTP ${res.status}`;
    const err = new Error(`[Together] ${msg}`);
    err.status = res.status;
    err.code = res.status === 429 ? "RATE_LIMIT" : res.status === 401 ? "INVALID_KEY" : "API_ERROR";
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw Object.assign(new Error("[Together] Empty response"), { code: "EMPTY_RESPONSE" });

  return { text };
}

/**
 * Generates text embeddings using bge-large-en-v1.5 via Together AI
 * Falls back to sparse TF-IDF vector if API key is absent
 * @param {string} text
 * @returns {Promise<number[]>} 1024-dimensional embedding vector
 */
export async function embed(text) {
  const keys = getSystemKeysForProvider("together");

  if (keys.length === 0) {
    // Sparse fallback: deterministic TF-IDF-style vector (1024-dim)
    return sparseFallbackEmbed(text);
  }

  for (const apiKey of keys) {
    try {
      const res = await fetch(TOGETHER_EMBED_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "BAAI/bge-large-en-v1.5",
          input: text.slice(0, 8000), // model context limit
        }),
      });

      if (!res.ok) {
        if (res.status === 429 || res.status === 401) {
            console.warn(`[Together Embed] API key failed (${res.status}), trying next key...`);
            continue;
        }
        console.warn(`[Together Embed] API failed (${res.status}), using sparse fallback`);
        return sparseFallbackEmbed(text);
      }

      const data = await res.json();
      const embedding = data?.data?.[0]?.embedding;
      if (!Array.isArray(embedding)) {
        console.warn("[Together Embed] Invalid response format, using sparse fallback");
        return sparseFallbackEmbed(text);
      }

      return embedding;
    } catch (err) {
      console.warn(`[Together Embed] Network error: ${err.message}, trying next key...`);
      continue;
    }
  }

  console.warn("[Together Embed] All API keys failed, using sparse fallback");
  return sparseFallbackEmbed(text);
}

/**
 * Deterministic sparse fallback embedding when Together key is absent.
 * Uses character-level hashing to fill a fixed-size vector.
 * NOT semantic — only used as a graceful degradation.
 * @param {string} text
 * @returns {number[]} 1024-dim vector
 */
function sparseFallbackEmbed(text) {
  const dim = 1024;
  const vec = new Float32Array(dim);
  const words = text.toLowerCase().split(/\s+/);

  for (const word of words) {
    // Simple hash to map each word to a bucket
    let h = 5381;
    for (let i = 0; i < word.length; i++) {
      h = ((h << 5) + h + word.charCodeAt(i)) >>> 0;
    }
    vec[h % dim] += 1;
  }

  // L2-normalise
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return Array.from(vec).map((v) => v / norm);
}
