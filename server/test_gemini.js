import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b"];

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, say 'Test successful'.");
    console.log(`✅ ${modelName}: ${result.response.text().trim()}`);
  } catch (err) {
    console.error(`❌ ${modelName} failed:`, err.message);
  }
}

async function runTests() {
  for (const model of models) {
    await testModel(model);
  }
}

runTests();
