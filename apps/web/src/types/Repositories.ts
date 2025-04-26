import { ActionQueueItem } from "./ActionQueue";
import {
  ClientCollection,
  ClientNote,
  ClientNoteYDocState,
  ServerCollection,
  ServerNote,
} from "./Entities";

interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | undefined>;
  put(item: T): Promise<void>;
  update(id: string, item: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}

export type IActionQueueRepository = IRepository<ActionQueueItem>;

export type ICollectionRepository = IRepository<ClientCollection> & {
  swap(localId: string, remoteCollection: ServerCollection): Promise<void>;
  syncRemoteToLocal(remoteCollections: ServerCollection[]): Promise<void>;
};

export interface INoteRepository extends IRepository<ClientNote> {
  swap(localId: string, remoteNote: ServerNote): Promise<void>;
  syncRemoteToLocal(remoteNotes: ServerNote[]): Promise<void>;
}

export type INoteYDocStateRepository = IRepository<ClientNoteYDocState>;
