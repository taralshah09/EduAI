import { configDotenv } from "dotenv";
configDotenv();
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash-lite",
];



/**
 * Wraps model.generateContent with exponential backoff and model fallback.
 */
async function generateWithRetry(prompt, maxRetries = 3, baseDelayMs = 2000, userApiKey = null, onUserKeyFailure = null) {
  let lastError;
  let activeGenAI = userApiKey ? new GoogleGenerativeAI(userApiKey) : genAI;
  let usingUserKey = !!userApiKey;

  for (const modelName of MODELS) {
    let currentModel = activeGenAI.getGenerativeModel({ model: modelName });

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await currentModel.generateContent(prompt);
        return result;
      } catch (err) {
        lastError = err;
        const errMsg = err?.message || "";
        const status = err?.status || (err?.response ? err.response.status : null);

        const isQuotaExceeded =
          status === 429 ||
          errMsg.includes("429") ||
          errMsg.toLowerCase().includes("quota") ||
          errMsg.toLowerCase().includes("limit") ||
          errMsg.toLowerCase().includes("rate limit exceeded");

        const isInvalidKey =
          status === 400 ||
          status === 403 ||
          errMsg.includes("400") ||
          errMsg.includes("403") ||
          errMsg.toLowerCase().includes("api_key_invalid") ||
          errMsg.toLowerCase().includes("api key not valid");

        // Check for explicit "Please retry in X.XXs" message
        const retryMatch = errMsg.match(/Please retry in ([\d.]+)s/);
        let retryDelayMs = null;
        
        if (retryMatch && retryMatch[1]) {
          retryDelayMs = parseFloat(retryMatch[1]) * 1000;
        }

        // Distinguish between Daily and Minute quotas
        // "PerDay" or "Daily" in the message usually means we are done for today on this key/model
        const isDailyQuota = isQuotaExceeded && (errMsg.includes("PerDay") || errMsg.includes("Daily") || (errMsg.includes("limit: 0") && !retryDelayMs));

        // If it's an invalid key OR a permanent daily quota exhaustion, we drop the user key
        if (usingUserKey && (isInvalidKey || isDailyQuota)) {
          console.warn(`[Gemini] User API key failed (${isInvalidKey ? 'Invalid' : 'Daily Quota Exceeded'}). Falling back to default key...`);
          if (onUserKeyFailure) {
            const reason = isInvalidKey ? 'Invalid API Key' : 'Daily Quota Exceeded';
            try { await onUserKeyFailure(reason); }
            catch (e) { console.error('onUserKeyFailure callback error:', e.message); }
          }
          usingUserKey = false;
          activeGenAI = genAI;
          currentModel = activeGenAI.getGenerativeModel({ model: modelName });
          attempt--; // Retry this attempt with the default key
          continue;
        }

        if (isQuotaExceeded) {
          // If it's a daily limit or we don't have a retry hint, move to the next model
          if (isDailyQuota) {
            console.warn(`[Gemini] Model ${modelName} daily quota exhausted. Trying next model if available...`);
            break; 
          }

          if (attempt < maxRetries) {
            let waitTimeMs;
            if (retryDelayMs) {
              // Use the API-provided delay + 1 second buffer
              waitTimeMs = retryDelayMs + 1000;
              console.warn(`[Gemini] ${modelName} rate limited. API requested wait of ${(retryDelayMs/1000).toFixed(1)}s (attempt ${attempt + 1}/${maxRetries}). Retrying in ${(waitTimeMs / 1000).toFixed(1)}s…`);
            } else {
              // Exponential backoff with jitter
              const backoff = baseDelayMs * Math.pow(2, attempt);
              const jitter = backoff * (0.8 + Math.random() * 0.4);
              waitTimeMs = jitter;
              console.warn(`[Gemini] ${modelName} rate limited (attempt ${attempt + 1}/${maxRetries}). Retrying in ${(waitTimeMs / 1000).toFixed(1)}s…`);
            }
            
            await new Promise((r) => setTimeout(r, waitTimeMs));
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
async function generateJSON(prompt, userApiKey = null, onUserKeyFailure = null) {
  const result = await generateWithRetry(prompt, 5, 2000, userApiKey, onUserKeyFailure);
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
export async function generateLessonContent(transcriptChunk, chunkIndex, userApiKey = null, onUserKeyFailure = null) {
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

  return generateJSON(prompt, userApiKey, onUserKeyFailure);
}

/**
 * Generates a quiz (5 MCQ questions) for a lesson.
 * Returns array of { question, options, correct, explanation }
 */
export async function generateQuiz(lessonTitle, lessonContent, userApiKey = null, onUserKeyFailure = null) {
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

  return generateJSON(prompt, userApiKey, onUserKeyFailure);
}

/**
 * Answers a user question using transcript context (RAG-style, text v1).
 * Returns: string answer
 */
export async function answerQuestion(question, transcriptContext, chatHistory = [], userApiKey = null, onUserKeyFailure = null) {
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

  const result = await generateWithRetry(prompt, 5, 2000, userApiKey, onUserKeyFailure);
  return result.response.text().trim();
}

/**
 * Generates a course title from the full transcript summary.
 */
export async function generateCourseTitle(fullTranscriptSample, userApiKey = null, onUserKeyFailure = null) {
  const prompt = `
Given the following excerpt from a YouTube video transcript, suggest a concise, engaging course title (5-10 words).

Transcript sample:
"""
${fullTranscriptSample.slice(0, 1500)}
"""

Respond ONLY with the title string, nothing else.
`.trim();

  const result = await generateWithRetry(prompt, 5, 2000, userApiKey, onUserKeyFailure);
  return result.response.text().trim().replace(/^["']|["']$/g, "");
}

/**
 * Checks if the video content is safe/appropriate for the platform.
 * Returns: { isSafe: boolean, reason: string | null }
 */
export async function checkContentSafety(transcript, userApiKey = null, onUserKeyFailure = null) {
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
    return await generateJSON(prompt, userApiKey, onUserKeyFailure);
  } catch (err) {
    console.error("Content safety check failed, defaulting to safe:", err.message);
    return { isSafe: true, reason: null };
  }
}
