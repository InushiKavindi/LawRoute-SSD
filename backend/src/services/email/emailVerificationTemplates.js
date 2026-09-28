export const emailVerificationTemplate = ({ name, verificationUrl }) => {
  const subject = "Verify your Email - LawRoute";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to LawRoute!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for registering. Please confirm your email address by clicking the link below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="color: #666; font-size: 12px;">Best regards,<br>The LawRoute Team</p>
    </div>
  `;

  return { subject, html };
};
