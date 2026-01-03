-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50),
    "subject" VARCHAR(500) NOT NULL,
    "body_html" TEXT NOT NULL,
    "body_text" TEXT,
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_type_key" ON "email_templates"("type");

-- CreateIndex
CREATE INDEX "email_templates_type_idx" ON "email_templates"("type");

-- CreateIndex
CREATE INDEX "email_templates_is_active_idx" ON "email_templates"("is_active");

-- CreateIndex
CREATE INDEX "email_templates_category_idx" ON "email_templates"("category");

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

