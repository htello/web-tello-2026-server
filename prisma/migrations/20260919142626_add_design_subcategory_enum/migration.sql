-- CreateEnum
CREATE TYPE "DesignSubcategory" AS ENUM ('IMAGEN_CORPORATIVA', 'PACKAGING_EXPOSITORES', 'CARTERERIA', 'EDITORIAL');

-- Create temporary column
ALTER TABLE "DesignProject" ADD COLUMN "subcategory_new" "DesignSubcategory";

-- Copy data with conversion using CAST
UPDATE "DesignProject" SET "subcategory_new" = CASE
  WHEN "subcategory" = 'imagen-corporativa' THEN 'IMAGEN_CORPORATIVA'::"DesignSubcategory"
  WHEN "subcategory" = 'packaging-expositores' THEN 'PACKAGING_EXPOSITORES'::"DesignSubcategory"
  WHEN "subcategory" = 'carteleria' THEN 'CARTERERIA'::"DesignSubcategory"
  WHEN "subcategory" = 'editorial' THEN 'EDITORIAL'::"DesignSubcategory"
  ELSE 'IMAGEN_CORPORATIVA'::"DesignSubcategory"
END;

-- Drop old column and rename new
ALTER TABLE "DesignProject" DROP COLUMN "subcategory";
ALTER TABLE "DesignProject" RENAME COLUMN "subcategory_new" TO "subcategory";

-- Set NOT NULL
ALTER TABLE "DesignProject" ALTER COLUMN "subcategory" SET NOT NULL;
