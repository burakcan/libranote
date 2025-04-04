import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const App = () => {
  return <RouterProvider router={router} context={{ queryClient }} />;
};

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  );
}
