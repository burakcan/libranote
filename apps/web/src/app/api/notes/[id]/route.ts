import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/features/auth/auth";

// DELETE /api/notes/[id] - Delete a note
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
    const noteId = params.id;

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
