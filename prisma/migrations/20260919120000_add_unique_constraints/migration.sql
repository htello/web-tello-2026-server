-- CreateTable
CREATE UNIQUE INDEX "Collection_title_key" ON "Collection"("title");

-- CreateTable
CREATE UNIQUE INDEX "Painting_title_collectionId_key" ON "Painting"("title", "collectionId");
