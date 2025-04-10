/*
  Warnings:

  - You are about to drop the column `noteId` on the `note_y_doc_state` table. All the data in the column will be lost.
  - Added the required column `noteYDocStateId` to the `note` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "note" DROP CONSTRAINT "note_id_fkey";

-- DropIndex
DROP INDEX "note_y_doc_state_noteId_id_key";

-- AlterTable
ALTER TABLE "note" ADD COLUMN     "noteYDocStateId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "note_y_doc_state" DROP COLUMN "noteId";

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_noteYDocStateId_fkey" FOREIGN KEY ("noteYDocStateId") REFERENCES "note_y_doc_state"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
