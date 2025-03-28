declare type ClientCollection = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  serverCreatedAt?: Date;
  serverUpdatedAt?: Date;
};

declare type ClientNote = {
  id: string;
  ownerId: string;
  collectionId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  serverCreatedAt?: Date;
  serverUpdatedAt?: Date;
};
