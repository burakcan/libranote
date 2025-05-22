import type {
  Collection,
  CollectionMember,
  Note,
  NoteYDocState,
  UserSetting,
} from "@repo/db";

export interface SSEInitEvent {
  type: "INIT";
  clientId: string;
}

export interface SSECollectionCreatedEvent {
  type: "COLLECTION_CREATED";
  collection: Collection & {
    members: CollectionMember[];
  };
}

export interface SSECollectionUpdatedEvent {
  type: "COLLECTION_UPDATED";
  collection: Collection;
}

export interface SSECollectionDeletedEvent {
  type: "COLLECTION_DELETED";
  collectionId: string;
}

export interface SSENoteCreatedEvent {
  type: "NOTE_CREATED";
  note: Note & {
    noteYDocState: Omit<NoteYDocState, "encodedDoc">;
  };
}

export interface SSENoteUpdatedEvent {
  type: "NOTE_UPDATED";
  note: Note & {
    noteYDocState: Omit<NoteYDocState, "encodedDoc"> | null;
  };
}

export interface SSENoteDeletedEvent {
  type: "NOTE_DELETED";
  noteId: string;
}

export interface SSEyDocUpdatedEvent {
  type: "NOTE_YDOC_STATE_UPDATED";
  ydocState: NoteYDocState;
}

export interface SSECollectionMemberJoinedEvent {
  type: "COLLECTION_MEMBER_JOINED";
  userId: string;
  collection: Collection & {
    members: CollectionMember[];
  };
}

export interface SSECollectionMemberLeftEvent {
  type: "COLLECTION_MEMBER_LEFT";
  userId: string;
  collection: Collection & {
    members: CollectionMember[];
  };
}

export interface SSECollectionMemberRoleUpdatedEvent {
  type: "COLLECTION_MEMBER_ROLE_UPDATED";
  userId: string;
  role: CollectionMember["role"];
}

export interface SSESettingUpdatedEvent {
  type: "SETTING_UPDATED";
  payload: UserSetting;
}

export type SSEEvent =
  | SSEInitEvent
  | SSECollectionCreatedEvent
  | SSECollectionUpdatedEvent
  | SSECollectionDeletedEvent
  | SSENoteCreatedEvent
  | SSENoteUpdatedEvent
  | SSENoteDeletedEvent
  | SSEyDocUpdatedEvent
  | SSECollectionMemberJoinedEvent
  | SSECollectionMemberLeftEvent
  | SSECollectionMemberRoleUpdatedEvent
  | SSESettingUpdatedEvent;
