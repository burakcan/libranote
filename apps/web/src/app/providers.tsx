"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

let browserQueryClient: QueryClient | undefined = undefined;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
      }
    }
  });
}

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important so we don't re-make a new client if React
    // supsends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export default function Providers(props: PropsWithChildren) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableColorScheme
        enableSystem
        disableTransitionOnChange
      >
        <NextIntlClientProvider locale="en">{props.children}</NextIntlClientProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}