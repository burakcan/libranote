import { ActionQueueItem } from "@/types/ActionQueue";
import {
  ClientCollection,
  ClientNote,
  ServerCollection,
  ServerNote,
} from "@/types/Entities";

// --- Base State Interface (Defines the shape of the state) ---
export interface StoreState {
  clientId: string;
  userId: string;
  collections: {
    activeCollectionId: ClientCollection["id"] | null;
    renamingCollectionId: ClientCollection["id"] | null;
    data: ClientCollection[];
  };
  notes: {
    data: ClientNote[];
  };
  // Action Queue state is now an object containing the items array
  actionQueue: {
    items: ActionQueueItem[];
  };
}

// --- Initial State Type (Helper for slices, only state parts) ---
export type InitialStoreState = Omit<StoreState, "clientId" | "userId">;

// --- Slice Action Types (Define only the actions for each slice) ---

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type RootSliceActions = {};

export type CollectionsSliceActions = {
  setActiveCollectionId: (collectionId: ClientCollection["id"] | null) => void;
  setRenamingCollectionId: (
    collectionId: ClientCollection["id"] | null
  ) => void;
  setCollectionsData: (collections: ClientCollection[]) => void;
  syncRemoteCollectionsToLocal: (
    remoteCollections: ServerCollection[]
  ) => Promise<void>;
  createCollection: (
    title: string,
    createdById: string
  ) => Promise<ClientCollection>;
  deleteCollection: (collectionId: ClientCollection["id"]) => Promise<void>;
  updateCollection: (collection: ClientCollection) => Promise<void>;
  swapCollection: (
    localId: ClientCollection["id"],
    remoteCollection: ServerCollection
  ) => Promise<void>;
  leaveCollection: (collectionId: ClientCollection["id"]) => Promise<void>;
  remoteCreatedCollection: (collection: ServerCollection) => Promise<void>;
  remoteDeletedCollection: (
    collectionId: ClientCollection["id"]
  ) => Promise<void>;
  remoteUpdatedCollection: (collection: ServerCollection) => Promise<void>;
  remoteJoinedCollection: (
    userId: string,
    collection: ServerCollection
  ) => Promise<void>;
  remoteLeftCollection: (
    userId: string,
    collection: ServerCollection
  ) => Promise<void>;
};

export type NotesSliceActions = {
  setNotesData: (notes: ClientNote[]) => void;
  syncRemoteNotesToLocal: (remoteNotes: ServerNote[]) => Promise<void>;
  createNote: (
    collectionId: string | null,
    createdById: string,
    title: string,
    content?: string
  ) => Promise<ClientNote>;
  deleteNote: (noteId: string, noAction?: boolean) => Promise<void>;
  updateNote: (note: ClientNote) => Promise<void>;
  remoteCreatedNote: (note: ServerNote) => Promise<void>;
  remoteDeletedNote: (noteId: string) => Promise<void>;
  remoteUpdatedNote: (note: ServerNote) => Promise<void>;
  swapNote: (localId: string, remoteNote: ServerNote) => Promise<void>;
};

export type ActionQueueSliceActions = {
  addActionToQueue: (action: ActionQueueItem) => Promise<void>;
  removeActionFromQueue: (actionId: string) => Promise<void>;
  setActionQueueItems: (items: ActionQueueItem[]) => void;
  setActionQueueItemStatus: (
    actionId: string,
    status: ActionQueueItem["status"]
  ) => Promise<void>;
};

// --- Final Store Type (Combining state and nested actions) ---

export type Store = Pick<StoreState, "clientId" | "userId"> &
  RootSliceActions & {
    collections: StoreState["collections"] & CollectionsSliceActions;
    notes: StoreState["notes"] & NotesSliceActions;
    actionQueue: StoreState["actionQueue"] & ActionQueueSliceActions;
  };
