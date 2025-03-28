import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { SSEServerService } from "@/lib/sync/SSEServerService";

// DELETE /api/notes/[id] - Delete a note
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
    const noteId = (await params).id;
    const body: { clientId: string } = await req.json();
    const clientId = body.clientId;

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    // Check if the user has permission to delete this note
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        noteCollaborators: {
          where: {
            userId: session.user.id,
            canEdit: true,
          },
        },
      },
    });

    SSEServerService.broadcastSSE(session.user.id, clientId, {
      type: "NOTE_DELETED",
      noteId,
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only the owner or a collaborator with edit permissions can delete
    if (
      note.ownerId !== session.user.id &&
      note.noteCollaborators.length === 0
    ) {
      return NextResponse.json(
        { error: "Unauthorized to delete this note" },
        { status: 403 }
      );
    }

    // Delete the note
    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
