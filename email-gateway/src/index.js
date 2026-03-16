export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== env.WORKER_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const body = await request.json();
      const { email, otp } = body;

      if (!email || !otp) {
        return new Response(JSON.stringify({ error: "Missing email or otp" }), {
          status: 400, headers: { "Content-Type": "application/json" }
        });
      }

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "TL;DR <onboarding@resend.dev>", // Replace with verified Resend domain when ready
          to: [email],
          subject: "OTP Verification",
          html: `
            <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
              <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #eee">
                  <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">TL;DR</a>
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Your OTP is: <strong>${otp}</strong></p>
                <p>This OTP expires in 5 minutes.</p>
              </div>
            </div>
          `
        })
      });

      if (!resendResponse.ok) {
        const errorData = await resendResponse.json();
        return new Response(JSON.stringify({ error: "Failed to send email", details: errorData }), {
          status: 502, headers: { "Content-Type": "application/json" }
        });
      }

      const responseData = await resendResponse.json();

      return new Response(JSON.stringify({ success: true, data: responseData }), {
        status: 200, headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: "Bad Request or Internal Server Error" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }
  },
};
