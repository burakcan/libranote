import { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import React from "react";
import { NetworkStatusProvider } from "@/components/providers/NetworkStatusProvider";

interface RootContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <NetworkStatusProvider>
        <Outlet />
      </NetworkStatusProvider>
    </React.Fragment>
  );
}
