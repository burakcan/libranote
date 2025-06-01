/*
  Warnings:

  - You are about to drop the column `firstLogin` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "firstLogin",
ADD COLUMN     "onboardingFinished" BOOLEAN NOT NULL DEFAULT false;
