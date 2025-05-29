import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { CollectionListContextProvider } from "@/components/collections/CollectionListContext";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { queryOptions as sessionQueryOptions } from "@/hooks/useSessionQuery";
import { userDatabaseService } from "@/services/db/userDatabaseService";

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

    await userDatabaseService.initialize(sessionData.user.id);

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
        <CollectionListContextProvider>
          <Outlet />
        </CollectionListContextProvider>
      </SyncProvider>
    </StoreProvider>
  );
}
