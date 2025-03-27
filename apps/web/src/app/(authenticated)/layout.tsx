import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { auth } from "@/lib/auth/auth";

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
      <SyncProvider />
      {children}
    </StoreProvider>
  );
}
