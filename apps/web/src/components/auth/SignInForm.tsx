import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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
import { invalidateSessionQuery } from "@/hooks/useSessionQuery";
import { signInSchema, type SignInFormData } from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";

export function SignInForm() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignInFormData, string>>
  >({});
  const [generalError, setGeneralError] = useState<string>("");
  const [formData, setFormData] = useState<SignInFormData>({
    email: "",
    password: "",
  });

  const handleInputChange = (field: keyof SignInFormData, value: string) => {
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
    const result = signInSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignInFormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof SignInFormData;
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
      const response = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      setIsLoading(false);

      if (response.error) {
        const errorMessage = response.error.message || "Failed to sign in";
        // Don't set form error for auth failures - just show toast
        toast.error("Failed to sign in", {
          description: errorMessage,
        });
        return;
      }

      // Success - show success toast and invalidate session
      toast.success("Signed in successfully!", {
        description: "Welcome back!",
      });
      invalidateSessionQuery(queryClient);
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      // Don't set form error for network failures - just show toast
      toast.error("Failed to sign in", {
        description: errorMessage,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {/* OAuth Buttons - keeping as requested */}
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" type="button" disabled>
              Sign in with Apple
            </Button>
            <Button variant="outline" className="w-full" type="button" disabled>
              Sign in with Google
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
              label="Email"
              type="email"
              placeholder="m@example.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={errors.email}
              disabled={isLoading}
              required
              autoComplete="email"
            />

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-primary"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <FormField
                label=""
                id="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                error={errors.password}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
