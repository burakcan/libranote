/*
  Warnings:

  - You are about to drop the `y_doc_state` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "y_doc_state";

-- DropEnum
DROP TYPE "YDocType";

-- CreateTable
CREATE TABLE "note_y_doc_state" (
    "id" TEXT NOT NULL,
    "encodedDoc" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "noteId" TEXT NOT NULL,

    CONSTRAINT "note_y_doc_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "note_y_doc_state_noteId_id_key" ON "note_y_doc_state"("noteId", "id");

-- AddForeignKey
ALTER TABLE "note_y_doc_state" ADD CONSTRAINT "note_y_doc_state_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
