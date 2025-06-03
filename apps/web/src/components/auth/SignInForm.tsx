import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
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
import { SupportedSocialProvider } from "./constants";
import { Route as AuthRoute } from "@/routes/(auth)/route";

export function SignInForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchParams = AuthRoute.useSearch();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as SignInFormData,
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        const response = await authClient.signIn.email({
          email: value.email,
          password: value.password,
        });

        if (response.error) {
          const errorMessage = response.error.message || "Failed to sign in";

          // Check if email verification is required
          if (response.error.code === "EMAIL_NOT_VERIFIED") {
            // Send a new verification email and redirect to verification page
            try {
              await authClient.emailOtp.sendVerificationOtp({
                email: value.email,
                type: "email-verification",
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
              return;
            } catch {
              // If sending verification email fails, show a helpful error
              toast.error("Email verification required", {
                description:
                  "Please verify your email address. If you didn't receive the verification email, try signing up again.",
              });
              return;
            }
          }

          // Regular sign-in error
          toast.error("Failed to sign in", {
            description: errorMessage,
          });

          return;
        }

        // Success - show success toast and invalidate session
        toast.success("Signed in successfully!");

        invalidateSessionQuery(queryClient);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        toast.error("Failed to sign in", {
          description: errorMessage,
        });
      }
    },
  });

  const isSubmitting = form.state.isSubmitting;

  const handleSignInSocial = async (provider: SupportedSocialProvider) => {
    const response = await authClient.signIn.social({
      provider,
      callbackURL: searchParams.redirectTo
        ? `${import.meta.env.VITE_PUBLIC_URL}${searchParams.redirectTo}`
        : `${import.meta.env.VITE_PUBLIC_URL}/notes`,
    });

    if (response.error) {
      toast.error("Failed to sign in", {
        description: response.error.message,
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
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => handleSignInSocial("github")}
            >
              <FaGithub /> Sign in with GitHub
            </Button>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => handleSignInSocial("google")}
            >
              <FaGoogle />
              Sign in with Google
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
              name="email"
              validators={{
                onBlur: signInSchema.shape.email,
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
              <form.Field
                name="password"
                validators={{
                  onBlur: signInSchema.shape.password,
                }}
                children={(field) => (
                  <FormField
                    label=""
                    id="password"
                    type="password"
                    placeholder="Enter your password"
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
                    autoComplete="current-password"
                  />
                )}
              />
            </div>

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
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              )}
            />
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
