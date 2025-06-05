-- CreateTable
CREATE TABLE "collection_invitation" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "role" "CollectionMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "collection_invitation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "collection_invitation" ADD CONSTRAINT "collection_invitation_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_invitation" ADD CONSTRAINT "collection_invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
