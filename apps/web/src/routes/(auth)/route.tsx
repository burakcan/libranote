import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  queryOptions as sessionQueryOptions,
  useSessionQuery,
} from "@/hooks/useSessionQuery";

export const Route = createFileRoute("/(auth)")({
  validateSearch: (
    search: Record<string, unknown>
  ): { redirectTo?: string } => {
    return {
      redirectTo: String(search.redirectTo ?? "/notes"),
    };
  },

  beforeLoad: async ({ search, context }) => {
    const sessionData =
      await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (sessionData) {
      throw redirect({
        to: search.redirectTo,
      });
    }
  },

  pendingComponent: () => <div>Loading...</div>,
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: session } = useSessionQuery();

  useEffect(() => {
    if (search.redirectTo && session) {
      navigate({
        to: search.redirectTo,
      });
    }
  }, [search.redirectTo, session, navigate]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
