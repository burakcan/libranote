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
  setPasswordSchema,
  type SetPasswordFormData,
} from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";

interface SetPasswordFormProps {
  token?: string;
}

export function SetPasswordForm({ token }: SetPasswordFormProps = {}) {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm({
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    } as SetPasswordFormData,
    validators: {
      onSubmit: setPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await authClient.resetPassword({
          token: value.token,
          newPassword: value.password,
        });

        if (response.error) {
          const errorMessage =
            response.error.message || "Failed to set password";

          toast.error("Failed to set password", {
            description: errorMessage,
          });
          return;
        }

        // Success - show success message
        toast.success("Password set successful!", {
          description:
            "Your password has been created. You can now sign in with your email and password.",
        });
        setIsSuccess(true);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        toast.error("Failed to reset password", {
          description: errorMessage,
        });
      }
    },
  });

  const resetPasswordSchemaBeforeEffects = setPasswordSchema._def.schema;
  const isSubmitting = form.state.isSubmitting;

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Password set successful</CardTitle>
          <CardDescription>
            Your password has been successfully created. You can now sign in
            with your email and password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button asChild className="w-full">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
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
          {!token && (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive border border-destructive/20">
              Invalid or missing reset token. Please request a new password set
              email.
            </div>
          )}

          <form.Field
            name="password"
            validators={{
              onBlur: resetPasswordSchemaBeforeEffects.shape.password,
            }}
            children={(field) => (
              <FormField
                label="New password"
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
                disabled={isSubmitting || !token}
                required
                autoComplete="new-password"
              />
            )}
          />

          <form.Field
            name="confirmPassword"
            validators={{
              onBlur: ({ value, fieldApi }) => {
                // First validate the field itself
                const fieldResult =
                  resetPasswordSchemaBeforeEffects.shape.confirmPassword.safeParse(
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
                label="Confirm new password"
                type="password"
                placeholder="Confirm your new password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={
                  (field.state.meta.isTouched || form.state.isSubmitted) &&
                  field.state.meta.errors.length > 0
                    ? field.state.meta.errors[0]?.message
                    : undefined
                }
                disabled={isSubmitting || !token}
                required
                autoComplete="new-password"
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
                disabled={!canSubmit || isSubmitting || !token}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Setting password..." : "Set password"}
              </Button>
            )}
          />
        </form>
      </CardContent>
    </Card>
  );
}
