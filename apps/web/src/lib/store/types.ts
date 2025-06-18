import {
  UNCATEGORIZED_COLLECTION_ID,
  ALL_NOTES_COLLECTION_ID,
} from "@/lib/store/useCollectionNotes";
import { ActionQueueItem } from "@/types/ActionQueue";
import {
  ClientCollection,
  ClientNote,
  ServerCollection,
  ServerNote,
} from "@/types/Entities";
import { ClientUserSetting, ServerUserSetting } from "@/types/Settings";
// --- Base State Interface (Defines the shape of the state) ---
export interface StoreState {
  clientId: string;
  userId: string;
  jwt: string;
  collections: {
    activeCollectionId:
      | ClientCollection["id"]
      | typeof UNCATEGORIZED_COLLECTION_ID
      | typeof ALL_NOTES_COLLECTION_ID;
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
  settings: {
    initialDataLoaded: boolean;
    data: ClientUserSetting[];
  };
}

// --- Initial State Type (Helper for slices, only state parts) ---
export type InitialStoreState = Omit<StoreState, "clientId" | "userId">;

// --- Slice Action Types (Define only the actions for each slice) ---

export type RootSliceActions = {
  setJWT: (jwt: string) => void;
};

export type CollectionsSliceActions = {
  setActiveCollectionId: (
    collectionId:
      | ClientCollection["id"]
      | typeof UNCATEGORIZED_COLLECTION_ID
      | typeof ALL_NOTES_COLLECTION_ID
  ) => void;
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
  updateCollection: (
    update: Partial<ClientCollection> & { id: ClientCollection["id"] }
  ) => Promise<void>;
  updateMyMembership: (
    collectionId: string,
    membershipUpdate: {
      color?: string | null;
      // Future membership properties can be added here
    }
  ) => Promise<void>;
  swapCollection: (
    localId: ClientCollection["id"],
    remoteCollection: ServerCollection
  ) => Promise<void>;
  leaveCollection: (collectionId: ClientCollection["id"]) => Promise<void>;
  remoteCreatedCollection: (collection: ServerCollection) => Promise<void>;
  remoteDeletedCollection: (
    collectionId: ClientCollection["id"]
  ) => Promise<void>;
  remoteUpdatedCollection: (
    update: Omit<ServerCollection, "members">
  ) => Promise<void>;
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
    collectionId: ClientCollection["id"] | null,
    createdById: string,
    title: string,
    content?: string
  ) => Promise<ClientNote>;
  deleteNote: (noteId: ClientNote["id"], noAction?: boolean) => Promise<void>;
  updateNote: (
    update: Partial<ClientNote> & { id: ClientNote["id"] },
    noAction?: boolean
  ) => Promise<void>;
  remoteCreatedNote: (note: ServerNote) => Promise<void>;
  remoteDeletedNote: (noteId: ClientNote["id"]) => Promise<void>;
  remoteUpdatedNote: (note: ServerNote) => Promise<void>;
  swapNote: (
    localId: ClientNote["id"],
    remoteNote: ServerNote
  ) => Promise<void>;
  moveNoteToCollection: (
    noteId: ClientNote["id"],
    collectionId: ClientCollection["id"] | null
  ) => Promise<void>;
};

export type SettingsSliceActions = {
  setInitialDataLoaded: (initialDataLoaded: boolean) => void;
  setSettingsData: (settings: ClientUserSetting[]) => void;
  setSetting: (
    key: ClientUserSetting["key"],
    value: ClientUserSetting["value"]
  ) => Promise<void>;
  swapSetting: (
    key: ClientUserSetting["key"],
    remoteSetting: ServerUserSetting
  ) => Promise<void>;
  syncRemoteSettingsToLocal: (
    remoteSettings: ServerUserSetting[]
  ) => Promise<void>;
};

export type ActionQueueSliceActions = {
  addActionToQueue: (action: ActionQueueItem) => Promise<void>;
  removeActionFromQueue: (actionId: ActionQueueItem["id"]) => Promise<void>;
  setActionQueueItems: (items: ActionQueueItem[]) => void;
  setActionQueueItemStatus: (
    actionId: ActionQueueItem["id"],
    status: ActionQueueItem["status"]
  ) => Promise<void>;
};

// --- Final Store Type (Combining state and nested actions) ---

export type Store = Pick<StoreState, "clientId" | "userId" | "jwt"> &
  RootSliceActions & {
    collections: StoreState["collections"] & CollectionsSliceActions;
    notes: StoreState["notes"] & NotesSliceActions;
    settings: StoreState["settings"] & SettingsSliceActions;
    actionQueue: StoreState["actionQueue"] & ActionQueueSliceActions;
  };
