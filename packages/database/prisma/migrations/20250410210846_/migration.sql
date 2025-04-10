/*
  Warnings:

  - A unique constraint covering the columns `[id,noteId]` on the table `note_y_doc_state` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `noteId` to the `note_y_doc_state` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "note_y_doc_state" ADD COLUMN     "noteId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "note_y_doc_state_id_noteId_key" ON "note_y_doc_state"("id", "noteId");
