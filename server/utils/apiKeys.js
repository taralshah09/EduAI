/**
 * API Key management and fallback utility
 */

/**
 * Retrieves up to 6 system API keys for a given provider from environment variables.
 * It looks for:
 * 1. {PROVIDER}_API_KEY
 * 2. {PROVIDER}_API_KEY_1
 * 3. {PROVIDER}_API_KEY_2
 * ...
 * 6. {PROVIDER}_API_KEY_5
 *
 * @param {string} providerName e.g., 'gemini', 'groq', 'together', 'openrouter'
 * @returns {string[]} Array of unique API keys
 */
export function getSystemKeysForProvider(providerName) {
  const prefix = providerName.toUpperCase();
  const keys = [];

  // Default primary key
  if (process.env[`${prefix}_API_KEY`]) {
    keys.push(process.env[`${prefix}_API_KEY`].trim());
  }

  // Backup keys 1 to 5
  for (let i = 1; i <= 5; i++) {
    const backupKey = process.env[`${prefix}_API_KEY_${i}`];
    if (backupKey) {
      keys.push(backupKey.trim());
    }
  }

  // Return unique, non-empty keys
  return [...new Set(keys)].filter((k) => k.length > 0);
}
