import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { CollectionListContextProvider } from "@/components/collections/CollectionListContext";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { useLogout } from "@/hooks/useLogout";
import {
  queryOptions as sessionQueryOptions,
  useSessionQuery,
} from "@/hooks/useSessionQuery";
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
  const { data: session } = useSessionQuery();
  const { mutate: logout } = useLogout();
  const { userId } = Route.useRouteContext();

  useEffect(() => {
    if (!session) {
      logout();
    }
  }, [session, logout]);

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
