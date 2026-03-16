import "dotenv/config";
import sendOTPEmail from "../services/emailService.js";

async function test() {
  const testEmail = "immortaltaral.chess@gmail.com"; // Testing with the sender email itself as a safe bet
  const testOtp = "123456";

  console.log(`Starting email test to ${testEmail}...`);
  try {
    const result = await sendOTPEmail(testEmail, testOtp);
    console.log("Test execution finished successfully.");
    console.log("Result:", JSON.stringify(result, null, 2));
    console.log("Please check your email (including spam) for the OTP.");
  } catch (error) {
    console.error("Test failed with error:");
    console.error(error.message);
  }
}

test();
