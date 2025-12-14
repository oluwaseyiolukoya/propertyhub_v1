-- CreateTable
CREATE TABLE IF NOT EXISTS "career_postings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "remote" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT[],
    "salary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "postedBy" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "applicationCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "career_postings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_postings_status_idx" ON "career_postings"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_postings_department_idx" ON "career_postings"("department");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_postings_location_idx" ON "career_postings"("location");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_postings_type_idx" ON "career_postings"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_postings_postedAt_idx" ON "career_postings"("postedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "career_postings_expiresAt_idx" ON "career_postings"("expiresAt");
