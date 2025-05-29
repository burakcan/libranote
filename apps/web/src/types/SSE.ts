import {
  ServerCollection,
  ServerCollectionMember,
  ServerNote,
  ServerNoteYDocState,
} from "./Entities";
import { ServerUserSetting } from "./Settings";

export type SSEEventType =
  | "INIT"
  | "COLLECTION_CREATED"
  | "COLLECTION_UPDATED"
  | "COLLECTION_DELETED"
  | "NOTE_CREATED"
  | "NOTE_UPDATED"
  | "NOTE_DELETED"
  | "NOTE_YDOC_STATE_UPDATED"
  | "COLLECTION_MEMBER_JOINED"
  | "COLLECTION_MEMBER_LEFT"
  | "COLLECTION_MEMBER_ROLE_UPDATED"
  | "SETTING_UPDATED";

export interface SSEInitEvent {
  type: "INIT";
  clientId: string;
}

export interface SSECollectionCreatedEvent {
  type: "COLLECTION_CREATED";
  collection: ServerCollection;
}

export interface SSECollectionUpdatedEvent {
  type: "COLLECTION_UPDATED";
  collection: ServerCollection;
}

export interface SSECollectionDeletedEvent {
  type: "COLLECTION_DELETED";
  collectionId: string;
}

export interface SSENoteCreatedEvent {
  type: "NOTE_CREATED";
  note: ServerNote;
}

export interface SSENoteUpdatedEvent {
  type: "NOTE_UPDATED";
  note: ServerNote;
}

export interface SSENoteDeletedEvent {
  type: "NOTE_DELETED";
  noteId: string;
}

export interface SSEyDocUpdatedEvent {
  type: "NOTE_YDOC_STATE_UPDATED";
  ydocState: ServerNoteYDocState;
}

export interface SSECollectionMemberJoinedEvent {
  type: "COLLECTION_MEMBER_JOINED";
  userId: string;
  collection: ServerCollection;
}

export interface SSECollectionMemberLeftEvent {
  type: "COLLECTION_MEMBER_LEFT";
  userId: string;
  collection: ServerCollection;
}

export interface SSECollectionMemberRoleUpdatedEvent {
  type: "COLLECTION_MEMBER_ROLE_UPDATED";
  userId: string;
  role: ServerCollectionMember["role"];
}

export interface SSESettingUpdatedEvent {
  type: "SETTING_UPDATED";
  payload: ServerUserSetting;
}

export interface SSESessionRefreshEvent {
  type: "SESSION_REFRESH";
  payload: object;
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
  | SSESettingUpdatedEvent
  | SSESessionRefreshEvent;
