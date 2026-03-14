import "dotenv/config";
import { generateCourseTitle } from "./services/geminiService.js";

async function runStressTest() {
  console.log("🚀 Starting Gemini API stress test...");
  
  const sampleTranscript = "Welcome to this machine learning course. Today we talk about linear regression and how to optimize weights using gradient descent. This is important for building AI models.";
  
  // Launch 10 requests in parallel to intentionally hit the rate limit (Free tier is 15 RPM, but bursts trigger 429 easily)
  const requests = Array.from({ length: 8 }).map((_, i) => {
    return (async () => {
      try {
        console.log(`[Test] Launching request #${i + 1}...`);
        const title = await generateCourseTitle(sampleTranscript);
        console.log(`[Test] Request #${i + 1} SUCCESS: ${title}`);
        return true;
      } catch (err) {
        console.error(`[Test] Request #${i + 1} FAILED: ${err.message}`);
        return false;
      }
    })();
  });

  const results = await Promise.all(requests);
  const successCount = results.filter(Boolean).length;
  
  console.log("\n--- Stress Test Summary ---");
  console.log(`Total Requests: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${results.length - successCount}`);
  
  if (successCount === results.length) {
    console.log("✅ SUCCESS: All requests completed, even if some retried.");
  } else {
    console.log("⚠️ WARNING: Some requests failed permanently. Check logs for backoff behavior.");
  }
}

runStressTest();
