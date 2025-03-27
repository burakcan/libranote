import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { auth } from "@/lib/auth/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/notes");
  }

  return <AuthWrapper>{children}</AuthWrapper>;
}
