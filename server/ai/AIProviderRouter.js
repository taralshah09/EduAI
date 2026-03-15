/**
 * AIProviderRouter — Core reliability layer
 *
 * Executes a fallback chain of providers for each AI task.
 * Features:
 *   - Per-provider 15s timeout (AbortController)
 *   - 429 rate-limit retry with exponential backoff (up to 2 retries per provider)
 *   - Skips providers whose API keys are missing
 *   - Classifies errors: NO_KEY | RATE_LIMIT | INVALID_KEY | TIMEOUT | API_ERROR
 *   - Logs which provider/model was selected on success
 */

import * as groq from "./providers/groqProvider.js";
import * as together from "./providers/togetherProvider.js";
import * as openrouter from "./providers/openrouterProvider.js";
import * as gemini from "./providers/geminiProvider.js";
import { selectChain } from "./ModelSelector.js";

const PROVIDERS = { groq, together, openrouter, gemini };

const PROVIDER_TIMEOUT_MS = 15_000; // 15 seconds per provider attempt
const MAX_RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_BASE_DELAY_MS = 3000;

/**
 * Execute an AI task through the provider fallback chain.
 *
 * @param {string} task — one of: "summarize" | "lesson" | "safety" | "quiz" | "flashcards" | "chat" | "title"
 * @param {string} prompt — the full prompt to send
 * @param {{ userApiKeys?: object, onUserKeyFailure?: Function }} options
 * @returns {Promise<string>} — raw text response from the winning provider
 */
export async function call(task, prompt, { userApiKeys = {}, onUserKeyFailure = null } = {}) {
  const chain = selectChain(task);
  const errors = [];

  for (const { provider: providerName, model } of chain) {
    const provider = PROVIDERS[providerName];
    if (!provider) continue;

    const userKey = userApiKeys?.[providerName]?.apiKey;
    const sysKeyName = `${providerName.toUpperCase()}_API_KEY`;
    const sysKey = process.env[sysKeyName];

    // Skip provider if neither system key nor user key exists
    if (!sysKey && !userKey) {
      console.warn(`[AIRouter] Skipping ${providerName} — no key available`);
      continue;
    }

    let rateLimitRetries = 0;

    while (rateLimitRetries <= MAX_RATE_LIMIT_RETRIES) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

      try {
        let result;
        if (providerName === "gemini") {
          result = await provider.call(prompt, model, controller.signal, userKey, onUserKeyFailure);
        } else {
          result = await provider.call(prompt, model, controller.signal, userKey);
        }

        clearTimeout(timer);
        console.log(`[AIRouter] ✅ Task "${task}" served by ${providerName}/${model}`);
        return result.text;

      } catch (err) {
        clearTimeout(timer);
        const code = err.code || "UNKNOWN";

        if (code === "NO_KEY") {
          // Key was removed/missing mid-call — skip this provider entirely
          errors.push(`${providerName}/${model}: no key`);
          break;
        }

        if (code === "RATE_LIMIT" && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
          rateLimitRetries++;
          const delay = RATE_LIMIT_BASE_DELAY_MS * Math.pow(2, rateLimitRetries - 1)
                        * (0.8 + Math.random() * 0.4);
          console.warn(`[AIRouter] ${providerName}/${model} rate limited. Retry ${rateLimitRetries}/${MAX_RATE_LIMIT_RETRIES} in ${(delay / 1000).toFixed(1)}s…`);
          await sleep(delay);
          continue; // retry same provider
        }

        // For INVALID_KEY, TIMEOUT, API_ERROR, or exhausted rate-limit retries — move on
        const reason = code === "TIMEOUT" ? "timeout" : err.message;
        console.warn(`[AIRouter] ⚠️  ${providerName}/${model} failed (${code}): ${reason}`);
        errors.push(`${providerName}/${model}: ${code} — ${reason}`);
        break; // try next provider in chain
      }
    }
  }

  // All providers exhausted
  throw new Error(
    `[AIRouter] All providers failed for task "${task}".\n` +
    errors.map((e) => `  • ${e}`).join("\n")
  );
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
