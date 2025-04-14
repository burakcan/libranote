import {
  type Collection,
  type CollectionMember,
  type Note,
  type NoteCollaborator,
  type NoteYDocState,
} from "@repo/db";

export type ServerCollection = Collection & {
  members: CollectionMember[];
};

export type ServerCollectionMember = CollectionMember;

export type ServerNote = Note & {
  noteYDocState: Omit<NoteYDocState, "encodedDoc">;
};

export type ServerNoteCollaborator = NoteCollaborator;

export type ServerNoteYDocState = Omit<NoteYDocState, "encodedDoc">;

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ClientCollection = Optional<
  ServerCollection,
  "serverCreatedAt" | "serverUpdatedAt"
>;

export type ClientNote = Optional<
  ServerNote,
  "serverCreatedAt" | "serverUpdatedAt"
>;

export type ClientNoteYDocState = ServerNoteYDocState & {
  needsSync?: boolean;
};

export type ClientCollectionMember = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: CollectionMember["role"];
};

export type ClientNoteCollaborator = ServerNoteCollaborator & {
  name: string;
  email: string;
};
