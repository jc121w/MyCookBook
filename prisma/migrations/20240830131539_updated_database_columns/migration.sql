/*
  Warnings:

  - You are about to drop the column `calories` on the `Recipes` table. All the data in the column will be lost.
  - You are about to drop the column `ingredients` on the `Recipes` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `Recipes` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Recipes` table. All the data in the column will be lost.
  - You are about to drop the column `src` on the `Recipes` table. All the data in the column will be lost.
  - You are about to drop the `Nutrients` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nutritionId]` on the table `Recipes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cheap` to the `Recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nutritionId` to the `Recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `readyInMinutes` to the `Recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `servings` to the `Recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `Recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Recipes` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Recipes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
CREATE SEQUENCE recipes_id_seq;
ALTER TABLE "Recipes" DROP COLUMN "calories",
DROP COLUMN "ingredients",
DROP COLUMN "instructions",
DROP COLUMN "name",
DROP COLUMN "src",
ADD COLUMN     "cheap" BOOLEAN NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "nutritionId" INTEGER NOT NULL,
ADD COLUMN     "readyInMinutes" INTEGER NOT NULL,
ADD COLUMN     "servings" INTEGER NOT NULL,
ADD COLUMN     "summary" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "id" SET DEFAULT nextval('recipes_id_seq'),
ALTER COLUMN "description" SET NOT NULL;
ALTER SEQUENCE recipes_id_seq OWNED BY "Recipes"."id";

-- DropTable
DROP TABLE "Nutrients";

-- CreateTable
CREATE TABLE "Nutrition" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "Nutrition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutrient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "nutritionId" INTEGER NOT NULL,

    CONSTRAINT "Nutrient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "nutritionId" INTEGER NOT NULL,
    "stepId" INTEGER,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaloricBreakdown" (
    "id" SERIAL NOT NULL,
    "percentCarbs" DOUBLE PRECISION NOT NULL,
    "percentFat" DOUBLE PRECISION NOT NULL,
    "percentProtein" DOUBLE PRECISION NOT NULL,
    "nutritionId" INTEGER NOT NULL,

    CONSTRAINT "CaloricBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instruction" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,

    CONSTRAINT "Instruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "step" TEXT NOT NULL,
    "instructionId" INTEGER NOT NULL,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CaloricBreakdown_nutritionId_key" ON "CaloricBreakdown"("nutritionId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipes_nutritionId_key" ON "Recipes"("nutritionId");

-- AddForeignKey
ALTER TABLE "Recipes" ADD CONSTRAINT "Recipes_nutritionId_fkey" FOREIGN KEY ("nutritionId") REFERENCES "Nutrition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nutrient" ADD CONSTRAINT "Nutrient_nutritionId_fkey" FOREIGN KEY ("nutritionId") REFERENCES "Nutrition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_nutritionId_fkey" FOREIGN KEY ("nutritionId") REFERENCES "Nutrition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaloricBreakdown" ADD CONSTRAINT "CaloricBreakdown_nutritionId_fkey" FOREIGN KEY ("nutritionId") REFERENCES "Nutrition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instruction" ADD CONSTRAINT "Instruction_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "Instruction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
