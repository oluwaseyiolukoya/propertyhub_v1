-- Step 1: Add new TEXT columns (nullable)
ALTER TABLE "career_postings"
  ADD COLUMN "requirements_new" TEXT,
  ADD COLUMN "responsibilities_new" TEXT,
  ADD COLUMN "benefits_new" TEXT;

-- Step 2: Convert array data to HTML strings
-- Convert requirements array to HTML list
UPDATE "career_postings"
SET "requirements_new" = CASE
  WHEN "requirements" IS NULL OR array_length("requirements", 1) IS NULL THEN ''
  WHEN array_length("requirements", 1) = 0 THEN ''
  ELSE '<ul>' || array_to_string(
    ARRAY(SELECT '<li>' || unnest("requirements") || '</li>'),
    ''
  ) || '</ul>'
END;

-- Convert responsibilities array to HTML list
UPDATE "career_postings"
SET "responsibilities_new" = CASE
  WHEN "responsibilities" IS NULL OR array_length("responsibilities", 1) IS NULL THEN ''
  WHEN array_length("responsibilities", 1) = 0 THEN ''
  ELSE '<ul>' || array_to_string(
    ARRAY(SELECT '<li>' || unnest("responsibilities") || '</li>'),
    ''
  ) || '</ul>'
END;

-- Convert benefits array to HTML list
UPDATE "career_postings"
SET "benefits_new" = CASE
  WHEN "benefits" IS NULL OR array_length("benefits", 1) IS NULL THEN ''
  WHEN array_length("benefits", 1) = 0 THEN ''
  ELSE '<ul>' || array_to_string(
    ARRAY(SELECT '<li>' || unnest("benefits") || '</li>'),
    ''
  ) || '</ul>'
END;

-- Step 3: Drop old columns
ALTER TABLE "career_postings"
  DROP COLUMN "requirements",
  DROP COLUMN "responsibilities",
  DROP COLUMN "benefits";

-- Step 4: Rename new columns to original names
ALTER TABLE "career_postings"
  RENAME COLUMN "requirements_new" TO "requirements";
ALTER TABLE "career_postings"
  RENAME COLUMN "responsibilities_new" TO "responsibilities";
ALTER TABLE "career_postings"
  RENAME COLUMN "benefits_new" TO "benefits";

-- Step 5: Set default values and make them NOT NULL
ALTER TABLE "career_postings"
  ALTER COLUMN "requirements" SET DEFAULT '',
  ALTER COLUMN "requirements" SET NOT NULL,
  ALTER COLUMN "responsibilities" SET DEFAULT '',
  ALTER COLUMN "responsibilities" SET NOT NULL,
  ALTER COLUMN "benefits" SET DEFAULT '',
  ALTER COLUMN "benefits" SET NOT NULL;
