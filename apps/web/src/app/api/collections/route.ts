import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCollections, createCollection } from "@/lib/db/collection";
import { SSEServerService } from "@/lib/sync/SSEServerService";

// GET /api/collections - Get all collections for the current user
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collections = await getCollections(session.user.id);
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}

// POST /api/collections - Create a new collection
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, createdAt, updatedAt } = body.collection;
    const clientId = body.clientId;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create the collection with preserved timestamps if provided
    const collection = await createCollection({
      userId: session.user.id,
      title,
      ...(createdAt && { createdAt: new Date(createdAt) }),
      ...(updatedAt && { updatedAt: new Date(updatedAt) }),
    });

    SSEServerService.broadcastSSE(session.user.id, clientId, {
      type: "COLLECTION_CREATED",
      collection,
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
