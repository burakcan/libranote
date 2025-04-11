/*
  Warnings:

  - You are about to drop the column `canEdit` on the `note_collaborator` table. All the data in the column will be lost.
  - Added the required column `role` to the `note_collaborator` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NoteCollaboratorRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- AlterTable
ALTER TABLE "note_collaborator" DROP COLUMN "canEdit",
ADD COLUMN     "role" "NoteCollaboratorRole" NOT NULL;
