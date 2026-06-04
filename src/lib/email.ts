import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/sabi/reset-password?token=${resetToken}`;

    await resend.emails.send({
      from: 'Sabi <noreply@sability.io>',
      to: email,
      subject: 'Reset Your Sabi Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Reset Your Password</h1>
          </div>

          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              We received a request to reset your Sabi account password. Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p style="color: #999; font-size: 14px; margin: 20px 0;">
              Or copy this link: <br/>
              <code style="background: #e8e8e8; padding: 8px 12px; border-radius: 4px; word-break: break-all;">${resetLink}</code>
            </p>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              <strong>Note:</strong> This link expires in 1 hour. If you didn't request this, ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Sabi | Real Nigerian Engagement<br/>
              sability.io
            </p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendVerificationEmail(
  email: string,
  verifyCode: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: 'Sabi <noreply@sability.io>',
      to: email,
      subject: 'Verify Your Sabi Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Verify Your Email</h1>
          </div>

          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 12px 12px;">
            <p style="color: #333; font-size: 16px;">Hi ${userName},</p>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              Welcome to Sabi! Use the code below to verify your email address and activate your account.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background: white; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; display: inline-block;">
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px;">
                  ${verifyCode}
                </p>
              </div>
            </div>

            <p style="color: #666; line-height: 1.6; margin: 20px 0;">
              <strong>Note:</strong> This code expires in 24 hours. If you didn't create this account, ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 30px 0;">

            <p style="color: #999; font-size: 12px; text-align: center;">
              © 2026 Sabi | Real Nigerian Engagement<br/>
              sability.io
            </p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

