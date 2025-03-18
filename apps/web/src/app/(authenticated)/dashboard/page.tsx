import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{session?.user?.email}</p>
      <pre>{JSON.stringify(organization, null, 2)}</pre>
      <button
        onClick={async () => {
          "use server";

          await auth.api.signOut({
            headers: await headers(),
          });

          redirect("/signin");
        }}
      >
        SignOut
      </button>
    </div>
  );
}
