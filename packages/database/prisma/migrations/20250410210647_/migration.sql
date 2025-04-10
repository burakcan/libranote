/*
  Warnings:

  - You are about to drop the column `noteYDocStateId` on the `note` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "note" DROP CONSTRAINT "note_noteYDocStateId_fkey";

-- AlterTable
ALTER TABLE "note" DROP COLUMN "noteYDocStateId";

-- AddForeignKey
ALTER TABLE "note_y_doc_state" ADD CONSTRAINT "note_y_doc_state_id_fkey" FOREIGN KEY ("id") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
