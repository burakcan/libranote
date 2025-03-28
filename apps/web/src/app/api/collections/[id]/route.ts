import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { deleteCollection, updateCollection } from "@/lib/db/collection";
import { SSEServerService } from "@/lib/sync/SSEServerService";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collectionId = (await params).id;
    const {
      collection,
      clientId,
    }: { collection: ClientCollection; clientId: string } = await req.json();

    if (collectionId !== collection.id) {
      return NextResponse.json(
        { error: "Collection ID mismatch" },
        { status: 400 }
      );
    }

    await updateCollection(collection);

    SSEServerService.broadcastSSE(session.user.id, clientId, {
      type: "COLLECTION_UPDATED",
      collection,
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json(
      { error: "Failed to update collection" },
      { status: 500 }
    );
  }
}

// DELETE /api/collections/[id] - Delete a collection
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const collectionId = (await params).id;
    const body = await req.json();
    const clientId = body.clientId;

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    await deleteCollection(collectionId);

    SSEServerService.broadcastSSE(session.user.id, clientId, {
      type: "COLLECTION_DELETED",
      collectionId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
