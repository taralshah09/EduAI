import "dotenv/config";
import { generateCourseTitle } from "./services/geminiService.js";

async function verify() {
  console.log("Starting verification...");
  try {
    const title = await generateCourseTitle("This is a test transcript for verifying fallback logic.");
    console.log(`✅ Success! Title: ${title}`);
  } catch (err) {
    console.error("❌ Verification failed:", err.message);
  }
}

verify();
