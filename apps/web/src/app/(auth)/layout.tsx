import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/auth";
import { AuthWrapper } from "@/features/auth/AuthWrapper";

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
