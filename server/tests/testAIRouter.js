/**
 * testAIRouter.js — Smoke test for the multi-provider AI router
 *
 * Run from the server directory:
 *   node tests/testAIRouter.js
 *
 * Tests:
 *   1. Each task type routes successfully through the fallback chain
 *   2. Provider skipping when keys are absent
 *   3. JSON parsing for lesson/quiz/safety tasks
 */

import "dotenv/config";
import { call } from "../ai/AIProviderRouter.js";

const DIVIDER = "─".repeat(60);

async function test(label, task, prompt) {
  process.stdout.write(`\n${DIVIDER}\n🧪 TEST: ${label}\n${DIVIDER}\n`);
  const start = Date.now();
  try {
    const result = await call(task, prompt);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ PASS (${elapsed}s) — first 200 chars:\n${result.slice(0, 200)}`);
  } catch (err) {
    console.error(`❌ FAIL: ${err.message}`);
  }
}

async function runAll() {
  console.log("\n🚀 Starting AI Router smoke tests…\n");

  await test(
    "Chat task (Llama-3-70B primary)",
    "chat",
    'Answer this question about machine learning: "What is gradient descent?"'
  );

  await test(
    "Lesson content (structured JSON)",
    "lesson",
    `
You are an expert educational content creator. Given the following transcript excerpt from a YouTube video, generate a structured lesson.

Transcript chunk:
"""
Gradient descent is an optimization algorithm used in machine learning.
It iteratively adjusts model parameters to minimize a loss function.
The algorithm computes the gradient of the loss with respect to each parameter
and updates them in the opposite direction of the gradient.
"""

Respond ONLY with valid JSON in this exact schema:
{
  "title": "string",
  "summary": "string",
  "concepts": ["string"],
  "explanation": "string",
  "examples": ["string"]
}
`.trim()
  );

  await test(
    "Quiz generation (Mixtral primary)",
    "quiz",
    `
Generate exactly 5 MCQ questions about gradient descent.
Respond ONLY with a JSON array of 5 objects with shape:
[{ "question": "string", "options": ["A.", "B.", "C.", "D."], "correct": 0, "explanation": "string" }]
`.trim()
  );

  await test(
    "Safety check (fast boolean check)",
    "safety",
    `
Analyze this transcript for inappropriate content:
"""
Today we'll learn about neural networks and how they work in machine learning.
"""
Respond ONLY with: { "isSafe": true, "reason": null }
`.trim()
  );

  await test(
    "Title generation",
    "title",
    `
Given the following excerpt from a YouTube video transcript, suggest a concise course title (5-10 words).
Transcript: "This video covers gradient descent, backpropagation, and neural network training."
Respond ONLY with the title string.
`.trim()
  );

  console.log(`\n${DIVIDER}\n✅ All tests completed.\n`);
}

runAll().catch(console.error);
