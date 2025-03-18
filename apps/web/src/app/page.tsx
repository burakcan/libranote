import { prisma } from "@repo/db";

export default async function Home() {
  const users = await prisma.note.findMany();

  return <div>{JSON.stringify(users)}</div>;
}
