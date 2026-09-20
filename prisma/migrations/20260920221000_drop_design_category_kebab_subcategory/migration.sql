-- Convert subcategory from enum (SCREAMING_SNAKE_CASE) to kebab-case String.
ALTER TABLE "DesignProject" ADD COLUMN "subcategory_new" TEXT;

UPDATE "DesignProject"
SET "subcategory_new" = lower(replace("subcategory"::text, '_', '-'));

ALTER TABLE "DesignProject" DROP COLUMN "subcategory";
ALTER TABLE "DesignProject" RENAME COLUMN "subcategory_new" TO "subcategory";
ALTER TABLE "DesignProject" ALTER COLUMN "subcategory" SET NOT NULL;

-- Drop redundant category column
ALTER TABLE "DesignProject" DROP COLUMN "category";

-- Drop unused enum type
DROP TYPE "DesignSubcategory";
