import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { createNote } from "@/features/notes/db/createNote.db";

// GET /api/notes - Get all notes for the current user
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get collection ID from query params if it exists
    const url = new URL(req.url);
    const collectionId = url.searchParams.get("collectionId");

    // Query for notes
    const notes = await prisma.note.findMany({
      where: {
        ...(collectionId ? { collectionId } : {}),
        OR: [
          { ownerId: session.user.id },
          {
            noteCollaborators: {
              some: { userId: session.user.id },
            },
          },
        ],
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, collectionId } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    // Create the note
    const note = await createNote(
      session.user.id,
      collectionId,
      title,
      content || ""
    );

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
