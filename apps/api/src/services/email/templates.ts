export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
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

export interface CollectionInvitationData {
  inviterName: string;
  collectionName: string;
  invitationUrl: string;
  appName: string;
}

const baseStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    .email-container {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 24px;
      text-align: center;
    }
    
    .email-logo {
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
      margin: 0;
      letter-spacing: -0.025em;
    }
    
    .email-content {
      padding: 32px 24px;
    }
    
    .email-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 16px 0;
      letter-spacing: -0.025em;
    }
    
    .email-text {
      color: #6b7280;
      margin: 0 0 16px 0;
      font-size: 15px;
    }
    
    .email-button {
      display: inline-block;
      background: #111827;
      color: #ffffff;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 15px;
      transition: all 0.2s ease;
      margin: 24px 0;
    }
    
    .email-button:hover {
      background: #374151;
      transform: translateY(-1px);
    }
    
    .email-button.danger {
      background: #dc2626;
    }
    
    .email-button.danger:hover {
      background: #b91c1c;
    }
    
    .email-button.success {
      background: #059669;
    }
    
    .email-button.success:hover {
      background: #047857;
    }
    
    .email-footer {
      background: #f9fafb;
      padding: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .email-footer-text {
      color: #9ca3af;
      font-size: 13px;
      margin: 0 0 8px 0;
    }
    
    .email-link {
      color: #6366f1;
      word-break: break-all;
      text-decoration: none;
    }
    
    .otp-container {
      background: #f8fafc;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    
    .otp-code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 28px;
      font-weight: 600;
      color: #1e293b;
      letter-spacing: 4px;
      margin: 8px 0;
    }
    
    .otp-label {
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }
    
    .center {
      text-align: center;
    }
  </style>
`;

export const emailTemplates = {
  passwordReset: (data: PasswordResetData): EmailTemplate => ({
    subject: `Reset your password for ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          ${baseStyles}
        </head>
        <body style="margin: 0; padding: 24px; background-color: #f3f4f6;">
          <div class="email-container">
            <div class="email-header">
              <h1 class="email-logo">${data.appName}</h1>
            </div>
            
            <div class="email-content">
              <h2 class="email-title">Reset your password</h2>
              <p class="email-text">Hi ${data.userName},</p>
              <p class="email-text">
                We received a request to reset your password for your ${data.appName} account. 
                Click the button below to create a new password.
              </p>
              
              <div class="center">
                <a href="${data.resetUrl}" class="email-button danger">
                  Reset Password
                </a>
              </div>
            </div>
            
            <div class="email-footer">
              <p class="email-footer-text">
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
              <p class="email-footer-text">
                If the button doesn't work, copy and paste this link:
                <br><a href="${data.resetUrl}" class="email-link">${data.resetUrl}</a>
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
      
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      
      Best regards,
      The ${data.appName} Team
    `,
  }),

  invitation: (data: InvitationData): EmailTemplate => ({
    subject: `${data.inviterName} invited you to join ${data.organizationName} on ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
          ${baseStyles}
        </head>
        <body style="margin: 0; padding: 24px; background-color: #f3f4f6;">
          <div class="email-container">
            <div class="email-header">
              <h1 class="email-logo">${data.appName}</h1>
            </div>
            
            <div class="email-content">
              <h2 class="email-title">You're invited to join a team</h2>
              <p class="email-text">Hi ${data.inviteeName},</p>
              <p class="email-text">
                <strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> 
                on ${data.appName}. Accept the invitation to start collaborating with your team.
              </p>
              
              <div class="center">
                <a href="${data.invitationUrl}" class="email-button success">
                  Accept Invitation
                </a>
              </div>
            </div>
            
            <div class="email-footer">
              <p class="email-footer-text">
                If you don't want to join this organization, you can safely ignore this email.
              </p>
              <p class="email-footer-text">
                If the button doesn't work, copy and paste this link:
                <br><a href="${data.invitationUrl}" class="email-link">${data.invitationUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Team Invitation - ${data.appName}
      
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
            title: "Sign in verification",
            message: "Here's your verification code to sign in to your account:",
            note: "If you didn't try to sign in, you can safely ignore this email.",
          };
        case "email-verification":
          return {
            subject: `Verify your email address for ${data.appName}`,
            title: "Email verification",
            message: "Please use this verification code to confirm your email address:",
            note: "If you didn't create an account, you can safely ignore this email.",
          };
        case "forget-password":
          return {
            subject: `Reset your password for ${data.appName}`,
            title: "Password reset",
            message: "Here's your verification code to reset your password:",
            note: "If you didn't request a password reset, you can safely ignore this email.",
          };
        default:
          return {
            subject: `Verification Code for ${data.appName}`,
            title: "Verification required",
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
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            ${baseStyles}
          </head>
          <body style="margin: 0; padding: 24px; background-color: #f3f4f6;">
            <div class="email-container">
              <div class="email-header">
                <h1 class="email-logo">${data.appName}</h1>
              </div>
              
              <div class="email-content">
                <h2 class="email-title">${title}</h2>
                <p class="email-text">Hi ${data.userName},</p>
                <p class="email-text">${message}</p>
                
                <div class="otp-container">
                  <p class="otp-label">Verification Code</p>
                  <div class="otp-code">${data.otp}</div>
                  <p class="email-footer-text" style="margin-top: 12px;">This code expires in 15 minutes</p>
                </div>
              </div>
              
              <div class="email-footer">
                <p class="email-footer-text">${note}</p>
                <p class="email-footer-text">
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
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Delete Account Verification</title>
          ${baseStyles}
        </head>
        <body style="margin: 0; padding: 24px; background-color: #f3f4f6;">
          <div class="email-container">
            <div class="email-header">
              <h1 class="email-logo">${data.appName}</h1>
            </div>
            
            <div class="email-content">
              <h2 class="email-title">Delete your account</h2>
              <p class="email-text">Hi ${data.userName},</p>
              <p class="email-text">
                We received a request to delete your account for ${data.appName}. 
                This action is permanent and cannot be undone.
              </p>
              
              <div class="center">
                <a href="${data.deleteUrl}" class="email-button danger">
                  Delete Account
                </a>
              </div>
            </div>
            
            <div class="email-footer">
              <p class="email-footer-text">
                If you didn't request to delete your account, you can safely ignore this email. Your account will remain active.
              </p>
              <p class="email-footer-text">
                If the button doesn't work, copy and paste this link:
                <br><a href="${data.deleteUrl}" class="email-link">${data.deleteUrl}</a>
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
      
      If you didn't request to delete your account, you can safely ignore this email. Your account will remain active.
      
      Best regards,
      The ${data.appName} Team
    `,
  }),

  collectionInvitation: (data: CollectionInvitationData): EmailTemplate => ({
    subject: `${data.inviterName} invited you to join ${data.collectionName} on ${data.appName}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Collection Invitation</title>
          ${baseStyles}
        </head>
        <body style="margin: 0; padding: 24px; background-color: #f3f4f6;">
          <div class="email-container">
            <div class="email-header">
              <h1 class="email-logo">${data.appName}</h1>
            </div>

            <div class="email-content">
              <h2 class="email-title">You're invited to join a collection</h2>
              <p class="email-text">Hi,</p>
              <p class="email-text">
                <strong>${data.inviterName}</strong> has invited you to join <strong>${data.collectionName}</strong> 
                on ${data.appName}. Accept the invitation to start collaborating on this collection.
              </p>
              
              <div class="center">
                <a href="${data.invitationUrl}" class="email-button success">
                  Accept Invitation
                </a>
              </div>
            </div>
            
            <div class="email-footer">
              <p class="email-footer-text">
                If you don't want to join this collection, you can safely ignore this email.
              </p>
              <p class="email-footer-text">
                If the button doesn't work, copy and paste this link:
                <br><a href="${data.invitationUrl}" class="email-link">${data.invitationUrl}</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Collection Invitation - ${data.appName}
      
      Hi,
      
      ${data.inviterName} invited you to join ${data.collectionName} on ${data.appName}. Visit the following link to accept the invitation:
      
      ${data.invitationUrl}
      
      If you don't want to join this collection, you can safely ignore this email.
      
      Best regards,
      The ${data.appName} Team
    `,
  }),
};
