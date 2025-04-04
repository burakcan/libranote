export type ActionQueueItemType =
  | "CREATE_COLLECTION"
  | "DELETE_COLLECTION"
  | "UPDATE_COLLECTION"
  | "CREATE_NOTE"
  | "DELETE_NOTE"
  | "UPDATE_NOTE";

export type ActionQueueItemStatus =
  | "pending"
  | "processing"
  | "completed"
  | "error";

export interface ActionQueueItem {
  id: string;
  type: ActionQueueItemType;
  relatedEntityId: string;
  status: ActionQueueItemStatus;
  createdAt: Date;
  error?: string;
}
