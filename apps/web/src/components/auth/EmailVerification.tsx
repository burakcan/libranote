import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail, Timer } from "lucide-react";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { invalidateSessionQuery } from "@/hooks/useSessionQuery";
import {
  emailVerificationSchema,
  type EmailVerificationFormData,
} from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";

interface EmailVerificationProps {
  email: string;
}

export function EmailVerification({ email }: EmailVerificationProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const form = useForm({
    defaultValues: {
      otp: "",
    } as EmailVerificationFormData,
    validators: {
      onSubmit: emailVerificationSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        // Only verify email with OTP - this should auto-login the user
        const response = await authClient.emailOtp.verifyEmail({
          email: email,
          otp: value.otp,
        });

        if (response.error) {
          const errorMessage =
            response.error.message || "Invalid verification code";

          // Check for max attempts exceeded
          if (response.error.code === "TOO_MANY_ATTEMPTS") {
            toast.error("Too many failed attempts", {
              description:
                "Please request a new verification code after the cooldown period.",
            });

            form.reset();
            return;
          }

          // Check for expired code
          if (
            response.error.code === "INVALID_OTP" ||
            response.error.code === "EXPIRED_OTP"
          ) {
            toast.error("Code expired or invalid", {
              description: "Please request a new verification code.",
            });
            form.reset();
            return;
          }

          // Generic error
          toast.error("Verification failed", {
            description: errorMessage,
          });
          form.reset();
          return;
        }

        // Success - Better Auth should auto-login after email verification
        toast.success("Email verified successfully!", {
          description: "Welcome! You're now signed in.",
        });

        // Invalidate session to get the new authenticated state
        invalidateSessionQuery(queryClient);

        // Navigate to notes after successful verification
        navigate({ to: "/notes" });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        toast.error("Verification failed", {
          description: errorMessage,
        });
        form.reset();
      }
    },
  });

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);

    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "email-verification",
      });

      setIsResending(false);

      if (response.error) {
        toast.error("Failed to send verification code", {
          description: response.error.message,
        });
        return;
      }

      // Set cooldown
      const now = Date.now();
      const lastSentKey = `otp_last_sent_${email}`;
      localStorage.setItem(lastSentKey, now.toString());
      setResendCooldown(15 * 60); // 15 minutes

      toast.success("Verification code sent!", {
        description: `A new code has been sent to ${email}`,
      });
    } catch (error) {
      setIsResending(false);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send code";
      toast.error("Failed to send verification code", {
        description: errorMessage,
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Initialize cooldown if there's a stored timestamp
  useEffect(() => {
    const lastSentKey = `otp_last_sent_${email}`;
    const lastSent = localStorage.getItem(lastSentKey);

    if (lastSent) {
      const lastSentTime = parseInt(lastSent);
      const now = Date.now();
      const elapsed = now - lastSentTime;
      const cooldownTime = 15 * 60 * 1000; // 15 minutes

      if (elapsed < cooldownTime) {
        setResendCooldown(Math.ceil((cooldownTime - elapsed) / 1000));
      } else {
        localStorage.removeItem(lastSentKey);
      }
    }
  }, [email]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const isSubmitting = form.state.isSubmitting;

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">Verify your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to {email} to verify your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="otp"
              validators={{
                onBlur: emailVerificationSchema.shape.otp,
              }}
              children={(field) => (
                <div className="space-y-2">
                  <label className="block text-sm text-center font-medium">
                    Verification code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={field.state.value}
                      onChange={(value) => {
                        field.handleChange(value);
                        // Auto-submit when OTP is complete
                        if (value.length === 6) {
                          setTimeout(() => form.handleSubmit(), 100);
                        }
                      }}
                      onBlur={field.handleBlur}
                      disabled={isSubmitting}
                      autoComplete="one-time-code"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {(field.state.meta.isTouched || form.state.isSubmitted) &&
                    field.state.meta.errors.length > 0 && (
                      <p
                        className="text-sm text-destructive text-center"
                        role="alert"
                      >
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  {isSubmitting && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </div>
                  )}
                </div>
              )}
            />
          </form>

          <div className="space-y-4">
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={isResending || resendCooldown > 0}
                className="text-sm"
              >
                {isResending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {resendCooldown > 0 ? (
                  <>
                    <Timer className="mr-2 h-4 w-4" />
                    Resend code in {formatTime(resendCooldown)}
                  </>
                ) : (
                  "Resend verification code"
                )}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Wrong email address?{" "}
              <Link
                to="/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                Go back
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
