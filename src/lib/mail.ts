import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "re_dummy_key_for_runtime_guard";
export const resend = new Resend(resendApiKey);

const FROM_EMAIL = process.env.EMAIL_FROM || "DevStash <onboarding@resend.dev>";

function getAppBaseUrl(): string {
  if (process.env.AUTH_URL) return process.env.AUTH_URL.replace(/\/$/, "");
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export interface SendVerificationEmailResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Sends an email verification link to the specified email address using Resend.
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<SendVerificationEmailResult> {
  const baseUrl = getAppBaseUrl();
  const confirmLink = `${baseUrl}/verify-email?token=${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your DevStash account</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; margin: 0; padding: 40px 20px;">
  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #27272a; text-align: center;">
        <div style="display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); border-radius: 10px; font-weight: 700; font-size: 18px; color: #ffffff; letter-spacing: -0.5px;">
          DevStash
        </div>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.5px;">Verify your email address</h1>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          Thanks for signing up for DevStash, your personal developer knowledge hub. Please click the button below to verify your email address and activate your account.
        </p>
        
        <!-- Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmLink}" style="background-color: #ffffff; color: #09090b; display: inline-block; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; box-shadow: 0 4px 12px rgba(255,255,255,0.15);">
            Verify Email Address
          </a>
        </div>

        <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0;">
          This verification link will expire in <strong>24 hours</strong>. If the button above doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin: 8px 0 0 0; word-break: break-all;">
          <a href="${confirmLink}" style="color: #818cf8; font-size: 12px; text-decoration: underline;">
            ${confirmLink}
          </a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #121215; border-top: 1px solid #27272a; text-align: center;">
        <p style="color: #52525b; font-size: 12px; margin: 0;">
          If you didn't create an account with DevStash, you can safely ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `
Verify your DevStash account

Thanks for signing up for DevStash. Please visit the following link to verify your email address:

${confirmLink}

This link will expire in 24 hours. If you didn't create an account, you can safely ignore this message.
`.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your DevStash account",
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error("Resend email delivery error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send email";
    console.error("Unexpected error in sendVerificationEmail:", err);
    return { success: false, error: errorMessage };
  }
}

export type SendPasswordResetEmailResult = SendVerificationEmailResult;

/**
 * Sends a password reset link to the specified email address using Resend.
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<SendPasswordResetEmailResult> {
  const baseUrl = getAppBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your DevStash password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; margin: 0; padding: 40px 20px;">
  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #27272a; text-align: center;">
        <div style="display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899); border-radius: 10px; font-weight: 700; font-size: 18px; color: #ffffff; letter-spacing: -0.5px;">
          DevStash
        </div>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 32px;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0 0 16px 0; letter-spacing: -0.5px;">Reset your password</h1>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
          We received a request to reset the password for your DevStash account. Click the button below to choose a new password.
        </p>
        
        <!-- Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background-color: #ffffff; color: #09090b; display: inline-block; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; box-shadow: 0 4px 12px rgba(255,255,255,0.15);">
            Reset Password
          </a>
        </div>

        <p style="color: #71717a; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0;">
          This password reset link will expire in <strong>1 hour</strong>. If the button above doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin: 8px 0 0 0; word-break: break-all;">
          <a href="${resetLink}" style="color: #818cf8; font-size: 12px; text-decoration: underline;">
            ${resetLink}
          </a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #121215; border-top: 1px solid #27272a; text-align: center;">
        <p style="color: #52525b; font-size: 12px; margin: 0;">
          If you didn't request a password reset, you can safely ignore this email. Your password will not change until you access the link above.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const textContent = `
Reset your DevStash password

We received a request to reset the password for your DevStash account. Please visit the following link to choose a new password:

${resetLink}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this message.
`.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your DevStash password",
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error("Resend email delivery error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to send email";
    console.error("Unexpected error in sendPasswordResetEmail:", err);
    return { success: false, error: errorMessage };
  }
}

