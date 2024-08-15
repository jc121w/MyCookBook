/*
  Warnings:

  - Added the required column `src` to the `Recipes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Recipes" ADD COLUMN     "src" TEXT NOT NULL;
