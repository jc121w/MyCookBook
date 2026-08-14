/*
  Warnings:

  - The primary key for the `Recipe` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cheap` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `readyInMinutes` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `servings` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Recipe` table. All the data in the column will be lost.
  - You are about to drop the `Ingredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Nutrient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Step` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `calories` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `label` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalNutrients` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTime` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Recipe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yield` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "Nutrient" DROP CONSTRAINT "Nutrient_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_recipeId_fkey";

-- AlterTable
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_pkey",
DROP COLUMN "cheap",
DROP COLUMN "readyInMinutes",
DROP COLUMN "servings",
DROP COLUMN "summary",
DROP COLUMN "title",
ADD COLUMN     "calories" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cuisineType" TEXT[],
ADD COLUMN     "dietLabels" TEXT[],
ADD COLUMN     "dishType" TEXT[],
ADD COLUMN     "healthLabels" TEXT[],
ADD COLUMN     "ingredientLines" TEXT[],
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "mealType" TEXT[],
ADD COLUMN     "raw" JSONB,
ADD COLUMN     "source" TEXT NOT NULL,
ADD COLUMN     "totalNutrients" JSONB NOT NULL,
ADD COLUMN     "totalTime" INTEGER NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL,
ADD COLUMN     "yield" INTEGER NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Ingredient";

-- DropTable
DROP TABLE "Nutrient";

-- DropTable
DROP TABLE "Step";
