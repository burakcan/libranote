import { useForm } from "@tanstack/react-form";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PasswordField } from "@/components/auth/FormField";
import { useChangePasswordMutation } from "@/hooks/useChangePasswordMutation";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/auth-schemas";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Extended form data that includes the revokeOtherSessions field
type ChangePasswordFormInput = ChangePasswordFormData & {
  revokeOtherSessions: boolean;
};

export function ChangePasswordForm({
  onSuccess,
  onCancel,
}: ChangePasswordFormProps) {
  const { mutate: changePassword } = useChangePasswordMutation();

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    } as ChangePasswordFormInput,
    onSubmit: async ({ value }) => {
      // Validate using the existing schema
      const validation = changePasswordSchema.safeParse({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        confirmPassword: value.confirmPassword,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error("Validation failed", {
          description: firstError?.message || "Please check your inputs",
        });
        return;
      }

      try {
        changePassword(
          {
            currentPassword: value.currentPassword,
            newPassword: value.newPassword,
            revokeOtherSessions: value.revokeOtherSessions,
          },
          {
            onSuccess: () => {
              toast.success("Password changed successfully!");
              form.reset();
              onSuccess?.();
            },
            onError: (error: Error) => {
              let errorMessage = "Failed to change password. Please try again.";

              // Handle specific error cases
              if (error.message.toLowerCase().includes("current password")) {
                errorMessage =
                  "Current password is incorrect. Please try again.";
              } else if (error.message.toLowerCase().includes("password")) {
                errorMessage = error.message;
              } else if (error.message) {
                errorMessage = error.message;
              }

              toast.error("Failed to change password", {
                description: errorMessage,
              });
            },
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";

        toast.error("Failed to change password", {
          description: errorMessage,
        });
      }
    },
  });

  // Access the base schema for individual field validation
  const baseSchema = changePasswordSchema._def.schema._def.schema;
  const isSubmitting = form.state.isSubmitting;

  const handleReset = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="currentPassword"
        validators={{
          onBlur: baseSchema.shape.currentPassword,
        }}
        children={(field) => (
          <PasswordField
            label="Current Password"
            placeholder="Enter your current password"
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

      <form.Field
        name="newPassword"
        validators={{
          onBlur: baseSchema.shape.newPassword,
        }}
        children={(field) => (
          <PasswordField
            label="New Password"
            placeholder="Enter your new password"
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
              baseSchema.shape.confirmPassword.safeParse(value);
            if (!fieldResult.success) {
              return fieldResult.error.errors[0];
            }

            // Check if passwords match
            const newPasswordValue = fieldApi.form.getFieldValue("newPassword");
            if (newPasswordValue && value !== newPasswordValue) {
              return {
                message: "Passwords don't match",
              };
            }

            return undefined;
          },
        }}
        children={(field) => (
          <PasswordField
            label="Confirm New Password"
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
            disabled={isSubmitting}
            required
            autoComplete="new-password"
          />
        )}
      />

      <form.Field
        name="revokeOtherSessions"
        children={(field) => (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="revoke-sessions"
                  className="text-sm font-medium"
                >
                  Sign out other devices
                </Label>
                <p className="text-xs text-muted-foreground">
                  This will log you out from all other devices and browsers.
                </p>
              </div>
              <Switch
                id="revoke-sessions"
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
                disabled={isSubmitting}
              />
            </div>

            {field.state.value && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You will be logged out from all other devices. Any unsaved
                  changes on those devices will be lost.
                </p>
              </div>
            )}
          </div>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Changing Password...
            </>
          ) : (
            "Change Password"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
