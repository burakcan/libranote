import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
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
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";

export function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    } as ForgotPasswordFormData,
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await authClient.forgetPassword({
          email: value.email,
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (response.error) {
          const errorMessage =
            response.error.message || "Failed to send reset email";
          toast.error("Failed to send reset email", {
            description: errorMessage,
          });
          return;
        }

        // Success - show success message
        toast.success("Reset email sent!", {
          description: `Check your inbox at ${value.email}`,
        });

        setSuccessEmail(value.email);
        setIsSuccess(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        toast.error("Failed to send reset email", {
          description: errorMessage,
        });
      }
    },
  });

  const isSubmitting = form.state.isSubmitting;

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We've sent a password reset link to {successEmail}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSuccess(false);
                setSuccessEmail("");
                form.reset();
              }}
            >
              Try again
            </Button>
            <div className="text-center text-sm">
              Back to{" "}
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

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Reset password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your
          password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid gap-4"
        >
          <form.Field
            name="email"
            validators={{
              onBlur: forgotPasswordSchema.shape.email,
            }}
            children={(field) => (
              <FormField
                label="Email"
                type="email"
                placeholder="m@example.com"
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
                autoComplete="email"
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
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            )}
          />
        </form>

        <div className="mt-6 text-center text-sm">
          Back to{" "}
          <Link
            to="/signin"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
