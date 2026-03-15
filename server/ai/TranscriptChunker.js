/**
 * TranscriptChunker — Token-aware transcript chunking
 *
 * Improves on the original word-based chunker in transcriptService.js
 * by estimating token counts (words * 1.33) and targeting the 800–1200
 * token range specified in the architecture requirements.
 *
 * The original chunkTranscript() in transcriptService.js is preserved
 * for backward compatibility but this module is used by ContentGenerator.
 */

const TOKENS_PER_WORD = 1.33; // GPT/LLaMA average
const TARGET_TOKENS = 900;
const MAX_TOKENS = 1100;
const OVERLAP_TOKENS = 100;

const TARGET_WORDS = Math.floor(TARGET_TOKENS / TOKENS_PER_WORD);   // ~677
const MAX_WORDS    = Math.floor(MAX_TOKENS / TOKENS_PER_WORD);       // ~827
const OVERLAP_WORDS = Math.floor(OVERLAP_TOKENS / TOKENS_PER_WORD);  // ~75

/**
 * Splits a transcript text string into token-aware chunks with overlap.
 * @param {string} fullText — plain text transcript
 * @param {{ targetWords?: number, overlapWords?: number }} options
 * @returns {{ chunkIndex: number, text: string, tokenEstimate: number }[]}
 */
export function chunkText(fullText, { targetWords = TARGET_WORDS, overlapWords = OVERLAP_WORDS } = {}) {
  const words = fullText.trim().split(/\s+/);
  if (words.length === 0) return [];

  const chunks = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const slice = words.slice(i, i + targetWords);
    const text = slice.join(" ");
    const tokenEstimate = Math.round(slice.length * TOKENS_PER_WORD);

    chunks.push({ chunkIndex, text, tokenEstimate });
    chunkIndex++;
    i += targetWords - overlapWords;
  }

  return chunks;
}

/**
 * Same as chunkText but accepts transcript items (from transcriptService).
 * @param {{ text: string }[]} items — transcript segment objects
 * @param {{ targetWords?: number, overlapWords?: number }} options
 * @returns {{ chunkIndex: number, text: string, tokenEstimate: number }[]}
 */
export function chunkItems(items, options = {}) {
  const fullText = items.map((t) => t.text).join(" ");
  return chunkText(fullText, options);
}
