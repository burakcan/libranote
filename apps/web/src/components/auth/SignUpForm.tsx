import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormField } from "@/components/auth/FormField";
import { signUpSchema, type SignUpFormData } from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";

export function SignUpForm() {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as SignUpFormData,
    validators: {
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: value.name,
          onboardingFinished: false,
        });

        if (response.error) {
          const errorMessage =
            response.error.message || "Failed to create account";

          toast.error("Failed to create account", {
            description: errorMessage,
          });
          return;
        }

        // Success - show success toast and redirect to email verification
        toast.success("Account created successfully!", {
          description: "Please check your email for a verification code.",
        });

        // Store the timestamp for resend cooldown
        const now = Date.now();
        const lastSentKey = `otp_last_sent_${value.email}`;
        localStorage.setItem(lastSentKey, now.toString());

        // Redirect to email verification page
        navigate({
          to: "/verify-email",
          search: {
            email: value.email,
          },
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        toast.error("Failed to create account", {
          description: errorMessage,
        });
      }
    },
  });

  const isSubmitting = form.state.isSubmitting;
  const signupSchemaBeforeEffects = signUpSchema._def.schema;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign up</CardTitle>
        <CardDescription>Create an account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" type="button" disabled>
              Sign up with Apple
            </Button>
            <Button variant="outline" className="w-full" type="button" disabled>
              Sign up with Google
            </Button>
          </div>

          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-card text-muted-foreground relative z-10 px-2">
              Continue with email
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="grid gap-4"
          >
            <form.Field
              name="name"
              validators={{
                onBlur: signupSchemaBeforeEffects.shape.name,
              }}
              children={(field) => (
                <FormField
                  label="Name"
                  type="text"
                  placeholder="John Doe"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    (field.state.meta.isTouched || form.state.isSubmitted) &&
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]?.message
                      : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
              )}
            />

            <form.Field
              name="email"
              validators={{
                onBlur: signupSchemaBeforeEffects.shape.email,
              }}
              children={(field) => (
                <FormField
                  label="Email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    (field.state.meta.isTouched || form.state.isSubmitted) &&
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]?.message
                      : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
              )}
            />

            <form.Field
              name="password"
              validators={{
                onBlur: signupSchemaBeforeEffects.shape.password,
              }}
              children={(field) => (
                <FormField
                  label="Password"
                  type="password"
                  placeholder="Create a secure password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    (field.state.meta.isTouched || form.state.isSubmitted) &&
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]?.message
                      : undefined
                  }
                  hint="At least 8 characters with uppercase, lowercase, and number"
                  disabled={isSubmitting}
                  required
                />
              )}
            />

            <form.Field
              name="confirmPassword"
              validators={{
                onBlur: ({ value, fieldApi }) => {
                  // First validate the field itself
                  const fieldResult =
                    signupSchemaBeforeEffects.shape.confirmPassword.safeParse(
                      value
                    );
                  if (!fieldResult.success) {
                    return fieldResult.error.errors[0];
                  }

                  // Then check if passwords match
                  const passwordValue = fieldApi.form.getFieldValue("password");
                  if (passwordValue && value !== passwordValue) {
                    return {
                      message: "Passwords don't match",
                    };
                  }

                  return undefined;
                },
              }}
              children={(field) => (
                <FormField
                  label="Confirm password"
                  type="password"
                  placeholder="Confirm your password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    (field.state.meta.isTouched || form.state.isSubmitted) &&
                    field.state.meta.errors.length > 0
                      ? field.state.meta.errors[0]?.message
                      : undefined
                  }
                  disabled={isSubmitting}
                  required
                />
              )}
            />

            <form.Subscribe
              selector={(formState) => [
                formState.canSubmit,
                formState.isSubmitting,
              ]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? "Creating account..." : "Sign up"}
                </Button>
              )}
            />
          </form>

          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign in
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
