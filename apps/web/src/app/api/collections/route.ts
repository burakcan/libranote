import { NextResponse } from "next/server";
import { auth } from "@/features/auth/auth";
import { getCollections } from "@/features/collections/db/collections.db";
import { createCollection } from "@/features/collections/db/createCollection.db";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const collections = await getCollections(session.user.id);

  return NextResponse.json(collections);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { title } = await req.json();

  const collection = await createCollection(session.user.id, title);

  return NextResponse.json(collection);
}
