import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
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
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";

interface ResetPasswordProps {
  token?: string;
}

export function ResetPassword({ token }: ResetPasswordProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ResetPasswordFormData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string>("");
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Check if token is present
    if (!token) {
      setGeneralError(
        "Invalid or missing reset token. Please request a new password reset."
      );
    }
  }, [token]);

  const handleInputChange = (
    field: keyof ResetPasswordFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Clear general error when user makes changes
    if (generalError && token) {
      setGeneralError("");
    }
  };

  const validateForm = (): boolean => {
    const result = resetPasswordSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ResetPasswordFormData, string>> =
        {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof ResetPasswordFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = error.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      // Keep form error for invalid token - this is a persistent state issue
      setGeneralError(
        "Invalid or missing reset token. Please request a new password reset."
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError(""); // Clear any previous token errors

    try {
      const response = await authClient.resetPassword({
        token: token,
        newPassword: formData.password,
      });

      setIsLoading(false);

      if (response.error) {
        const errorMessage =
          response.error.message || "Failed to reset password";
        // Don't set form error for auth failures - just show toast
        toast.error("Failed to reset password", {
          description: errorMessage,
        });
        return;
      }

      // Success - show success message
      toast.success("Password reset successful!", {
        description: "Your password has been updated. You can now sign in.",
      });
      setIsSuccess(true);
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      // Don't set form error for network failures - just show toast
      toast.error("Failed to reset password", {
        description: errorMessage,
      });
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-xl">Password reset successful</CardTitle>
          <CardDescription>
            Your password has been successfully updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button asChild className="w-full">
              <Link to="/signin">Sign in with new password</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set new password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {generalError && (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive border border-destructive/20">
              {generalError}
            </div>
          )}

          <FormField
            label="New password"
            type="password"
            placeholder="Create a secure password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            error={errors.password}
            hint="At least 8 characters with uppercase, lowercase, and number"
            disabled={isLoading || !token}
            required
            autoComplete="new-password"
          />

          <FormField
            label="Confirm new password"
            type="password"
            placeholder="Confirm your new password"
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            error={errors.confirmPassword}
            disabled={isLoading || !token}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !token}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Updating password..." : "Update password"}
          </Button>
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
