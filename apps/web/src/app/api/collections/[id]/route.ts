import { NextRequest, NextResponse } from "next/server";
import { SSEServerService } from "@/lib/sync/sseServerService";
import { auth } from "@/features/auth/auth";
import { deleteCollection } from "@/features/collections/collections.db";

// DELETE /api/collections/[id] - Delete a collection
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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
