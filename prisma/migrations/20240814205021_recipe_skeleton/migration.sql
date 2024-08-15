-- CreateTable
CREATE TABLE "Recipes" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "nutrientsId" INTEGER NOT NULL,
    "description" TEXT,
    "ingredients" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nutrients" (
    "id" SERIAL NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "carbohydrates" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL,
    "sugar" DOUBLE PRECISION NOT NULL,
    "sodium" DOUBLE PRECISION NOT NULL,
    "vitamins" TEXT NOT NULL,
    "minerals" TEXT NOT NULL,

    CONSTRAINT "Nutrients_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Recipes" ADD CONSTRAINT "Recipes_nutrientsId_fkey" FOREIGN KEY ("nutrientsId") REFERENCES "Nutrients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
