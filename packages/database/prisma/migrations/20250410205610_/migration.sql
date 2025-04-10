-- DropForeignKey
ALTER TABLE "note_y_doc_state" DROP CONSTRAINT "note_y_doc_state_noteId_fkey";

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_id_fkey" FOREIGN KEY ("id") REFERENCES "note_y_doc_state"("id") ON DELETE CASCADE ON UPDATE CASCADE;
