import {
  HocuspocusProvider,
  HocuspocusProviderWebsocket,
  WebSocketStatus,
} from "@hocuspocus/provider";
import * as Y from "yjs";
import { UseBoundStore, StoreApi } from "zustand";
import { ApiService } from "@/services/ApiService";
import { IndexeddbPersistence } from "@/services/db/yIndexedDb";
import { searchService } from "@/services/SearchService";
import { ErrorService, SyncError } from "@/lib/errors";
import { router } from "@/lib/router";
import { Store } from "@/lib/store";
import { Route } from "@/routes/(authenticated)/notes.$noteId";
import { ActionQueueItem } from "@/types/ActionQueue";
import { ServerNote, ServerNoteYDocState } from "@/types/Entities";
import {
  INoteRepository,
  INoteYDocStateRepository,
} from "@/types/Repositories";
import { SSEEvent } from "@/types/SSE";

const syncSocket = new HocuspocusProviderWebsocket({
  url: import.meta.env.VITE_HOCUSPOCUS_URL || "",
});

export class NoteSyncService extends EventTarget {
  constructor(
    private noteRepository: INoteRepository,
    private noteYDocStateRepository: INoteYDocStateRepository,
    private store: UseBoundStore<StoreApi<Store>>
  ) {
    super();
  }

  activeSyncProviders: number = 0;

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

  async syncAllNoteYDocStates(): Promise<void> {
    const remoteYDocStates = await ApiService.fetchAllYDocStates();

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
      // Ignore sync if note is already open.
      // Because the editor will handle the sync.
      return;
    }

    console.debug("NoteSyncService: Syncing YDoc", remoteYDocState.id);

    const doc = new Y.Doc();
    const persistence = new IndexeddbPersistence(remoteYDocState.id, doc);

    return new Promise<void>((resolve) => {
      persistence.whenSynced.then(() => {
        const jwt = this.store.getState().jwt;

        const provider = new HocuspocusProvider({
          websocketProvider: syncSocket,
          document: doc,
          name: remoteYDocState.id,
          token: jwt,
        });

        this.activeSyncProviders++;

        provider.on("status", ({ status }: { status: WebSocketStatus }) => {
          console.debug("NoteSyncService: YDoc status", status);

          if (status === "disconnected") {
            this.activeSyncProviders--;
          }
        });

        provider.on("error", (error: Error) => {
          console.error("NoteSyncService: YDoc error", error);
        });

        provider.on("synced", () => {
          console.debug("NoteSyncService: YDoc synced", remoteYDocState.id);

          this.noteYDocStateRepository.update(
            remoteYDocState.id,
            remoteYDocState
          );

          // If there are more than 1 active sync providers, destroy the provider immediately.
          // Otherwise, destroy the provider after 1 second.
          if (this.activeSyncProviders > 1) {
            provider.destroy();

            this.activeSyncProviders--;
          } else {
            setTimeout(() => {
              // Destroy provider after 1 second.
              // So if another document starts to sync within a second, they reuse the same socket and avoid
              // recreating the socket.
              console.log(
                "NoteSyncService: Destroying provider",
                remoteYDocState.id
              );

              provider.destroy();

              this.activeSyncProviders--;
            }, 1000);
          }

          persistence.destroy();
          doc.destroy();

          searchService.updateNoteFromYDoc(remoteYDocState.noteId);

          resolve();
        });
      });
    });
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
        await this.handleRemoteNoteCreated(event.note);
        await this.syncNoteYDocState(event.note.noteYDocState);
        break;
      case "NOTE_UPDATED":
        await this.handleRemoteNoteUpdated(event.note);
        break;
      case "NOTE_DELETED":
        await this.handleRemoteNoteDeleted(event.noteId);
        break;
      case "COLLECTION_MEMBER_JOINED": {
        await this.syncAllNotesToLocal();
        await this.syncAllNoteYDocStates();
        break;
      }
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

        await this.syncNoteYDocState(event.ydocState);
        break;
      }
      // Ignore all other events
    }
  }
}
