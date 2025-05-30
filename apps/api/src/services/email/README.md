# Email Service Documentation

This email service provides a robust, maintainable, and expandable email system using Amazon SES for the LibraNote application. It integrates seamlessly with Better Auth for email verification, password reset, and future invitation features.

## Features

- 🔐 **Email Verification**: Automatic email verification for new user signups
- 🔑 **Password Reset**: Secure password reset functionality
- 📧 **Invitation System**: Ready-to-use invitation emails for team collaboration
- 🎨 **Beautiful Templates**: Professional HTML and text email templates
- 🚀 **Amazon SES Integration**: Reliable email delivery with AWS SES
- ⚡ **Type Safe**: Full TypeScript support with proper type definitions
- 🔧 **Expandable**: Easy to add new email types and templates

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=LibraNote
```

### 2. AWS SES Setup

1. **Set up AWS SES**:

   - Go to AWS SES Console
   - Verify your domain or email address
   - Request production access if needed (for sending to unverified emails)

2. **Create IAM User**:
   - Create an IAM user with `AmazonSESFullAccess` policy
   - Generate access keys for the user
   - Use these keys in your environment variables

### 3. Domain Verification (Recommended)

For production use, verify your domain in AWS SES:

- Add the required DNS records
- This allows sending emails from any address on your domain

## Architecture

```
src/services/email/
├── index.ts           # Main exports
├── email-service.ts   # Core email service class
├── templates.ts       # Email templates and types
└── README.md         # This documentation
```

## Usage

### Basic Email Sending

```typescript
import { emailService } from "../services/email";

// Send a custom email
await emailService.sendEmail({
  to: "user@example.com",
  subject: "Welcome to LibraNote",
  html: "<h1>Welcome!</h1><p>Thanks for joining us.</p>",
  text: "Welcome! Thanks for joining us.",
});
```

### Email Verification

The email verification is automatically handled by Better Auth when configured. Users will receive a professional verification email when they sign up.

### Password Reset

Password reset emails are automatically sent when users request a password reset through Better Auth.

### Manual Email Sending

```typescript
import { emailService } from "../services/email";

// Send verification email manually
await emailService.sendVerificationEmail({
  to: "user@example.com",
  userName: "John Doe",
  verificationUrl: "https://app.libranote.com/verify?token=xyz",
  appName: "LibraNote",
});

// Send password reset email
await emailService.sendPasswordResetEmail({
  to: "user@example.com",
  userName: "John Doe",
  resetUrl: "https://app.libranote.com/reset?token=xyz",
  appName: "LibraNote",
});

// Send invitation email
await emailService.sendInvitationEmail({
  to: "newuser@example.com",
  inviteeName: "Jane Smith",
  inviterName: "John Doe",
  organizationName: "Acme Corp",
  invitationUrl: "https://app.libranote.com/accept?token=xyz",
  appName: "LibraNote",
});
```

## Adding New Email Types

### 1. Define the Template Data Interface

```typescript
// In templates.ts
export interface WelcomeEmailData {
  userName: string;
  appName: string;
  dashboardUrl: string;
}
```

### 2. Create the Template

```typescript
// In templates.ts
export const emailTemplates = {
  // ... existing templates ...

  welcome: (data: WelcomeEmailData): EmailTemplate => ({
    subject: `Welcome to ${data.appName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <!-- Your HTML template here -->
      </html>
    `,
    text: `
      Welcome to ${data.appName}!
      
      Hi ${data.userName},
      
      Welcome to our platform! Get started by visiting: ${data.dashboardUrl}
    `,
  }),
};
```

### 3. Add Service Method

```typescript
// In email-service.ts
async sendWelcomeEmail(data: WelcomeEmailData & { to: string }): Promise<void> {
  const template = emailTemplates.welcome({
    userName: data.userName,
    appName: data.appName,
    dashboardUrl: data.dashboardUrl,
  });

  await this.sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
```

## Testing

### Test Email Functionality

You can test the email service by calling it directly in your code:

```typescript
import { emailService } from "../services/email";

// Test basic email sending
try {
  await emailService.testEmail("your-email@example.com");
  console.log("Test email sent successfully!");
} catch (error) {
  console.error("Email test failed:", error);
}
```

### Better Auth Integration Test

1. Sign up a new user through your application
2. Check that the verification email is received
3. Click the verification link to confirm it works
4. Test password reset functionality

## Template Customization

All email templates are located in `templates.ts` and can be customized:

### Styling Guidelines

- Use inline CSS for maximum email client compatibility
- Keep the design responsive
- Use web-safe fonts
- Test across different email clients

### Brand Customization

Update the templates to match your brand:

- Change colors in the inline styles
- Update the app name
- Add your logo
- Customize the messaging

## Error Handling

The email service includes comprehensive error handling:

```typescript
try {
  await emailService.sendVerificationEmail(emailData);
} catch (error) {
  console.error("Failed to send verification email:", error);
  // Handle the error appropriately
  // Maybe retry, log to monitoring service, etc.
}
```

## Monitoring and Logging

All email operations are logged with relevant information:

- Success messages include message ID and recipient
- Error messages include full error details
- Consider integrating with your monitoring solution

## Production Considerations

### Security

- Keep AWS credentials secure
- Use IAM roles in production instead of access keys
- Regularly rotate credentials
- Monitor SES usage and costs

### Performance

- Consider implementing email queues for high volume
- Monitor SES sending limits and quotas
- Implement retry logic for failed sends

### Compliance

- Ensure compliance with email regulations (CAN-SPAM, GDPR, etc.)
- Include unsubscribe links where required
- Maintain email delivery logs

## Troubleshooting

### Common Issues

1. **Emails not sending**:

   - Check AWS credentials
   - Verify SES configuration
   - Check email address/domain verification

2. **Emails going to spam**:

   - Set up SPF, DKIM, and DMARC records
   - Use verified domains
   - Monitor sender reputation

3. **Template rendering issues**:
   - Test templates across email clients
   - Validate HTML structure
   - Check for missing data

### Debug Mode

Enable debug logging by setting the log level in your environment or adding console.log statements in the email service methods.

## Future Enhancements

Potential improvements to consider:

- Email queue system for high volume
- Email template editor interface
- A/B testing for email templates
- Advanced analytics and tracking
- Multi-language template support
- Email scheduling capabilities
