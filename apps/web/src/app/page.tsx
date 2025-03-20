import { prisma } from "@/lib/prisma";

export default async function Home() {
  const users = await prisma.note.findMany();

  return <div>{JSON.stringify(users)}</div>;
}
