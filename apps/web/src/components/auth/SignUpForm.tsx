import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
import { signUpSchema, type SignUpFormData } from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";

export function SignUpForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignUpFormData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string>("");
  const [formData, setFormData] = useState<SignUpFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Clear general error when user makes changes
    if (generalError) {
      setGeneralError("");
    }
  };

  const validateForm = (): boolean => {
    const result = signUpSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignUpFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof SignUpFormData;
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      const response = await authClient.signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      setIsLoading(false);

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
      const lastSentKey = `otp_last_sent_${formData.email}`;
      localStorage.setItem(lastSentKey, now.toString());

      // Redirect to email verification page
      navigate({
        to: "/verify-email",
        search: {
          email: formData.email,
          type: "email-verification",
        },
      });
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to create account", {
        description: errorMessage,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign up</CardTitle>
        <CardDescription>Create an account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* OAuth Buttons - keeping as requested */}
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

          <form onSubmit={handleSubmit} className="grid gap-4">
            {generalError && (
              <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive border border-destructive/20">
                {generalError}
              </div>
            )}

            <FormField
              label="Name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={errors.name}
              disabled={isLoading}
              required
            />

            <FormField
              label="Email"
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={errors.email}
              disabled={isLoading}
              required
            />

            <FormField
              label="Password"
              type="password"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              error={errors.password}
              hint="At least 8 characters with uppercase, lowercase, and number"
              disabled={isLoading}
              required
            />

            <FormField
              label="Confirm password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              error={errors.confirmPassword}
              disabled={isLoading}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
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
