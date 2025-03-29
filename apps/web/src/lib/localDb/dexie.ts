import Dexie from "dexie";

// Setup database
export const dexie = new Dexie("libra-local-db");

dexie.version(1).stores({
  collections:
    "id, title, ownerId, createdAt, updatedAt, serverCreatedAt, serverUpdatedAt",
  collectionMembers: "id, userId, collectionId, canEdit",
  notes:
    "id, title, description, ownerId, collectionId, createdAt, updatedAt, serverCreatedAt, serverUpdatedAt",
  noteCollaborators: "id, noteId, userId, canEdit",
  actionQueue: "id, relatedEntityId, type, status, createdAt",
});
