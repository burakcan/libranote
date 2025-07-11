import { nanoid } from "nanoid";
import type { StateCreator } from "zustand";
import { NoteRepository } from "@/services/db/NoteRepository";
import { NoteYDocStateRepository } from "@/services/db/NoteYDocStateRepository";
import { TransactionService } from "@/services/db/TransactionService";
import { searchService } from "@/services/SearchService";
import type { Store, InitialStoreState } from "./types";
import { P } from "./utils";
import { ClientNote } from "@/types/Entities";

// Initial state for this slice
const initialNotesState: InitialStoreState["notes"] = {
  data: [],
};

export const createNotesSlice: StateCreator<
  Store,
  [],
  [],
  Pick<Store, "notes">
> = (set, get) => ({
  notes: {
    ...initialNotesState,

    // --- Actions for notes ---

    setNotesData: (notes) =>
      P(set, (draft) => {
        draft.notes.data = notes;
      }),

    syncRemoteNotesToLocal: async (remoteNotes) => {
      for (const remoteNote of remoteNotes) {
        const existingNoteIndex = get().notes.data.findIndex(
          (note) => note.id === remoteNote.id
        );

        if (existingNoteIndex !== -1) {
          // If the note already exists, update it
          P(set, (draft) => {
            draft.notes.data[existingNoteIndex] = remoteNote;
          });
        } else {
          // If the note does not exist, add it
          P(set, (draft) => {
            draft.notes.data.push(remoteNote);
          });

          searchService.addNote({
            id: remoteNote.id,
            title: remoteNote.title,
            content: remoteNote.description || "",
          });
        }

        // Defer so the ui can update and not block the main thread
        await Promise.resolve();
      }

      // Delete notes that are no longer in the remote data
      P(set, (draft) => {
        draft.notes.data = draft.notes.data.filter((note) =>
          remoteNotes.some((remoteNote) => remoteNote.id === note.id)
        );
      });

      await TransactionService.syncRemoteNotesToLocal(remoteNotes);
    },

    createNote: async (collectionId, createdById, title, content = "") => {
      const noteId = nanoid(10);
      const note: ClientNote = {
        id: noteId,
        title,
        description: content,
        createdById,
        collectionId,
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        noteYDocState: {
          id: noteId,
          noteId,
          updatedAt: new Date(),
        },
      };

      P(set, (draft) => {
        draft.notes.data.push(note);
      });

      await NoteRepository.put(note);

      get().actionQueue.addActionToQueue({
        id: nanoid(3),
        type: "CREATE_NOTE",
        status: "pending",
        createdAt: new Date(),
        relatedEntityId: noteId,
      });

      searchService.addNote({
        id: noteId,
        title,
        content,
      });

      return note;
    },

    deleteNote: async (noteId, noAction = false) => {
      const state = get();

      const noteToDelete = state.notes.data.find((n) => n.id === noteId);

      if (!noteToDelete) {
        console.error(`Note ${noteId} not found`);
        return;
      }

      const actionsToDelete = state.actionQueue.items.filter(
        (action) =>
          action.status === "pending" && action.relatedEntityId === noteId
      );

      // Delete note from local state
      P(set, (draft) => {
        draft.notes.data = draft.notes.data.filter(
          (note) => note.id !== noteId
        );
      });

      // Delete note from local DB
      await NoteRepository.delete(noteId);
      await NoteYDocStateRepository.delete(noteId);

      // Delete actions
      for (const action of actionsToDelete) {
        await state.actionQueue.removeActionFromQueue(action.id);
      }

      // If the note was created remotely, we need to add a delete action to the queue
      // If noAction is true, we don't want to add an action to the queue
      // This is used when we delete a collection. Backend automatically cascades the delete to all notes in the collection
      // so we don't need to add a delete action to the queue
      if (noteToDelete.serverCreatedAt && !noAction) {
        await state.actionQueue.addActionToQueue({
          id: nanoid(3),
          type: "DELETE_NOTE",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: noteId,
        });
      }

      searchService.removeNote(noteId);
    },

    updateNote: async (update, noAction = false) => {
      const state = get();
      const pendingRelatedActionIndex = state.actionQueue.items.findIndex(
        (action) =>
          (action.type === "CREATE_NOTE" || action.type === "UPDATE_NOTE") &&
          action.status === "pending" &&
          action.relatedEntityId === update.id
      );
      const index = state.notes.data.findIndex((n) => n.id === update.id);
      const note = state.notes.data[index];

      if (!note) {
        console.error(`Note ${update.id} not found`);
        return;
      }

      const updatedNote = {
        ...note,
        ...update,
        updatedAt: new Date(),
      };

      if (index !== -1) {
        P(set, (draft) => {
          draft.notes.data[index] = updatedNote;
        });
      }

      await NoteRepository.update(update.id, updatedNote);

      // If there is a pending create or update action, we don't need to add an update action to the queue
      // we can just update the note in the local DB and the updated note will be synced to the remote DB
      if (pendingRelatedActionIndex === -1 && !noAction) {
        await state.actionQueue.addActionToQueue({
          id: nanoid(3),
          type: "UPDATE_NOTE",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: update.id,
        });
      }
    },

    remoteCreatedNote: async (note) => {
      P(set, (draft) => {
        if (!draft.notes.data.some((n) => n.id === note.id)) {
          draft.notes.data.push(note);
        }
      });
      await NoteRepository.put(note);

      searchService.addNote({
        id: note.id,
        title: note.title,
        content: note.description || "",
      });
    },

    remoteDeletedNote: async (noteId) => {
      P(set, (draft) => {
        draft.notes.data = draft.notes.data.filter((n) => n.id !== noteId);
      });
      await NoteRepository.delete(noteId);
      await NoteYDocStateRepository.delete(noteId);

      searchService.removeNote(noteId);
    },

    remoteUpdatedNote: async (note) => {
      P(set, (draft) => {
        const index = draft.notes.data.findIndex((n) => n.id === note.id);
        if (index !== -1) {
          draft.notes.data[index] = note;
        } else {
          draft.notes.data.push(note);
        }
      });

      await NoteRepository.put(note);
    },

    swapNote: async (localId, remoteNote) => {
      const state = get();
      const localIndex = state.notes.data.findIndex((n) => n.id === localId);

      if (localIndex !== -1) {
        P(set, (draft) => {
          draft.notes.data[localIndex] = remoteNote;

          // Update collectionId for notes in the notes slice
          draft.notes.data = draft.notes.data.map((note) => {
            if (note.collectionId === localId) {
              return { ...note, collectionId: remoteNote.collectionId };
            }
            return note;
          });
        });
      }

      await TransactionService.swapNoteWithRemote(localId, remoteNote);

      if (remoteNote.id !== localId) {
        searchService.removeNote(localId);

        searchService
          .addNote({
            id: remoteNote.id,
            title: remoteNote.title,
            content: remoteNote.description || "",
          })
          .then(() => {
            searchService.updateNoteFromYDoc(remoteNote.id);
          });
      }
    },

    moveNoteToCollection: async (noteId, collectionId) => {
      const state = get();
      const pendingRelatedActionIndex = state.actionQueue.items.findIndex(
        (action) =>
          (action.type === "CREATE_NOTE" || action.type === "UPDATE_NOTE") &&
          action.status === "pending" &&
          action.relatedEntityId === noteId
      );

      P(set, (draft) => {
        const index = draft.notes.data.findIndex((n) => n.id === noteId);

        if (index !== -1) {
          draft.notes.data[index] = {
            ...draft.notes.data[index],
            collectionId,
          };
        }
      });

      await NoteRepository.update(noteId, {
        collectionId,
      });

      if (pendingRelatedActionIndex === -1) {
        await state.actionQueue.addActionToQueue({
          id: nanoid(3),
          type: "UPDATE_NOTE",
          status: "pending",
          createdAt: new Date(),
          relatedEntityId: noteId,
        });
      }
    },
  },
});
