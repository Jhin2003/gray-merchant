/*
  Warnings:

  - You are about to drop the column `setCode` on the `Card` table. All the data in the column will be lost.
  - Added the required column `setName` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" DROP COLUMN "setCode",
ADD COLUMN     "setName" TEXT NOT NULL;
