import { type Collection, type Note } from "@repo/db";

export type ServerCollection = Collection;
export type ServerNote = Note;

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type ClientCollection = Optional<
  ServerCollection,
  "serverCreatedAt" | "serverUpdatedAt"
>;

export type ClientNote = Optional<
  ServerNote,
  "serverCreatedAt" | "serverUpdatedAt"
>;
