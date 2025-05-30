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
import { authClient } from "@/lib/authClient";

interface EmailVerificationProps {
  email: string;
  type?: "email-verification" | "sign-in";
}

export function EmailVerification({
  email,
  type = "email-verification",
}: EmailVerificationProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [generalError, setGeneralError] = useState<string>("");
  const [otpValue, setOtpValue] = useState("");

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

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otpValue.length === 6) {
      handleSubmit();
    }
  }, [otpValue]);

  const handleSubmit = async () => {
    if (otpValue.length !== 6) {
      return;
    }

    setIsLoading(true);
    setGeneralError("");

    try {
      let response;

      if (type === "sign-in") {
        // Sign in with OTP
        response = await authClient.signIn.emailOtp({
          email: email,
          otp: otpValue,
        });
      } else {
        // Verify email with OTP - this should auto-login the user
        response = await authClient.emailOtp.verifyEmail({
          email: email,
          otp: otpValue,
        });
      }

      setIsLoading(false);

      if (response.error) {
        const errorMessage =
          response.error.message || "Invalid verification code";

        // Check for max attempts exceeded
        if (
          response.error.status === 429 ||
          errorMessage.includes("MAX_ATTEMPTS_EXCEEDED") ||
          errorMessage.includes("maximum attempts")
        ) {
          setGeneralError(
            "Too many failed attempts. Please request a new verification code."
          );
          setOtpValue(""); // Clear the OTP input
          return;
        }

        // Check for expired code
        if (
          errorMessage.includes("expired") ||
          errorMessage.includes("invalid")
        ) {
          setGeneralError(
            "Verification code has expired or is invalid. Please request a new code."
          );
          setOtpValue(""); // Clear the OTP input
          return;
        }

        // Generic error
        setGeneralError(errorMessage);
        setOtpValue(""); // Clear the OTP input
        return;
      }

      // Success - Better Auth OTP should auto-login after verification
      toast.success(
        type === "sign-in"
          ? "Signed in successfully!"
          : "Email verified successfully!",
        {
          description:
            type === "sign-in"
              ? "Welcome back!"
              : "Your account has been verified.",
        }
      );

      // Invalidate session to get the new authenticated state
      invalidateSessionQuery(queryClient);

      // Navigate to notes after successful verification
      navigate({ to: "/notes" });
    } catch (error) {
      setIsLoading(false);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      setGeneralError(errorMessage);
      setOtpValue(""); // Clear the OTP input
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setIsResending(true);
    setGeneralError("");

    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: type,
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

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">
          {type === "sign-in" ? "Enter verification code" : "Verify your email"}
        </CardTitle>
        <CardDescription>
          {type === "sign-in"
            ? `Enter the 6-digit code sent to ${email} to sign in`
            : `Enter the 6-digit code sent to ${email} to verify your account`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          {generalError && (
            <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive border border-destructive/20">
              {generalError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Verification code</label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                disabled={isLoading}
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
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </div>
            )}
          </div>

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
