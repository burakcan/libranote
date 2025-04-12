/*
  Warnings:

  - You are about to drop the column `ownerId` on the `collection` table. All the data in the column will be lost.
  - You are about to drop the column `canEdit` on the `collection_member` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `collection_member` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CollectionMemberRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- DropForeignKey
ALTER TABLE "collection" DROP CONSTRAINT "collection_ownerId_fkey";

-- AlterTable
ALTER TABLE "collection" DROP COLUMN "ownerId",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "collection_member" DROP COLUMN "canEdit",
ADD COLUMN     "role" "CollectionMemberRole" NOT NULL;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
