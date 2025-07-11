import "@/styles/fonts";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import SWReloadPrompt from "@/components/swReloadPrompt/SWReloadPrompt";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/lib/router";

TimeAgo.addDefaultLocale(en);

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const App = () => {
  return <RouterProvider router={router} />;
};

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <TooltipProvider>
        <Toaster />
        <SWReloadPrompt />
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </TooltipProvider>
    </StrictMode>
  );
}
