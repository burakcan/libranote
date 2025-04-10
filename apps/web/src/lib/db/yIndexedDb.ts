import Dexie from "dexie";
import * as Y from "yjs";

/**
 * Number of incremental updates after which we merge into a single snapshot.
 */
export const PREFERRED_TRIM_SIZE = 100;

/**
 * Structure of an update entry stored in the Dexie DB.
 */
export interface UpdateEntry {
  /** Auto-incremented key (set by Dexie) */
  id?: number;
  /** The name/ID of the Yjs document this update belongs to */
  docName: string;
  /** The binary update payload */
  update: Uint8Array;
}

/**
 * Single Dexie database to persist all Yjs docs.
 */
export class YjsPersistenceDB extends Dexie {
  public updates!: Dexie.Table<UpdateEntry, number>;

  constructor() {
    super("YjsPersistenceDB");
    // Define tables: "updates" with auto-increment id
    this.version(1).stores({
      updates: "++id, docName",
    });
  }
}

// Create a singleton instance.
export const yjsDB = new YjsPersistenceDB();

/**
 * Fetches all updates for a given document (with id >= persistence._dbref),
 * applies them to the Yjs document, and updates internal counters.
 *
 * @param persistence The IndexeddbPersistence instance for a given doc.
 * @param beforeApplyUpdatesCallback Called before updates are applied.
 * @param afterApplyUpdatesCallback Called after updates are applied.
 * @returns A promise that resolves to the fetched update entries.
 */
export function fetchUpdates(
  persistence: IndexeddbPersistence,
  beforeApplyUpdatesCallback: (updates: UpdateEntry[]) => void = () => {},
  afterApplyUpdatesCallback: () => void = () => {}
): Promise<UpdateEntry[]> {
  return yjsDB.updates
    .where("docName")
    .equals(persistence.name)
    .filter((entry) => (entry.id ?? 0) >= persistence._dbref)
    .toArray()
    .then(async (updates) => {
      if (!persistence._destroyed) {
        beforeApplyUpdatesCallback(updates);
        // Use Y.transact to batch the application of updates.
        Y.transact(
          persistence.doc,
          () => {
            updates.forEach((entry) => {
              Y.applyUpdate(persistence.doc, entry.update);
            });
          },
          persistence,
          false
        );
        afterApplyUpdatesCallback();
      }
      // Set _dbref to one more than the last update's id (if any).
      if (updates.length > 0) {
        const lastId = updates[updates.length - 1].id!;
        persistence._dbref = lastId + 1;
      }
      // Update _dbsize to reflect the count of updates for this document.
      const count = await yjsDB.updates
        .where("docName")
        .equals(persistence.name)
        .count();
      persistence._dbsize = count;
      return updates;
    });
}

/**
 * Merges updates if needed by creating a snapshot of the current Yjs document
 * state, storing it, and deleting older updates.
 *
 * @param persistence The persistence instance.
 * @param forceStore If true, forces a snapshot regardless of the update count.
 */
export function storeState(
  persistence: IndexeddbPersistence,
  forceStore: boolean = true
): Promise<void> {
  return fetchUpdates(persistence).then(async () => {
    if (forceStore || persistence._dbsize >= PREFERRED_TRIM_SIZE) {
      // Create a snapshot update of the full document state.
      const snapshot = Y.encodeStateAsUpdate(persistence.doc);
      await yjsDB.updates.add({ docName: persistence.name, update: snapshot });
      // Delete all older updates (all entries with id less than _dbref).
      await yjsDB.updates
        .where("docName")
        .equals(persistence.name)
        .and((entry) => (entry.id ?? 0) < persistence._dbref)
        .delete();
      // Refresh the _dbsize after trimming.
      const count = await yjsDB.updates
        .where("docName")
        .equals(persistence.name)
        .count();
      persistence._dbsize = count;
    }
  });
}

/**
 * Removes all data (updates and custom entries) for a given document name.
 *
 * @param name The document name to clear.
 */
export function clearDocument(name: string): Promise<void> {
  return yjsDB.updates
    .where("docName")
    .equals(name)
    .delete()
    .then(() => {});
}

/**
 * An IndexedDB persistence provider for Yjs that uses Dexie in a single shared database.
 *
 * It stores document updates (and snapshots) in the "updates" table and
 * custom data in the "custom" table. Each entry is tagged with the document name.
 *
 * This class extends Observable (from lib0/observable) so you can listen to events
 * such as when the document is fully synced.
 */
export class IndexeddbPersistence extends EventTarget {
  public doc: Y.Doc;
  public name: string;
  public _dbref: number = 0;
  public _dbsize: number = 0;
  public _destroyed: boolean = false;
  public synced: boolean = false;
  public whenSynced: Promise<IndexeddbPersistence>;
  public _storeTimeout: number = 1000;
  public _storeTimeoutId: number | null = null;

  constructor(name: string, doc: Y.Doc) {
    super();
    this.doc = doc;
    this.name = name;

    // Create a promise that resolves when the initial sync (updates applied) is complete.
    this.whenSynced = new Promise((resolve) => {
      this.addEventListener("synced", () => resolve(this));
    });

    // Call fetchUpdates to load and apply any stored updates.
    const beforeApplyUpdatesCallback = () => {
      // Before applying updates, store a snapshot of the current document state.
      const snapshot = Y.encodeStateAsUpdate(doc);
      yjsDB.updates
        .add({ docName: this.name, update: snapshot })
        .catch((e) => console.error("Error adding snapshot update:", e));
    };

    const afterApplyUpdatesCallback = () => {
      if (this._destroyed) return;
      this.synced = true;
      this.dispatchEvent(new Event("synced"));
    };

    fetchUpdates(
      this,
      beforeApplyUpdatesCallback,
      afterApplyUpdatesCallback
    ).catch((e) => console.error("Error fetching updates:", e));

    // Bind the store update method and register listeners on the Yjs document.
    this._storeUpdate = this._storeUpdate.bind(this);
    this.destroy = this.destroy.bind(this);
    doc.on("update", this._storeUpdate);
    doc.on("destroy", this.destroy);
  }

  /**
   * Internal method to store document updates.
   */
  private _storeUpdate(update: Uint8Array, origin: unknown): void {
    if (this._destroyed || origin === this) return;
    // Save the update in the shared "updates" table.
    yjsDB.updates
      .add({ docName: this.name, update })
      .then(() => {
        this._dbsize++;
        if (this._dbsize >= PREFERRED_TRIM_SIZE) {
          // Debounce state storing.
          if (this._storeTimeoutId !== null) {
            clearTimeout(this._storeTimeoutId);
          }
          this._storeTimeoutId = window.setTimeout(() => {
            storeState(this, false).catch((e) =>
              console.error("Error storing state:", e)
            );
            this._storeTimeoutId = null;
          }, this._storeTimeout);
        }
      })
      .catch((e) => console.error("Error storing update:", e));
  }

  /**
   * Destroys this persistence instance (removes event listeners, cancels timeouts).
   */
  public destroy(): Promise<void> {
    if (this._storeTimeoutId !== null) {
      clearTimeout(this._storeTimeoutId);
      this._storeTimeoutId = null;
    }
    this.doc.off("update", this._storeUpdate);
    this.doc.off("destroy", this.destroy);
    this._destroyed = true;
    return Promise.resolve();
  }

  /**
   * Clears all persisted data (updates and custom entries) for this document.
   */
  public clearData(): Promise<void> {
    return this.destroy().then(() => clearDocument(this.name));
  }
}
