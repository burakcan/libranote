namespace ActionQueue {
  type ItemType =
    | "CREATE_COLLECTION"
    | "DELETE_COLLECTION"
    | "CREATE_NOTE"
    | "DELETE_NOTE";

  interface Item {
    type: ItemType;
    id: string;
    status: "pending" | "processing";
    createdAt: Date;
    relatedEntityId: string;
  }
}
