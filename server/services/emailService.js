import dotenv from "dotenv";
dotenv.config();

const sendOTPEmail = async (email, otp) => {
  const workerUrl = process.env.WORKER_URL;
  const workerSecret = process.env.WORKER_SECRET;

  if (!workerUrl || !workerSecret) {
    throw new Error("Missing WORKER_URL or WORKER_SECRET in .env");
  }

  try {
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": workerSecret,
      },
      body: JSON.stringify({
        email: email,
        otp: String(otp)
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send OTP via Worker");
    }

    console.log(`OTP email sent to ${email} via Cloudflare Worker. Response:`, data);
    return data;
  } catch (error) {
    console.error("Worker email error:", error.message);
    throw new Error("Failed to send verification email");
  }
};

export default sendOTPEmail;