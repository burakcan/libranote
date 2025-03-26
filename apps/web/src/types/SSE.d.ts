declare namespace SSE {
  type EventType =
    | "INIT"
    | "COLLECTION_CREATED"
    | "COLLECTION_UPDATED"
    | "COLLECTION_DELETED"
    | "NOTE_CREATED"
    | "NOTE_UPDATED"
    | "NOTE_DELETED";

  interface InitEvent {
    type: "INIT";
    clientId: string;
  }

  interface CollectionCreatedEvent {
    type: "COLLECTION_CREATED";
    collection: Collection;
  }

  interface CollectionUpdatedEvent {
    type: "COLLECTION_UPDATED";
    collection: Collection;
  }

  interface CollectionDeletedEvent {
    type: "COLLECTION_DELETED";
    collectionId: string;
  }

  interface NoteCreatedEvent {
    type: "NOTE_CREATED";
    note: Note;
  }

  interface NoteUpdatedEvent {
    type: "NOTE_UPDATED";
    note: Note;
  }

  interface NoteDeletedEvent {
    type: "NOTE_DELETED";
    noteId: string;
  }

  type Event =
    | InitEvent
    | CollectionCreatedEvent
    | CollectionUpdatedEvent
    | CollectionDeletedEvent
    | NoteCreatedEvent
    | NoteUpdatedEvent
    | NoteDeletedEvent;
}
