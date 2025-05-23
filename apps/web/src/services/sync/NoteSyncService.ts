import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
} from "@hocuspocus/provider";
import * as Y from "yjs";
import { UseBoundStore, StoreApi } from "zustand";
import { ApiService } from "@/services/ApiService";
import { IndexeddbPersistence } from "@/services/db/yIndexedDb";
import { SearchService } from "@/services/SearchService";
import { ErrorService, SyncError } from "@/lib/errors";
import { router } from "@/lib/router";
import { Store } from "@/lib/store";
import { Route } from "@/routes/(authenticated)/notes.$noteId";
import { ActionQueueItem } from "@/types/ActionQueue";
import { ClientNote, ServerNote, ServerNoteYDocState } from "@/types/Entities";
import {
  IActionQueueRepository,
  INoteRepository,
  INoteYDocStateRepository,
} from "@/types/Repositories";
import { SSEEvent } from "@/types/SSE";

const syncSocket = new HocuspocusProviderWebsocket({
  url: import.meta.env.VITE_HOCUSPOCUS_URL || "",
});

export const NOTE_SYNCING_EVENT = "note:syncing";
export const NOTE_SYNCED_EVENT = "note:synced";
export const NOTE_SYNC_ERROR_EVENT = "note:sync-error";

export class NoteSyncService extends EventTarget {
  constructor(
    private noteRepository: INoteRepository,
    private queueRepository: IActionQueueRepository,
    private noteYDocStateRepository: INoteYDocStateRepository,
    private store: UseBoundStore<StoreApi<Store>>
  ) {
    super();
  }

  getCurrentNoteId() {
    const params = router.matchRoute(Route.fullPath) as
      | false
      | {
          noteId: string;
        };

    if (!params) {
      return null;
    }

    return params.noteId;
  }

  async loadLocalNotesToStore(): Promise<void> {
    const localNotes = await this.noteRepository.getAll();
    await this.store.getState().notes.setNotesData(localNotes);
    console.debug("NoteSyncService: Loaded local notes to store", localNotes);
  }

  async syncNoteYDocStates(
    remoteYDocState?: ServerNoteYDocState
  ): Promise<void> {
    const remoteYDocStates = remoteYDocState
      ? [remoteYDocState]
      : await ApiService.fetchAllYDocStates();

    console.debug("NoteSyncService: Syncing YDoc states", remoteYDocStates);

    for (const remoteYDocState of remoteYDocStates) {
      await this.syncNoteYDocState(remoteYDocState);
    }
  }

  async syncNoteYDocState(remoteYDocState: ServerNoteYDocState): Promise<void> {
    const localYDocState = await this.noteYDocStateRepository.getById(
      remoteYDocState.id
    );

    if (!localYDocState) {
      console.log(
        "NoteSyncService: YDoc state not found, creating",
        remoteYDocState.id
      );
      await this.noteYDocStateRepository.put(remoteYDocState);
    }

    if (localYDocState?.updatedAt === remoteYDocState.updatedAt) {
      return;
    }

    if (remoteYDocState.noteId === this.getCurrentNoteId()) {
      await this.noteYDocStateRepository.update(
        remoteYDocState.id,
        remoteYDocState
      );
      return;
    }

    console.debug("NoteSyncService: Syncing YDoc", remoteYDocState.id);

    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(remoteYDocState.id, doc);

    return new Promise<void>((resolve) => {
      persistence.whenSynced.then(() => {
        const provider = new HocuspocusProvider({
          websocketProvider: syncSocket,
          document: doc,
          name: remoteYDocState.id,
          token: "123",
        });

        provider.on("synced", () => {
          console.debug("NoteSyncService: YDoc synced", remoteYDocState.id);

          this.noteYDocStateRepository.update(
            remoteYDocState.id,
            remoteYDocState
          );

          provider.destroy();
          persistence.destroy();
          doc.destroy();

          SearchService.updateNoteFromYDoc(remoteYDocState.noteId);

          resolve();
        });
      });
    });
  }

  async syncNote(noteId: string): Promise<void> {
    try {
      this.dispatchEvent(
        new CustomEvent(NOTE_SYNCING_EVENT, { detail: { noteId } })
      );

      const localNote = await this.noteRepository.getById(noteId);
      // For now, we'll sync all notes until individual note fetch is implemented
      const remoteNotes = await ApiService.fetchAllNotes();
      const remoteNote = remoteNotes.find((note) => note.id === noteId);

      if (!remoteNote) {
        throw new Error(`Note ${noteId} not found on server`);
      }

      if (this.needsSync(localNote, remoteNote)) {
        await this.reconcileNote(localNote, remoteNote);
      }

      this.dispatchEvent(
        new CustomEvent(NOTE_SYNCED_EVENT, { detail: { noteId } })
      );
    } catch (error) {
      const appError = ErrorService.handle(error);
      const syncError = new SyncError(
        `Failed to sync note ${noteId}: ${appError.message}`,
        appError
      );

      this.dispatchEvent(
        new CustomEvent(NOTE_SYNC_ERROR_EVENT, {
          detail: { noteId, error: syncError },
        })
      );

      throw syncError;
    }
  }

