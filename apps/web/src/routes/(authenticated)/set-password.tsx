import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export const Route = createFileRoute("/(authenticated)/set-password")({
  validateSearch: z.object({
    token: z.string(),
  }),

  component: RouteComponent,

  errorComponent: () => (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive border border-destructive/20">
          <p>Invalid or missing reset token.</p>
          <p>Please request a new password set email.</p>
          <Link
            to="/"
            className="underline underline-offset-4 hover:text-primary"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  ),
});

function RouteComponent() {
  const { token } = Route.useSearch();

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <SetPasswordForm token={token} />
      </div>
    </div>
  );
}
