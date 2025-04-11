/*
  Warnings:

  - You are about to drop the column `ownerId` on the `note` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `note` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "note" DROP CONSTRAINT "note_ownerId_fkey";

-- AlterTable
ALTER TABLE "note" DROP COLUMN "ownerId",
ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
