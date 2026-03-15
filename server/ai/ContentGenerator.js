/**
 * ContentGenerator — Prompt wrappers for all AI tasks
 *
 * This is the single source of truth for all prompt templates.
 * Each function is a drop-in replacement for the equivalent in geminiService.js.
 * Call signatures are intentionally identical so courseService.js only needs
 * one import line change.
 *
 * Under the hood, every function delegates to AIProviderRouter which handles
 * fallback, retries, timeout, and provider selection.
 */

import { call } from "./AIProviderRouter.js";

// ── JSON utilities ────────────────────────────────────────────────────────────

/**
 * Strip markdown code fences and parse JSON safely.
 * @param {string} text
 * @returns {any}
 */
function parseJSON(text) {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Attempt direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Try to extract the first JSON object or array from the response
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) return JSON.parse(match[1]);
    throw new Error(`Failed to parse JSON from AI response: ${cleaned.slice(0, 200)}`);
  }
}

// ── Content Safety ─────────────────────────────────────────────────────────────

/**
 * Checks if video content is safe for the platform.
 * @param {string} transcript
 * @param {object|null} userApiKeys
 * @param {Function|null} onUserKeyFailure
 * @returns {Promise<{ isSafe: boolean, reason: string|null }>}
 */
export async function checkContentSafety(transcript, userApiKeys = null, onUserKeyFailure = null) {
  const prompt = `
You are a content safety moderator. Analyze the following transcript from a YouTube video for inappropriate content (NSFW, hate speech, excessive violence, or illegal activities).

Transcript excerpt:
"""
${transcript.slice(0, 3000)}
"""

Respond ONLY with valid JSON in this exact schema:
{
  "isSafe": boolean,
  "reason": "string or null (explain if isSafe is false)"
}
`.trim();

  try {
    const text = await call("safety", prompt, { userApiKeys, onUserKeyFailure });
    return parseJSON(text);
  } catch (err) {
    console.error("[ContentGenerator] Content safety check failed, defaulting to safe:", err.message);
    return { isSafe: true, reason: null };
  }
}

// ── Course Title ───────────────────────────────────────────────────────────────

/**
 * Generates a concise course title from a transcript sample.
 * @param {string} fullTranscriptSample
 * @param {object|null} userApiKeys
 * @param {Function|null} onUserKeyFailure
 * @returns {Promise<string>}
 */
export async function generateCourseTitle(fullTranscriptSample, userApiKeys = null, onUserKeyFailure = null) {
  const prompt = `
Given the following excerpt from a YouTube video transcript, suggest a concise, engaging course title (5-10 words).

Transcript sample:
"""
${fullTranscriptSample.slice(0, 1500)}
"""

Respond ONLY with the title string, nothing else.
`.trim();

  const text = await call("title", prompt, { userApiKeys, onUserKeyFailure });
  return text.replace(/^[\"']|[\"']$/g, "").trim();
}

// ── Lesson Content ─────────────────────────────────────────────────────────────

/**
 * Generates structured lesson content from a transcript chunk.
 * @param {string} transcriptChunk
 * @param {number} chunkIndex
 * @param {object|null} userApiKeys
 * @param {Function|null} onUserKeyFailure
 * @returns {Promise<{ title, summary, concepts, explanation, examples }>}
 */
export async function generateLessonContent(transcriptChunk, chunkIndex, userApiKeys = null, onUserKeyFailure = null) {
  const prompt = `
You are an expert educational content creator. Given the following transcript excerpt from a YouTube video, generate a structured lesson.

Transcript chunk:
"""
${transcriptChunk}
"""

Respond ONLY with valid JSON (no markdown fences, no extra text) in this exact schema:
{
  "title": "string — concise lesson title (4-8 words)",
  "summary": "string — 2-3 sentence summary of this section",
  "concepts": ["string", "string", "string"],
  "explanation": "string — in-depth explanation of the core ideas (3-5 paragraphs)",
  "examples": ["string — concrete example 1", "string — concrete example 2"]
}
`.trim();

  const text = await call("lesson", prompt, { userApiKeys, onUserKeyFailure });
  return parseJSON(text);
}

// ── Quiz Generation ────────────────────────────────────────────────────────────

/**
 * Generates a quiz (5 MCQ questions) for a lesson.
 * @param {string} lessonTitle
 * @param {string} lessonContent
 * @param {object|null} userApiKeys
 * @param {Function|null} onUserKeyFailure
 * @returns {Promise<{ question, options, correct, explanation }[]>}
 */
export async function generateQuiz(lessonTitle, lessonContent, userApiKeys = null, onUserKeyFailure = null) {
  const prompt = `
You are an expert quiz creator for educational content.

Based on the following lesson content, generate exactly 5 multiple-choice quiz questions.

Lesson title: "${lessonTitle}"
Lesson content:
"""
${lessonContent}
"""

Respond ONLY with valid JSON (no markdown fences, no extra text) — an array of 5 objects:
[
  {
    "question": "string",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "correct": 0,
    "explanation": "string — why this is the correct answer"
  }
]

Rules:
- "correct" is the 0-based index of the correct option in the "options" array
- Make wrong answers plausible but clearly incorrect
- Vary difficulty across questions
`.trim();

  const text = await call("quiz", prompt, { userApiKeys, onUserKeyFailure });
  return parseJSON(text);
}

// ── Chat / Q&A ─────────────────────────────────────────────────────────────────

/**
 * Answers a user question using retrieved transcript context (RAG).
 * @param {string} question
 * @param {string} transcriptContext — retrieved relevant chunks
 * @param {{ role: string, content: string }[]} chatHistory
 * @param {object|null} userApiKeys
 * @param {Function|null} onUserKeyFailure
 * @returns {Promise<string>}
 */
export async function answerQuestion(question, transcriptContext, chatHistory = [], userApiKeys = null, onUserKeyFailure = null) {
  const historyText = chatHistory
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");

  const prompt = `
You are an expert AI tutor helping a student understand the content from a YouTube video course.

Relevant course content:
"""
${transcriptContext}
"""

${historyText ? `Recent conversation:\n${historyText}\n` : ""}
Student's question: "${question}"

Provide a clear, educational answer based on the course content. Be concise but thorough.
If the question is not related to the course content, politely redirect to the course topics.
`.trim();

  return call("chat", prompt, { userApiKeys, onUserKeyFailure });
}
