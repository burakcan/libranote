import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { queryOptions as sessionQueryOptions } from "@/hooks/useSessionQuery";

export const Route = createFileRoute("/(authenticated)")({
  beforeLoad: async ({ location, context }) => {
    const sessionData =
      await context.queryClient.ensureQueryData(sessionQueryOptions);

    if (!sessionData) {
      throw redirect({
        to: "/signin",
        search: {
          redirectTo: location.href,
        },
      });
    }

    return {
      userId: sessionData.user.id,
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useRouteContext();

  return (
    <StoreProvider userId={userId}>
      <SyncProvider>
        <Outlet />
      </SyncProvider>
    </StoreProvider>
  );
}
