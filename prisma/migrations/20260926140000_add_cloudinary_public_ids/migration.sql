-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "coverImageId" TEXT;

-- AlterTable
ALTER TABLE "Painting" ADD COLUMN "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "ExhibitionImage" ADD COLUMN "publicId" TEXT;

-- AlterTable
ALTER TABLE "DesignProject" ADD COLUMN "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "Illustration" ADD COLUMN "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "Biography" ADD COLUMN "imagePublicId" TEXT;
