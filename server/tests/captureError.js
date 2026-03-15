import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testError() {
  const invalidKey = "AIzaNotARealKey1234567890";
  const genAI = new GoogleGenerativeAI(invalidKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  console.log("Testing with invalid key...");
  try {
    const result = await model.generateContent("Hello");
    console.log("Unexpected success:", result.response.text());
  } catch (err) {
    console.log("--- ERROR CAPTURED ---");
    console.log("Message:", err.message);
    console.log("Status:", err.status);
    console.log("Response:", JSON.stringify(err.response, null, 2));
    console.log("Full Error Object:", err);
  }
}

testError();
