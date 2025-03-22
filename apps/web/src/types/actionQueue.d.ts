declare namespace ActionQueue {
  type ItemType =
    | "CREATE_COLLECTION"
    | "DELETE_COLLECTION"
    | "UPDATE_COLLECTION"
    | "CREATE_NOTE"
    | "DELETE_NOTE"
    | "UPDATE_NOTE";

  type ItemStatus = "pending" | "processing" | "completed" | "error";

  interface Item {
    id: string;
    type: ItemType;
    relatedEntityId: string;
    status: ItemStatus;
    createdAt: Date;
    error?: string;
  }
}
