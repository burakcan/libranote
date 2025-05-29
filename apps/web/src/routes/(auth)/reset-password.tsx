import { createFileRoute } from "@tanstack/react-router";
import { ResetPassword } from "@/components/auth/ResetPassword";

export const Route = createFileRoute("/(auth)/reset-password")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    token: search.token as string | undefined,
  }),
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return <ResetPassword token={token} />;
}
