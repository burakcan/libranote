export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailVerificationData {
  userName: string;
  verificationUrl: string;
  appName: string;
}

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
  appName: string;
}

export interface InvitationData {
  inviteeName: string;
  inviterName: string;
  organizationName: string;
  invitationUrl: string;
  appName: string;
}

export interface EmailOTPData {
  userName: string;
  otp: string;
  appName: string;
  type: "sign-in" | "email-verification" | "forget-password";
}

export interface DeleteAccountVerificationData {
  userName: string;
  deleteUrl: string;
  appName: string;
}

export const emailTemplates = {
  verification: (data: EmailVerificationData): EmailTemplate => ({
    subject: `Verify your email address for ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; margin: 0; font-size: 28px;">${data.appName}</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Verify Your Email Address</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.userName},
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for signing up for ${data.appName}! To complete your registration and secure your account, please verify your email address by clicking the button below.
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.verificationUrl}" 
                 style="background-color: #007bff; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't create an account with ${data.appName}, you can safely ignore this email.
              </p>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br><a href="${data.verificationUrl}" style="color: #007bff; word-break: break-all;">${data.verificationUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Verify Your Email Address - ${data.appName}
      
      Hi ${data.userName},
      
      Thank you for signing up for ${data.appName}! To complete your registration and secure your account, please verify your email address by visiting the following link:
      
      ${data.verificationUrl}
      
      If you didn't create an account with ${data.appName}, you can safely ignore this email.
      
      Best regards,
      The ${data.appName} Team
    `,
  }),

  passwordReset: (data: PasswordResetData): EmailTemplate => ({
    subject: `Reset your password for ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; margin: 0; font-size: 28px;">${data.appName}</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.userName},
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password for your ${data.appName} account. Click the button below to create a new password.
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.resetUrl}" 
                 style="background-color: #dc3545; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br><a href="${data.resetUrl}" style="color: #dc3545; word-break: break-all;">${data.resetUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Reset Your Password - ${data.appName}
      
      Hi ${data.userName},
      
      We received a request to reset your password for your ${data.appName} account. Visit the following link to create a new password:
      
      ${data.resetUrl}
      
      If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
      
      Best regards,
      The ${data.appName} Team
    `,
  }),

  invitation: (data: InvitationData): EmailTemplate => ({
    subject: `${data.inviterName} invited you to join ${data.organizationName} on ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; margin: 0; font-size: 28px;">${data.appName}</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">You're Invited!</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.inviteeName},
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on ${data.appName}. Click the button below to accept the invitation and join the team.
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.invitationUrl}" 
                 style="background-color: #28a745; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                If you don't want to join this organization, you can safely ignore this email.
              </p>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br><a href="${data.invitationUrl}" style="color: #28a745; word-break: break-all;">${data.invitationUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      You're Invited! - ${data.appName}
      
      Hi ${data.inviteeName},
      
      ${data.inviterName} has invited you to join ${data.organizationName} on ${data.appName}. Visit the following link to accept the invitation:
      
      ${data.invitationUrl}
      
      If you don't want to join this organization, you can safely ignore this email.
      
      Best regards,
      The ${data.appName} Team
    `,
  }),

  emailOTP: (data: EmailOTPData): EmailTemplate => {
    const getSubjectAndContent = () => {
      switch (data.type) {
        case "sign-in":
          return {
            subject: `Sign in to ${data.appName} - Verification Code`,
            title: "Sign In Verification",
            message: "Here's your verification code to sign in to your account:",
            note: "If you didn't try to sign in, you can safely ignore this email.",
          };
        case "email-verification":
          return {
            subject: `Verify your email address for ${data.appName}`,
            title: "Email Verification",
            message:
              "Thank you for signing up! Please use this verification code to confirm your email address:",
            note: "If you didn't create an account, you can safely ignore this email.",
          };
        case "forget-password":
          return {
            subject: `Reset your password for ${data.appName}`,
            title: "Password Reset",
            message: "Here's your verification code to reset your password:",
            note: "If you didn't request a password reset, you can safely ignore this email.",
          };
        default:
          return {
            subject: `Verification Code for ${data.appName}`,
            title: "Verification Required",
            message: "Here's your verification code:",
            note: "If you didn't request this code, you can safely ignore this email.",
          };
      }
    };

    const { subject, title, message, note } = getSubjectAndContent();

    return {
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333333; margin: 0; font-size: 28px;">${data.appName}</h1>
              </div>
              
              <div style="margin-bottom: 30px;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">${title}</h2>
                <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                  Hi ${data.userName},
                </p>
                <p style="color: #666666; line-height: 1.6; margin: 0 0 30px 0;">
                  ${message}
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <div style="background-color: #f8f9fa; border: 2px dashed #007bff; border-radius: 8px; padding: 20px; display: inline-block;">
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff; font-family: 'Courier New', monospace;">
                    ${data.otp}
                  </div>
                </div>
                <p style="color: #666666; font-size: 14px; margin: 15px 0 0 0;">
                  This code will expire in 15 minutes.
                </p>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
                <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${note}
                </p>
                <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                  For security reasons, never share this code with anyone.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        ${title} - ${data.appName}
        
        Hi ${data.userName},
        
        ${message}
        
        Your verification code is: ${data.otp}
        
        This code will expire in 15 minutes.
        
        ${note}
        
        For security reasons, never share this code with anyone.
        
        Best regards,
        The ${data.appName} Team
      `,
    };
  },

  deleteAccountVerification: (data: DeleteAccountVerificationData): EmailTemplate => ({
    subject: `Delete your account for ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delete Account Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333333; margin: 0; font-size: 28px;">${data.appName}</h1>
            </div>
            
            <div style="margin-bottom: 30px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Delete Your Account</h2>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${data.userName},
              </p>
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;"> 
                We received a request to delete your account for ${data.appName}. Click the button below to delete your account.
              </p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.deleteUrl}" 
                 style="background-color: #dc3545; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                Delete Account
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                If you didn't request to delete your account, you can safely ignore this email. Your account will not be deleted.
              </p>
              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br><a href="${data.deleteUrl}" style="color: #dc3545; word-break: break-all;">${data.deleteUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Delete Your Account - ${data.appName}
      
      Hi ${data.userName},
      
      We received a request to delete your account for ${data.appName}. Visit the following link to delete your account:
      
      ${data.deleteUrl}
      
      If you didn't request to delete your account, you can safely ignore this email. Your account will not be deleted.
      
      Best regards,
      The ${data.appName} Team
    `,
  }),
};
