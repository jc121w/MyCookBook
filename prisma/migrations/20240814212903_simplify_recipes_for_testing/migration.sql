/*
  Warnings:

  - You are about to drop the column `nutrientsId` on the `Recipes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Recipes" DROP CONSTRAINT "Recipes_nutrientsId_fkey";

-- AlterTable
ALTER TABLE "Recipes" DROP COLUMN "nutrientsId";
