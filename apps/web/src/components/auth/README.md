# Authentication System

This directory contains the complete authentication system for the application, built with Better Auth and featuring comprehensive validation, error handling, and user feedback.

## Features

### ✅ Implemented

- **Email/Password Authentication** - Sign up, sign in, and password reset
- **Form Validation** - Client-side validation with Zod schemas
- **Error Handling** - Comprehensive error messages and user feedback
- **Loading States** - Visual feedback during auth operations
- **Toast Notifications** - Success/error notifications with Sonner
- **Responsive Design** - Clean, accessible forms with Tailwind CSS
- **Type Safety** - Full TypeScript support with proper types
- **Security** - Password strength requirements and validation
- **Accessibility** - ARIA labels and proper form semantics

### 🚧 Ready for OAuth (when needed)

- **Social Sign-in Buttons** - Apple and Google buttons (currently disabled)
- **Extensible Architecture** - Easy to add OAuth providers later

## Components

### Core Components

#### `SignUpForm.tsx`

- Email/password registration
- Name, email, password, and password confirmation
- Real-time validation and error display
- Password strength requirements
- Success/error toast notifications

#### `SignInForm.tsx`

- Email/password authentication
- "Forgot password" link integration
- Form validation and error handling
- Loading states and user feedback

#### `ForgotPassword.tsx`

- Password reset email request
- Email validation
- Success confirmation with retry option
- Clear user instructions

#### `ResetPassword.tsx`

- New password setting from email link
- Token validation
- Password confirmation matching
- Success redirect to sign-in

#### `FormField.tsx`

- Reusable form field component
- Consistent styling and error display
- ARIA accessibility support
- Error and hint text display

### Utility Files

#### `auth-schemas.ts`

- Zod validation schemas for all auth forms
- Password strength requirements
- Email validation
- TypeScript type exports

## Error Handling

The system uses a two-tier error handling approach:

### Toast Notifications (Transient Errors)

Used for auth and network errors that are temporary and user-actionable:

```tsx
const response = await authClient.signIn.email({ email, password });

if (response.error) {
  // Show toast for auth failures (wrong password, network issues, etc.)
  toast.error("Failed to sign in", {
    description: response.error.message,
  });
  return;
}

// Show success toast
toast.success("Signed in successfully!");
invalidateSessionQuery(queryClient);
```

### Form Errors (Persistent Issues)

Used for validation errors and persistent state issues:

```tsx
// Validation errors - shown inline with fields
const result = signInSchema.safeParse(formData);
if (!result.success) {
  setErrors(fieldErrors); // Shows red border and error text under fields
  return;
}

// Persistent state issues - shown as form alert
if (!token) {
  setGeneralError("Invalid or missing reset token."); // Shows red alert in form
  return;
}
```

### Error Categories

- **Toast Errors**: Wrong credentials, network failures, server errors, rate limiting
- **Form Errors**: Required fields, invalid email format, password requirements, missing tokens
- **Field Errors**: Individual input validation (email format, password strength, etc.)

## Usage

### Basic Implementation

```tsx
import { SignUpForm } from "@/components/auth/SignUpForm";
import { SignInForm } from "@/components/auth/SignInForm";
import { ForgotPassword } from "@/components/auth/ForgotPassword";

// In your route components
export function SignUpPage() {
  return <SignUpForm />;
}
```

### Adding to Routes

The auth components are designed to work with TanStack Router:

```tsx
// apps/web/src/routes/(auth)/signup.tsx
import { createFileRoute } from "@tanstack/react-router";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const Route = createFileRoute("/(auth)/signup")({
  component: () => <SignUpForm />,
});
```

## Validation Rules

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Email Requirements

- Valid email format
- Required field

### Name Requirements

- Minimum 2 characters
- Maximum 50 characters
- Required field

## Recent Updates

### v2.1 - Improved Error UX

- **Fixed double error display** - No more redundant toast + form error
- **Toast-only for auth errors** - Better UX for transient failures
- **Form errors for validation** - Persistent display for input issues
- **Fixed forgot password route** - Now properly loads ForgotPassword component

### v2.0 - Direct Better Auth Integration

- Removed `auth-utils.ts` wrapper functions
- Now handles Better Auth responses directly
- Improved error handling accuracy
- Updated forgot password redirect URL to use full URL

## Styling

- Built with **Tailwind CSS** for responsive design
- Uses **Shadcn/ui** components for consistency
- **Dark/light mode** support through CSS variables
- **Mobile-responsive** forms and layouts
- **Loading states** with spinners and disabled inputs

## Future Enhancements

When ready to add OAuth:

1. Enable the OAuth buttons in the form components
2. Configure Better Auth with OAuth providers
3. Add provider-specific error handling
4. Update validation schemas if needed

## Dependencies

- **Better Auth** - Authentication framework
- **Zod** - Schema validation
- **TanStack Router** - Routing and navigation
- **Sonner** - Toast notifications
- **Lucide React** - Icons
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
