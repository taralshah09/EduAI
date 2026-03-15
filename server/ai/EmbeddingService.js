/**
 * EmbeddingService — Text embedding abstraction
 *
 * Primary: Together AI (bge-large-en-v1.5, 1024 dimensions)
 * Fallback: Deterministic hash-based sparse vector (in togetherProvider.js)
 *
 * Used by RAGService to build and query per-course embedding indexes.
 */

import { embed } from "./providers/togetherProvider.js";

/**
 * Generate an embedding vector for a given text string.
 * @param {string} text
 * @returns {Promise<number[]>} embedding vector
 */
export async function getEmbedding(text) {
  return embed(text);
}

/**
 * Generate embeddings for multiple texts in sequence.
 * Adds a small delay between calls to respect rate limits.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function getEmbeddings(texts) {
  const results = [];
  for (const text of texts) {
    results.push(await embed(text));
    // Small delay to avoid rate limits on free tier
    if (texts.length > 1) await sleep(300);
  }
  return results;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
