/*
  Warnings:

  - You are about to drop the column `stepId` on the `Ingredient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_stepId_fkey";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "stepId";

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "stepIngredients" TEXT[];
