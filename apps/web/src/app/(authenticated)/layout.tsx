import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { QUERY_KEY as JWT_QUERY_KEY } from "@/query/useJWT";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
    asResponse: true,
  });

  let jwt;
  try {
    await session.json();
    jwt = session.headers.get("set-auth-jwt");
  } catch (e) {
    redirect("/");
  }

  const queryClient = new QueryClient();

  await queryClient.fetchQuery({
    queryKey: JWT_QUERY_KEY,
    queryFn: async () => jwt
  });

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      {children}
    </HydrationBoundary>
  );
}
