/**
 * RAGService — Retrieval Augmented Generation
 *
 * Stores transcript chunks as embeddings (in-memory, per course).
 * Retrieves the top-K most relevant chunks for a given query using
 * cosine similarity — no external vector DB needed for ≤20 chunks.
 *
 * Index lifecycle:
 *   - Built once per course (on first chat message)
 *   - Cached in CacheService under "embeddings:{courseId}"
 */

import { getEmbedding, getEmbeddings } from "./EmbeddingService.js";
import * as Cache from "./CacheService.js";

/**
 * Build (or retrieve from cache) an embedding index for a course.
 *
 * @param {string} courseId
 * @param {{ text: string }[]} chunks — lesson transcript chunks
 * @returns {Promise<{ text: string, embedding: number[] }[]>}
 */
export async function buildIndex(courseId, chunks) {
  const cacheKey = `embeddings:${courseId}`;
  const cached = Cache.get(cacheKey);
  if (cached) {
    console.log(`[RAG] Cache hit — embedding index for course ${courseId}`);
    return cached;
  }

  console.log(`[RAG] Building embedding index for course ${courseId} (${chunks.length} chunks)…`);
  const texts = chunks.map((c) => c.text);
  const embeddings = await getEmbeddings(texts);

  const index = chunks.map((chunk, i) => ({
    text: chunk.text,
    embedding: embeddings[i],
  }));

  Cache.set(cacheKey, index);
  return index;
}

/**
 * Retrieve the top-K most relevant chunks for a query.
 *
 * @param {string} query — the user's question
 * @param {string} courseId
 * @param {{ text: string }[]} chunks — lesson transcripts (used if index not cached)
 * @param {number} topK — number of chunks to return (default: 3)
 * @returns {Promise<string>} — concatenated relevant context string
 */
export async function retrieve(query, courseId, chunks, topK = 3) {
  const index = await buildIndex(courseId, chunks);
  const queryEmbedding = await getEmbedding(query);

  // Rank chunks by cosine similarity
  const ranked = index
    .map((entry) => ({
      text: entry.text,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  console.log(
    `[RAG] Retrieved ${ranked.length} chunks for query (top scores: ${ranked
      .map((r) => r.score.toFixed(3))
      .join(", ")})`
  );

  return ranked.map((r) => r.text).join("\n\n---\n\n");
}

/**
 * Cosine similarity between two equal-length vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} — value in [-1, 1]
 */
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
