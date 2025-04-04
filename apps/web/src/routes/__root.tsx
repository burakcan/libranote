import { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import React from "react";

interface RootContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RootContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  );
}
