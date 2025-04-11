/*
  Warnings:

  - A unique constraint covering the columns `[noteId]` on the table `note_y_doc_state` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "note_y_doc_state" DROP CONSTRAINT "note_y_doc_state_id_fkey";

-- DropIndex
DROP INDEX "note_y_doc_state_id_noteId_key";

-- CreateIndex
CREATE UNIQUE INDEX "note_y_doc_state_noteId_key" ON "note_y_doc_state"("noteId");

-- AddForeignKey
ALTER TABLE "note_y_doc_state" ADD CONSTRAINT "note_y_doc_state_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
