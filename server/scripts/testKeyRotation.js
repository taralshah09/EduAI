import { configDotenv } from "dotenv";
configDotenv();

// Provide some dummy keys
process.env.GROQ_API_KEY = "dummy_1";
process.env.GROQ_API_KEY_1 = "dummy_2";
process.env.GROQ_API_KEY_2 = "dummy_3";
process.env.GROQ_API_KEY_3 = "dummy_4";
process.env.GROQ_API_KEY_4 = "dummy_5";
process.env.GROQ_API_KEY_5 = "valid_key_if_we_had_one"; // We won't actually have one, we just expect it to iterate

import { call } from "../ai/AIProviderRouter.js";

async function test() {
  console.log("Starting Key Rotation Test...");

  try {
    // This will trigger INVALID_KEY on Groq repeatedly.
    // The router should log that it is trying multiple keys.
    await call("title", "Test prompt", {
      userApiKeys: { groq: { apiKey: "user_dummy_key" } },
      onUserKeyFailure: async (reason) => {
        console.log("Triggered onUserKeyFailure callback with reason:", reason);
      }
    });
  } catch (err) {
    console.log("Test finished with final error:", err.message);
  }
}

test();
