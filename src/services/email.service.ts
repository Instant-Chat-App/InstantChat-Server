import nodemailer from "nodemailer";
import { getEnv } from "../utils/get-env.service";
import { logger } from "../utils/logger";

class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    // Create a transporter using SMTP
    this.transporter = nodemailer.createTransport({
      host: getEnv("EMAIL_HOST"),
      port: parseInt(getEnv("EMAIL_PORT")),
      secure: getEnv("EMAIL_SECURE", "false") === "true",
      auth: {
        user: getEnv("EMAIL_USER"),
        pass: getEnv("EMAIL_PASSWORD"),
      },
    });
  }

  async sendPasswordResetLink(
    email: string,
    resetToken: string
  ): Promise<boolean> {
    try {
      const resetUrl = `${getEnv(
        "FRONTEND_URL"
      )}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: getEnv("EMAIL_FROM", "InstantChat <noreply@instantchat.com>"),
        to: email,
        subject: "Password Reset for InstantChat",
        html: `
          <h1>Reset Your Password</h1>
          <p>You requested a password reset for your InstantChat account.</p>
          <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>If you did not request this reset, please ignore this email.</p>
          <p>Regards,<br>InstantChat Team</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send password reset email: ${error}`);
      return false;
    }
  }
}

export const emailService = new EmailService();
