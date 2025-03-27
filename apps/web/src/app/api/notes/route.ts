import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createNote, getNotes } from "@/lib/db/notes";
import { SSEServerService } from "@/lib/sync/SSEServerService";

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
    const notes = await getNotes(session.user.id, collectionId ?? undefined);

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
    const { title, description, collectionId, createdAt, updatedAt, isPublic } =
      body.note;
    const clientId = body.clientId;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!collectionId) {
      return NextResponse.json(
        { error: "Collection ID is required" },
        { status: 400 }
      );
    }

    // Create the note with preserved fields
    const note = await createNote({
      userId: session.user.id,
      collectionId,
      title,
      description: description || "",
      isPublic,
      createdAt: createdAt ? new Date(createdAt) : undefined,
      updatedAt: updatedAt ? new Date(updatedAt) : undefined,
    });

    SSEServerService.broadcastSSE(session.user.id, clientId, {
      type: "NOTE_CREATED",
      note,
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
