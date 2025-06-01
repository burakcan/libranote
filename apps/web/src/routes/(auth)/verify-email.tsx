import { createFileRoute, redirect } from "@tanstack/react-router";
import { EmailVerification } from "@/components/auth/EmailVerification";

export const Route = createFileRoute("/(auth)/verify-email")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    email?: string;
  } => {
    return {
      email: typeof search.email === "string" ? search.email : undefined,
    };
  },

  beforeLoad: ({ search }) => {
    // Redirect to signup if no email is provided
    if (!search.email) {
      throw redirect({
        to: "/signup",
      });
    }
  },

  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();

  return <EmailVerification email={search.email!} />;
}
