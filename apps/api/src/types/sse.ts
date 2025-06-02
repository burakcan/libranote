/**
 * Types for Server-Sent Events
 */

import type { Collection, CollectionMember, Note, NoteYDocState, UserSetting } from "@repo/db";

export interface SSEInitEvent {
  type: "INIT";
  clientId: string;
}

export interface SSECollectionCreatedEvent {
  type: "COLLECTION_CREATED";
  collection: Collection;
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
  note: Note;
}

export interface SSENoteUpdatedEvent {
  type: "NOTE_UPDATED";
  note: Note;
}

export interface SSENoteDeletedEvent {
  type: "NOTE_DELETED";
  noteId: string;
}

export interface SSENoteYDocStateUpdatedEvent {
  type: "NOTE_YDOC_STATE_UPDATED";
  ydocState: Omit<NoteYDocState, "encodedDoc">;
}

export interface SSECollectionMemberJoinedEvent {
  type: "COLLECTION_MEMBER_JOINED";
  userId: string;
  collection: Collection;
}

export interface SSECollectionMemberLeftEvent {
  type: "COLLECTION_MEMBER_LEFT";
  userId: string;
  collection: Collection;
}

export interface SSECollectionMemberRoleUpdatedEvent {
  type: "COLLECTION_MEMBER_ROLE_UPDATED";
  userId: string;
  role: CollectionMember["role"];
  collection: Collection;
}

export interface SSESettingUpdatedEvent {
  type: "SETTING_UPDATED";
  payload: UserSetting;
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
  | SSENoteYDocStateUpdatedEvent
  | SSECollectionMemberJoinedEvent
  | SSECollectionMemberLeftEvent
  | SSECollectionMemberRoleUpdatedEvent
  | SSESettingUpdatedEvent
  | SSESessionRefreshEvent;
