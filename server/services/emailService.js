import nodemailer from "nodemailer";
import dns from "dns";

// FIX 3: Must be called at the very top of this module, before any DNS resolution
dns.setDefaultResultOrder("ipv4first");

const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp4.gmail.com", // FIX 1: Use Gmail's IPv4-only hostname
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // FIX 2: Added `all: false` to ensure only a single IPv4 address is returned
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4, all: false }, callback);
      },
    });

    const mailOptions = {
      from: `"TL;DR" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verification Code for TL;DR",
      html: `
        <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
          <div style="margin:50px auto;width:70%;padding:20px 0">
            <div style="border-bottom:1px solid #eee">
              <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">TL;DR</a>
            </div>
            <p style="font-size:1.1em">Hi,</p>
            <p>Thank you for choosing TL;DR. Use the following OTP to complete your Sign Up procedures. OTP is valid for 10 minutes</p>
            <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
            <p style="font-size:0.9em;">Regards,<br />TL;DR Team</p>
            <hr style="border:none;border-top:1px solid #eee" />
            <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
              <p>TL;DR Inc</p>
              <p>India</p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

export default sendOTPEmail;