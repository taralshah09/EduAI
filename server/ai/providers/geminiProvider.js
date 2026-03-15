/**
 * Gemini Provider Adapter
 * Wraps @google/generative-ai SDK with model rotation and retry logic.
 * Ported from the original geminiService.js — acts as last-resort fallback.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Ordered list of Gemini models to try (newest, most capable first)
const GEMINI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite",
];

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

/**
 * Calls Gemini API with model rotation and exponential backoff.
 * @param {string} prompt
 * @param {string} _model  — ignored (model list is managed internally)
 * @param {AbortSignal} signal
 * @param {string|null} userApiKey
 * @param {Function|null} onUserKeyFailure
 * @returns {Promise<{ text: string }>}
 */
export async function call(prompt, _model, signal, userApiKey = null, onUserKeyFailure = null) {
  const sysKey = process.env.GEMINI_API_KEY;
  if (!sysKey && !userApiKey) {
    throw Object.assign(new Error("No Gemini API key available"), { code: "NO_KEY" });
  }

  const defaultGenAI = sysKey ? new GoogleGenerativeAI(sysKey) : null;
  let activeGenAI = userApiKey ? new GoogleGenerativeAI(userApiKey) : defaultGenAI;
  let usingUserKey = !!userApiKey;
  let lastError;

  for (const modelName of GEMINI_MODELS) {
    let currentModel = activeGenAI.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // Respect AbortController timeout from the router
      if (signal?.aborted) {
        throw Object.assign(new Error("[Gemini] Request aborted"), { code: "TIMEOUT" });
      }

      try {
        const result = await currentModel.generateContent(prompt);
        return { text: result.response.text().trim() };
      } catch (err) {
        lastError = err;
        const errMsg = err?.message || "";
        const status = err?.status || (err?.response ? err.response.status : null);

        const isQuotaExceeded =
          status === 429 ||
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("rate limit");

        const isInvalidKey =
          status === 400 ||
          status === 403 ||
          errMsg.toLowerCase().includes("api_key_invalid") ||
          errMsg.toLowerCase().includes("api key not valid");

        const retryMatch = errMsg.match(/Please retry in ([\d.]+)s/);
        const retryDelayMs = retryMatch ? parseFloat(retryMatch[1]) * 1000 : null;

        const isDailyQuota =
          isQuotaExceeded &&
          (errMsg.includes("PerDay") || errMsg.includes("Daily") ||
            (errMsg.includes("limit: 0") && !retryDelayMs));

        // Drop user key if it's invalid or hit daily quota
        if (usingUserKey && (isInvalidKey || isDailyQuota) && defaultGenAI) {
          console.error(`[Gemini] User key failed (${isInvalidKey ? "invalid" : "daily quota"}). Falling back to system key.`);
          if (onUserKeyFailure) {
            const reason = isInvalidKey ? "Invalid API Key" : "Daily Quota Exceeded";
            await onUserKeyFailure(reason).catch((e) =>
              console.error("onUserKeyFailure error:", e.message)
            );
          }
          usingUserKey = false;
          activeGenAI = defaultGenAI;
          currentModel = activeGenAI.getGenerativeModel({ model: modelName });
          attempt--;
          continue;
        }

        if (isQuotaExceeded) {
          if (isDailyQuota) break; // try next model

          if (attempt < MAX_RETRIES) {
            const waitMs = retryDelayMs
              ? retryDelayMs + 1000
              : BASE_DELAY_MS * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4);
            console.warn(`[Gemini] ${modelName} rate limited, retrying in ${(waitMs / 1000).toFixed(1)}s…`);
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }
        }

        // Non-recoverable or exhausted retries — try next model
        console.error(`[Gemini] ${modelName} failed (attempt ${attempt + 1}): ${errMsg}`);
        break;
      }
    }
  }

  const err = new Error(`[Gemini] All models failed. Last: ${lastError?.message}`);
  err.code = "ALL_MODELS_FAILED";
  throw err;
}
