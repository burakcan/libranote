import { LocalDataService } from "@/lib/local-persistence/localDataService";
import { Collection, Note } from "@/lib/prisma";

/**
 * Sync a locally created collection to the server
 */
export async function syncCreateCollection(
  collectionId: string
): Promise<Collection | undefined> {
  const localCollection = await LocalDataService.getCollection(collectionId);

  if (!localCollection) {
    console.error(`SyncService: Collection ${collectionId} not found`);
    return;
  }

  const remoteCollection = await fetch("/api/collections", {
    method: "POST",
    body: JSON.stringify({
      id: localCollection.id,
      title: localCollection.title,
    }),
  }).then((res) => res.json());

  await LocalDataService.swapCollection(localCollection, remoteCollection);
  return remoteCollection;
}

/**
 * Sync collection deletion to the server
 */
export async function syncDeleteCollection(
  collectionId: string
): Promise<void> {
  await fetch(`/api/collections/${collectionId}`, { method: "DELETE" });
}

/**
 * Sync a locally created note to the server
 */
export async function syncCreateNote(
  noteId: string
): Promise<Note | undefined> {
  const localNote = await LocalDataService.getNote(noteId);

  if (!localNote) {
    console.error(`SyncService: Note ${noteId} not found`);
    return;
  }

  const remoteNote = await fetch("/api/notes", {
    method: "POST",
    body: JSON.stringify({
      id: localNote.id,
      title: localNote.title,
      description: localNote.description,
      collectionId: localNote.collectionId,
    }),
  }).then((res) => res.json());

  await LocalDataService.swapNote(localNote, remoteNote);
  return remoteNote;
}

/**
 * Sync note deletion to the server
 */
export async function syncDeleteNote(noteId: string): Promise<void> {
  await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
}

/**
 * Load remote data and sync it to local storage
 */
export async function syncRemoteToLocal(): Promise<Collection[]> {
  // Step 1: Fetch remote collections
  const remoteCollections: Collection[] = await fetch("/api/collections").then(
    (res) => res.json()
  );

  // Step 2: Update local db with remote data
  await Promise.all(
    remoteCollections.map((collection) =>
      LocalDataService.updateCollection(collection)
    )
  );

  return remoteCollections;
}

/**
 * Process a single queue item based on its type
 */
export async function processActionQueueItem(item: ActionQueue.Item) {
  switch (item.type) {
    case "CREATE_COLLECTION":
      return await syncCreateCollection(item.relatedEntityId);
    case "DELETE_COLLECTION":
      return await syncDeleteCollection(item.relatedEntityId);
    case "CREATE_NOTE":
      return await syncCreateNote(item.relatedEntityId);
    case "DELETE_NOTE":
      return await syncDeleteNote(item.relatedEntityId);
    default:
      console.error(`SyncService: Unknown queue item type: ${item.type}`);
  }
}
