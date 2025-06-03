import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { SendEmailCommandInput } from "@aws-sdk/client-ses";
import { env } from "../../env.js";
import { emailTemplates } from "./templates.js";
import type {
  EmailVerificationData,
  PasswordResetData,
  InvitationData,
  EmailOTPData,
  DeleteAccountVerificationData,
} from "./templates.js";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}

export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.sesClient = new SESClient({
      region: env.AWS_REGION,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY as string,
      },
    });

    this.fromEmail = env.SES_FROM_EMAIL as string;
    this.fromName = env.SES_FROM_NAME as string;
  }

  /**
   * Send a raw email with custom content
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const fromAddress = options.from || `${this.fromName} <${this.fromEmail}>`;

    const params: SendEmailCommandInput = {
      Source: fromAddress,
      Destination: {
        ToAddresses: [options.to],
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: options.html,
            Charset: "UTF-8",
          },
          Text: {
            Data: options.text,
            Charset: "UTF-8",
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);
      console.log("Email sent successfully:", {
        messageId: result.MessageId,
        to: options.to,
        subject: options.subject,
      });
    } catch (error) {
      console.error("Failed to send email:", {
        error: error instanceof Error ? error.message : error,
        to: options.to,
        subject: options.subject,
      });
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(data: EmailVerificationData & { to: string }): Promise<void> {
    const template = emailTemplates.verification({
      userName: data.userName,
      verificationUrl: data.verificationUrl,
      appName: data.appName,
    });

    await this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(data: PasswordResetData & { to: string }): Promise<void> {
    const template = emailTemplates.passwordReset({
      userName: data.userName,
      resetUrl: data.resetUrl,
      appName: data.appName,
    });

    await this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(data: InvitationData & { to: string }): Promise<void> {
    const template = emailTemplates.invitation({
      inviteeName: data.inviteeName,
      inviterName: data.inviterName,
      organizationName: data.organizationName,
      invitationUrl: data.invitationUrl,
      appName: data.appName,
    });

    await this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send OTP email for verification
   */
  async sendOTPEmail(data: EmailOTPData & { to: string }): Promise<void> {
    const template = emailTemplates.emailOTP({
      userName: data.userName,
      otp: data.otp,
      appName: data.appName,
      type: data.type,
    });

    await this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Test email functionality
   */
  async testEmail(to: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: "Test Email from LibraNote",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email</h2>
          <p>This is a test email to verify that your email service is working correctly.</p>
          <p>If you receive this email, your Amazon SES configuration is working properly!</p>
        </div>
      `,
      text: `
        Test Email
        
        This is a test email to verify that your email service is working correctly.
        
        If you receive this email, your Amazon SES configuration is working properly!
      `,
    });
  }

  async sendDeleteAccountVerificationEmail(
    data: DeleteAccountVerificationData & { to: string },
  ): Promise<void> {
    const template = emailTemplates.deleteAccountVerification({
      userName: data.userName,
      deleteUrl: data.deleteUrl,
      appName: data.appName,
    });

    await this.sendEmail({
      to: data.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

// Export a singleton instance
export const emailService = new EmailService();
