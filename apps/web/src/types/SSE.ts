import { ServerCollection, ServerNote } from "./Entities";

export type SSEEventType =
  | "INIT"
  | "COLLECTION_CREATED"
  | "COLLECTION_UPDATED"
  | "COLLECTION_DELETED"
  | "NOTE_CREATED"
  | "NOTE_UPDATED"
  | "NOTE_DELETED";

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

export type SSEEvent =
  | SSEInitEvent
  | SSECollectionCreatedEvent
  | SSECollectionUpdatedEvent
  | SSECollectionDeletedEvent
  | SSENoteCreatedEvent
  | SSENoteUpdatedEvent
  | SSENoteDeletedEvent;
