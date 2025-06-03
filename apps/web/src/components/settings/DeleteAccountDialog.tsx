import { useForm } from "@tanstack/react-form";
import { ErrorContext } from "better-auth/react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAccountsListQuery } from "@/hooks/useAccountsListQuery";
import { useSessionQuery } from "@/hooks/useSessionQuery";
import { deleteAccountSchema } from "@/lib/auth-schemas";
import { authClient } from "@/lib/authClient";
import { FormField } from "../auth/FormField";

export function DeleteAccountDialog() {
  const sessionData = useSessionQuery();
  const email = sessionData.data?.user?.email;
  const { data: accounts } = useAccountsListQuery();

  const requirePassword = useMemo(() => {
    return accounts?.some((account) => account.provider === "credential");
  }, [accounts]);

  const showSuccessToast = useCallback(() => {
    toast.success("Account deletion request sent!", {
      description:
        "Please check your email for the verification link. You will be logged out...",
    });
  }, []);

  const form = useForm({
    defaultValues: {
      password: "",
    },
    validators: {
      onSubmit: requirePassword ? deleteAccountSchema : undefined,
    },
    onSubmit: async ({ value }) => {
      if (requirePassword) {
        await authClient.deleteUser({
          callbackURL: `${import.meta.env.VITE_PUBLIC_URL}/goodbye?email=${email}`,
          password: value.password,
          fetchOptions: {
            onSuccess: () => {
              showSuccessToast();
            },
            onError: (e: ErrorContext) => {
              toast.error("Failed to delete account", {
                description: e.error.message,
              });
            },
          },
        });
      } else {
        await authClient.deleteUser({
          callbackURL: `${import.meta.env.VITE_PUBLIC_URL}/goodbye?email=${email}`,
          fetchOptions: {
            onSuccess: () => {
              showSuccessToast();
            },
            onError: (e: ErrorContext) => {
              toast.error("Failed to send account deletion request", {
                description: e.error.message,
              });
            },
          },
        });
      }
    },
  });

  const isSubmitting = form.state.isSubmitting;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all of your data from our servers.
              {requirePassword && (
                <form.Field
                  name="password"
                  validators={{
                    onBlur: deleteAccountSchema.shape.password,
                  }}
                  children={(field) => (
                    <FormField
                      label="Enter your password to confirm"
                      type="password"
                      placeholder="********"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      error={
                        (field.state.meta.isTouched ||
                          form.state.isSubmitted) &&
                        field.state.meta.errors.length > 0
                          ? field.state.meta.errors[0]?.message
                          : undefined
                      }
                    />
                  )}
                />
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              type="submit"
              disabled={isSubmitting}
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
