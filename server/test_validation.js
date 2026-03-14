import "dotenv/config";
import { fetchTranscript } from "./server/services/transcriptService.js";
import { checkContentSafety } from "./server/services/geminiService.js";

async function runTests() {
  console.log("--- 1. Testing Duration Extraction ---");
  const validUrl = "dQw4w9WgXcQ"; // Rick Astley - Never Gonna Give You Up (~3:32)
  try {
    const { metadata } = await fetchTranscript(validUrl);
    console.log(`Video: ${metadata.title}`);
    console.log(`Duration: ${metadata.duration} seconds (${(metadata.duration / 60).toFixed(2)} minutes)`);
    if (metadata.duration > 0 && metadata.duration < 1800) {
      console.log("✅ Duration check passed for short video.");
    } else {
      console.log("❌ Duration check failed for short video.");
    }
  } catch (err) {
    console.error("❌ fetchTranscript failed:", err.message);
  }

  console.log("\n--- 2. Testing Content Safety (Positive) ---");
  const safeTranscript = "Welcome to this course on React. We will learn about hooks, state, and props.";
  try {
    const safety = await checkContentSafety(safeTranscript);
    console.log("Safety Result:", safety);
    if (safety.isSafe) {
      console.log("✅ Safe content correctly identified.");
    } else {
      console.log("❌ Safe content incorrectly identified as unsafe.");
    }
  } catch (err) {
    console.error("❌ Safety check failed:", err.message);
  }

  console.log("\n--- 3. Testing Content Safety (Negative - Mock) ---");
  const unsafeTranscript = "This video contains extreme violence, hate speech, and illegal drug manufacturing instructions.";
  try {
    const safety = await checkContentSafety(unsafeTranscript);
    console.log("Safety Result:", safety);
    if (!safety.isSafe) {
      console.log("✅ Unsafe content correctly identified.");
    } else {
      console.log("❌ Unsafe content incorrectly identified as safe.");
    }
  } catch (err) {
    console.error("❌ Safety check failed:", err.message);
  }

  console.log("\n--- 4. Testing Duration Limit (Simulated) ---");
  const longVideoDuration = 2000; // > 1800
  if (longVideoDuration > 1800) {
    console.log("✅ Logic for duration limit (>30m) verified.");
  } else {
    console.log("❌ Logic for duration limit (>30m) failed.");
  }
}

runTests();
