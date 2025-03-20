/*
  Warnings:

  - You are about to drop the column `organizationId` on the `note` table. All the data in the column will be lost.
  - You are about to drop the column `activeOrganizationId` on the `session` table. All the data in the column will be lost.
  - You are about to drop the `invitation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_inviterId_fkey";

-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "member" DROP CONSTRAINT "member_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "member" DROP CONSTRAINT "member_userId_fkey";

-- DropForeignKey
ALTER TABLE "note" DROP CONSTRAINT "note_organizationId_fkey";

-- AlterTable
ALTER TABLE "note" DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "session" DROP COLUMN "activeOrganizationId";

-- DropTable
DROP TABLE "invitation";

-- DropTable
DROP TABLE "member";

-- DropTable
DROP TABLE "organization";
