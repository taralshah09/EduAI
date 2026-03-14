import { configDotenv } from "dotenv";
configDotenv();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",        // separate daily quota bucket
  "gemini-2.0-flash-lite",
];



/**
 * Wraps model.generateContent with exponential backoff and model fallback.
 */
async function generateWithRetry(prompt, maxRetries = 5, baseDelayMs = 2000) {
  let lastError;

  for (const modelName of MODELS) {
    const currentModel = genAI.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await currentModel.generateContent(prompt);
        return result;
      } catch (err) {
        lastError = err;
        const errMsg = err?.message || "";
        const status = err?.status || (err?.response ? err.response.status : null);

        // Comprehensive check for rate limits/quota errors
        const isQuotaExceeded =
          status === 429 ||
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("limit") ||
          errMsg.toLowerCase().includes("rate limit exceeded");

        if (isQuotaExceeded) {
          // If it's a "total quota exceeded" (limit: 0) or "Quota exceeded for project"
          if (errMsg.includes("limit: 0") || errMsg.includes("Quota exceeded")) {
            console.warn(`[Gemini] Model ${modelName} quota exhausted. Trying next model if available...`);
            break; // Break the retry loop to try the next model
          }

          if (attempt < maxRetries) {
            // Exponential backoff with jitter
            const backoff = baseDelayMs * Math.pow(2, attempt);
            const jitter = backoff * (0.8 + Math.random() * 0.4);
            console.warn(`[Gemini] ${modelName} rate limited (attempt ${attempt + 1}/${maxRetries}). Retrying in ${(jitter / 1000).toFixed(1)}s…`);
            await new Promise((r) => setTimeout(r, jitter));
            continue;
          }
        }

        // If it's not a quota error or we've exhausted retries for this model
        if (!isQuotaExceeded || attempt === maxRetries) {
          console.error(`[Gemini] ${modelName} failed (attempt ${attempt + 1}): ${errMsg}`);
          break; // Try next model
        }
      }
    }
  }

  throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
}

/**
 * Generic helper — sends prompt to Gemini and returns parsed JSON
 */
async function generateJSON(prompt) {
  const result = await generateWithRetry(prompt);
  const text = result.response.text();

  // Strip markdown code fences if Gemini wraps its JSON
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  return JSON.parse(cleaned);
}

/**
 * Generates structured lesson content from a transcript chunk.
 * Returns: { title, summary, concepts, explanation, examples }
 */
export async function generateLessonContent(transcriptChunk, chunkIndex) {
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

  return generateJSON(prompt);
}

/**
 * Generates a quiz (5 MCQ questions) for a lesson.
 * Returns array of { question, options, correct, explanation }
 */
export async function generateQuiz(lessonTitle, lessonContent) {
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

  return generateJSON(prompt);
}

/**
 * Answers a user question using transcript context (RAG-style, text v1).
 * Returns: string answer
 */
export async function answerQuestion(question, transcriptContext, chatHistory = []) {
  const historyText = chatHistory
    .slice(-6) // last 3 exchanges
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

  const result = await generateWithRetry(prompt);
  return result.response.text().trim();
}

/**
 * Generates a course title from the full transcript summary.
 */
export async function generateCourseTitle(fullTranscriptSample) {
  const prompt = `
Given the following excerpt from a YouTube video transcript, suggest a concise, engaging course title (5-10 words).

Transcript sample:
"""
${fullTranscriptSample.slice(0, 1500)}
"""

Respond ONLY with the title string, nothing else.
`.trim();

  const result = await generateWithRetry(prompt);
  return result.response.text().trim().replace(/^["']|["']$/g, "");
}

/**
 * Checks if the video content is safe/appropriate for the platform.
 * Returns: { isSafe: boolean, reason: string | null }
 */
export async function checkContentSafety(transcript) {
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
    return await generateJSON(prompt);
  } catch (err) {
    console.error("Content safety check failed, defaulting to safe:", err.message);
    return { isSafe: true, reason: null };
  }
}
