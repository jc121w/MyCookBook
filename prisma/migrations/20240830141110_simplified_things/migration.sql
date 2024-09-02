/*
  Warnings:

  - You are about to drop the column `nutritionId` on the `Ingredient` table. All the data in the column will be lost.
  - You are about to drop the column `nutritionId` on the `Nutrient` table. All the data in the column will be lost.
  - You are about to drop the column `instructionId` on the `Step` table. All the data in the column will be lost.
  - You are about to drop the `CaloricBreakdown` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Instruction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Nutrition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Recipes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `recipeId` to the `Ingredient` table without a default value. This is not possible if the table is not empty.
  - Made the column `stepId` on table `Ingredient` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `recipeId` to the `Nutrient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipeId` to the `Step` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CaloricBreakdown" DROP CONSTRAINT "CaloricBreakdown_nutritionId_fkey";

-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_nutritionId_fkey";

-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_stepId_fkey";

-- DropForeignKey
ALTER TABLE "Instruction" DROP CONSTRAINT "Instruction_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "Nutrient" DROP CONSTRAINT "Nutrient_nutritionId_fkey";

-- DropForeignKey
ALTER TABLE "Recipes" DROP CONSTRAINT "Recipes_nutritionId_fkey";

-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_instructionId_fkey";

-- AlterTable
ALTER TABLE "Ingredient" DROP COLUMN "nutritionId",
ADD COLUMN     "recipeId" INTEGER NOT NULL,
ALTER COLUMN "stepId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Nutrient" DROP COLUMN "nutritionId",
ADD COLUMN     "recipeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Step" DROP COLUMN "instructionId",
ADD COLUMN     "recipeId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "CaloricBreakdown";

-- DropTable
DROP TABLE "Instruction";

-- DropTable
DROP TABLE "Nutrition";

-- DropTable
DROP TABLE "Recipes";

-- CreateTable
CREATE TABLE "Recipe" (
    "id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "cheap" BOOLEAN NOT NULL,
    "readyInMinutes" INTEGER NOT NULL,
    "servings" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Nutrient" ADD CONSTRAINT "Nutrient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
