-- Production Setup for Landing Page Submissions
-- Run this script on your production database if tables don't exist

-- Check if tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'landing_page_submissions') THEN
        RAISE NOTICE 'Creating landing_page_submissions table...';

        -- Create landing_page_submissions table
        CREATE TABLE "public"."landing_page_submissions" (
            "id" TEXT NOT NULL,
            "ticketNumber" SERIAL NOT NULL,
            "formType" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "phone" TEXT,
            "company" TEXT,
            "jobTitle" TEXT,
            "subject" TEXT,
            "message" TEXT NOT NULL,
            "preferredDate" TIMESTAMP(3),
            "preferredTime" TEXT,
            "timezone" TEXT,
            "status" TEXT NOT NULL DEFAULT 'new',
            "priority" TEXT NOT NULL DEFAULT 'normal',
            "source" TEXT,
            "referralUrl" TEXT,
            "utmSource" TEXT,
            "utmMedium" TEXT,
            "utmCampaign" TEXT,
            "assignedToId" TEXT,
            "adminNotes" TEXT,
            "internalTags" TEXT[],
            "responseStatus" TEXT,
            "responseDate" TIMESTAMP(3),
            "responseBy" TEXT,
            "responseNotes" TEXT,
            "ipAddress" TEXT,
            "userAgent" TEXT,
            "browserInfo" JSONB,
            "deviceInfo" JSONB,
            "customFields" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "contactedAt" TIMESTAMP(3),
            "resolvedAt" TIMESTAMP(3),
            "deletedAt" TIMESTAMP(3),

            CONSTRAINT "landing_page_submissions_pkey" PRIMARY KEY ("id")
        );

        -- Create unique constraint on ticketNumber
        ALTER TABLE "public"."landing_page_submissions"
        ADD CONSTRAINT "landing_page_submissions_ticketNumber_key" UNIQUE ("ticketNumber");

        -- Create indexes
        CREATE INDEX "landing_page_submissions_formType_idx" ON "public"."landing_page_submissions"("formType");
        CREATE INDEX "landing_page_submissions_status_idx" ON "public"."landing_page_submissions"("status");
        CREATE INDEX "landing_page_submissions_priority_idx" ON "public"."landing_page_submissions"("priority");
        CREATE INDEX "landing_page_submissions_email_idx" ON "public"."landing_page_submissions"("email");
        CREATE INDEX "landing_page_submissions_createdAt_idx" ON "public"."landing_page_submissions"("createdAt");
        CREATE INDEX "landing_page_submissions_assignedToId_idx" ON "public"."landing_page_submissions"("assignedToId");
        CREATE INDEX "landing_page_submissions_responseStatus_idx" ON "public"."landing_page_submissions"("responseStatus");

        RAISE NOTICE 'landing_page_submissions table created successfully!';
    ELSE
        RAISE NOTICE 'landing_page_submissions table already exists.';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'submission_responses') THEN
        RAISE NOTICE 'Creating submission_responses table...';

        -- Create submission_responses table
        CREATE TABLE "public"."submission_responses" (
            "id" TEXT NOT NULL,
            "submissionId" TEXT NOT NULL,
            "responseType" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "respondedById" TEXT NOT NULL,
            "attachments" JSONB,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "submission_responses_pkey" PRIMARY KEY ("id")
        );

        -- Create indexes
        CREATE INDEX "submission_responses_submissionId_idx" ON "public"."submission_responses"("submissionId");
        CREATE INDEX "submission_responses_respondedById_idx" ON "public"."submission_responses"("respondedById");
        CREATE INDEX "submission_responses_createdAt_idx" ON "public"."submission_responses"("createdAt");

        -- Add foreign key constraints
        ALTER TABLE "public"."submission_responses"
        ADD CONSTRAINT "submission_responses_submissionId_fkey"
        FOREIGN KEY ("submissionId")
        REFERENCES "public"."landing_page_submissions"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;

        ALTER TABLE "public"."submission_responses"
        ADD CONSTRAINT "submission_responses_respondedById_fkey"
        FOREIGN KEY ("respondedById")
        REFERENCES "public"."users"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;

        RAISE NOTICE 'submission_responses table created successfully!';
    ELSE
        RAISE NOTICE 'submission_responses table already exists.';
    END IF;

    -- Add foreign key constraints to landing_page_submissions if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'landing_page_submissions_assignedToId_fkey'
    ) THEN
        ALTER TABLE "public"."landing_page_submissions"
        ADD CONSTRAINT "landing_page_submissions_assignedToId_fkey"
        FOREIGN KEY ("assignedToId")
        REFERENCES "public"."users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

        RAISE NOTICE 'Added assignedToId foreign key constraint.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'landing_page_submissions_responseBy_fkey'
    ) THEN
        ALTER TABLE "public"."landing_page_submissions"
        ADD CONSTRAINT "landing_page_submissions_responseBy_fkey"
        FOREIGN KEY ("responseBy")
        REFERENCES "public"."users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

        RAISE NOTICE 'Added responseBy foreign key constraint.';
    END IF;

    RAISE NOTICE '✅ All tables and constraints are set up correctly!';
END $$;

-- Verify tables exist
SELECT
    'landing_page_submissions' as table_name,
    COUNT(*) as row_count
FROM landing_page_submissions
UNION ALL
SELECT
    'submission_responses' as table_name,
    COUNT(*) as row_count
FROM submission_responses;

