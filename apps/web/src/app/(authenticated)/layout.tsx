import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/auth";
import { StoreProvider } from "@/features/core/StoreProvider";
import { SyncManager } from "@/features/core/SyncManager";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/signin");
  }

  return (
    <StoreProvider user={session.user}>
      <SyncManager />
      {children}
    </StoreProvider>
  );
}