  async syncAllNotesToLocal(): Promise<ServerNote[]> {
    try {
      const remoteNotes = await ApiService.fetchAllNotes();

      // Sync remote notes to local DB and store
      await this.store.getState().notes.syncRemoteNotesToLocal(remoteNotes);

      return remoteNotes;
    } catch (error) {
      const appError = ErrorService.handle(error);
      throw new SyncError("Failed to sync all notes to local", appError);
    }
  }

  async processQueuedNoteActions(): Promise<void> {
    try {
      const queueItems = await this.queueRepository.getAll();
      const noteActions = queueItems.filter(
        (item) =>
          ["CREATE_NOTE", "UPDATE_NOTE", "DELETE_NOTE"].includes(item.type) &&
          item.status === "pending"
      );

      for (const item of noteActions) {
        try {
          await this.processQueueItem(item);
        } catch (error) {
          console.error(`Failed to process queue item ${item.id}:`, error);
          await this.queueRepository.update(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    } catch (error) {
      const appError = ErrorService.handle(error);
      throw new SyncError("Failed to process queued note actions", appError);
    }
  }

  async processQueueItem(item: ActionQueueItem): Promise<void> {
    // Set status to processing
    this.store
      .getState()
      .actionQueue.setActionQueueItemStatus(item.id, "processing");

    switch (item.type) {
      case "CREATE_NOTE":
        await this.processCreateNote(item.relatedEntityId);
        break;
      case "UPDATE_NOTE":
        await this.processUpdateNote(item.relatedEntityId);
        break;
      case "DELETE_NOTE":
        await this.processDeleteNote(item.relatedEntityId);
        break;
    }

    // Remove from queue
    await this.store.getState().actionQueue.removeActionFromQueue(item.id);
  }

  private async processCreateNote(
    noteId: string
  ): Promise<ServerNote | undefined> {
    const localNote = await this.noteRepository.getById(noteId);

    if (!localNote) {
      console.error(`NoteSyncService: Note ${noteId} not found`);
      return;
    }

    const remoteNote = await ApiService.createNote(localNote);

    // Use store to swap local note with remote note (handles ID swapping, etc.)
    await this.store.getState().notes.swapNote(localNote.id, remoteNote);

    return remoteNote;
  }

  private async processUpdateNote(
    noteId: string
  ): Promise<ServerNote | undefined> {
    const localNote = await this.noteRepository.getById(noteId);

    if (!localNote) {
      console.error(`NoteSyncService: Note ${noteId} not found`);
      return;
    }

    const remoteNote = await ApiService.updateNote(localNote);

    // Use store to update with remote note
    await this.store.getState().notes.swapNote(localNote.id, remoteNote);

    return remoteNote;
  }

  private async processDeleteNote(noteId: string): Promise<void> {
    await ApiService.deleteNote(noteId);
    // Note: Local deletion already happened when action was queued
  }

  // Handle remote events
  async handleRemoteNoteCreated(note: ServerNote): Promise<void> {
    await this.store.getState().notes.remoteCreatedNote(note);
  }

  async handleRemoteNoteUpdated(note: ServerNote): Promise<void> {
    await this.store.getState().notes.remoteUpdatedNote(note);
  }

  async handleRemoteNoteDeleted(noteId: string): Promise<void> {
    await this.store.getState().notes.remoteDeletedNote(noteId);
  }

  // Handle SSE events (Redux-style dispatch to all services)
  async handleSSEEvent(event: SSEEvent): Promise<void> {
    switch (event.type) {
      case "NOTE_CREATED":
        // Sync YDoc first, then handle note creation
        await this.syncNoteYDocStates(event.note.noteYDocState);
        await this.handleRemoteNoteCreated(event.note);
        break;
      case "NOTE_UPDATED":
        await this.handleRemoteNoteUpdated(event.note);
        break;
      case "NOTE_DELETED":
        await this.handleRemoteNoteDeleted(event.noteId);
        break;
      case "NOTE_YDOC_STATE_UPDATED": {
        const store = this.store.getState();
        const note = store.notes.data.find(
          (note) => note.id === event.ydocState.noteId
        );

        if (!note) {
          console.error(
            "NoteSyncService: Note not found",
            event.ydocState.noteId
          );
          return;
        }

        await store.notes.remoteUpdatedNote({
          ...note,
          serverCreatedAt: note.serverCreatedAt || new Date(),
          serverUpdatedAt: note.serverUpdatedAt || new Date(),
          noteYDocState: event.ydocState,
        });

        await this.syncNoteYDocStates(event.ydocState);
        break;
      }
      // Ignore all other events
    }
  }

  private needsSync(
    local: ClientNote | undefined,
    remote: ServerNote
  ): boolean {
    if (!local) return true;
    if (!local.serverUpdatedAt || !remote.serverUpdatedAt) return true;
    return local.serverUpdatedAt < remote.serverUpdatedAt;
  }

  private async reconcileNote(
    local: ClientNote | undefined,
    remote: ServerNote
  ): Promise<void> {
    try {
      // Update local note with remote data
      await this.noteRepository.put(remote);

      // Update search index
      await SearchService.updateNoteFromYDoc(remote.id);
    } catch (error) {
      const appError = ErrorService.handle(error);
      throw new SyncError(`Failed to reconcile note ${remote.id}`, appError);
    }
  }
}
