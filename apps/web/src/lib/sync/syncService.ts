import {
  CollectionRepository,
  NoteRepository,
} from "@/lib/local-persistence/localDb";
import { Collection, Note } from "@/lib/prisma";
import { getStoreInstance } from "@/features/core/StoreProvider";

/**
 * Sync a locally created collection to the server
 */
export async function syncCreateCollection(
  collectionId: string
): Promise<Collection | undefined> {
  const localCollection = await CollectionRepository.getById(collectionId);

  if (!localCollection) {
    console.error(`SyncService: Collection ${collectionId} not found`);
    return;
  }

  const remoteCollection = await fetch("/api/collections", {
    method: "POST",
    body: JSON.stringify(localCollection),
  }).then((res) => res.json());

  // Check if we need to update activeCollection in the store
  const store = getStoreInstance();
  const activeCollection = store?.getState().activeCollection;

  // If the active collection is the one being swapped, update it
  if (store && activeCollection === localCollection.id) {
    // Update the active collection in the store
    store.getState().setActiveCollection(remoteCollection.id);
  }

  await store?.getState().swapCollection(localCollection.id, remoteCollection);

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
  try {
    // Get the note from local DB
    const localNote = await NoteRepository.getById(noteId);
    if (!localNote) {
      console.error(`SyncService: Note ${noteId} not found`);
      return;
    }

    // Find the collection in local DB to make sure we have the up-to-date ID
    const collection = await CollectionRepository.getById(
      localNote.collectionId
    );
    if (!collection) {
      console.error(
        `SyncService: Collection ${localNote.collectionId} not found for note ${noteId}`
      );

      // The note references a collection that doesn't exist anymore
      // Delete the orphaned note to prevent further sync attempts
      await NoteRepository.delete(noteId);

      // If the note still exists in the store, remove it
      const store = getStoreInstance();
      if (store) {
        const notesInStore = store.getState().notes.data;
        const noteExists = notesInStore.some((n) => n.id === noteId);

        if (noteExists) {
          const updatedNotes = notesInStore.filter((n) => n.id !== noteId);
          store.getState().setNotesData(updatedNotes);
        }
      }

      return;
    }

    // Use the collection ID from the local DB, which should be the remote ID after collection sync
    const remoteNote = await fetch("/api/notes", {
      method: "POST",
      body: JSON.stringify(localNote),
    }).then((res) => {
      if (!res.ok) {
        throw new Error(
          `Failed to create note on server: ${res.status} ${res.statusText}`
        );
      }
      return res.json();
    });

    await NoteRepository.swap(localNote.id, remoteNote);
    return remoteNote;
  } catch (error) {
    console.error(`SyncService: Error syncing note ${noteId}:`, error);
    throw error;
  }
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
export async function syncRemoteCollectionsToLocal(): Promise<Collection[]> {
  // Step 1: Fetch remote collections
  const remoteCollections: Collection[] = await fetch("/api/collections").then(
    (res) => res.json()
  );

  // Step 2: Update local db with remote data
  await Promise.all(
    remoteCollections.map((collection) =>
      CollectionRepository.update(collection)
    )
  );

  // Step 3: Update store with remote data
  const store = getStoreInstance();

  if (store) {
    store.getState().setCollectionsData(remoteCollections);
  }

  return remoteCollections;
}

/**
 * Load remote notes and sync them to local storage
 */
export async function syncRemoteNotesToLocal(): Promise<Note[]> {
  // Step 1: Fetch remote notes
  const remoteNotes: Note[] = await fetch("/api/notes").then((res) =>
    res.json()
  );

  // Step 2: Update local db with remote data
  await Promise.all(remoteNotes.map((note) => NoteRepository.update(note)));

  // Step 3: Update store with remote data
  const store = getStoreInstance();
  if (store) {
    store.getState().setNotesData(remoteNotes);
  }

  return remoteNotes;
}

/**
 * Process a single queue item based on its type
 */
export async function processActionQueueItem(item: ActionQueue.Item) {
  // Process the action
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
