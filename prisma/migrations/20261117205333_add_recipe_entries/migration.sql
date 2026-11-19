-- CreateTable
CREATE TABLE "RecipeEntry" (
    "id" SERIAL NOT NULL,
    "recipeId" INTEGER NOT NULL,
    "cookedOn" DATE NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeEntry_recipeId_idx" ON "RecipeEntry"("recipeId");

-- AddForeignKey
ALTER TABLE "RecipeEntry" ADD CONSTRAINT "RecipeEntry_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
