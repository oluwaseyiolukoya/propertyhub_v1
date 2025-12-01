-- CreateTable (without foreign keys - they will be added by later migrations after referenced tables exist)
CREATE TABLE IF NOT EXISTS "onboarding_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "companyName" TEXT,
    "businessType" TEXT,
    "numberOfProperties" INTEGER,
    "totalUnits" INTEGER,
    "website" TEXT,
    "taxId" TEXT,
    "yearsOfExperience" INTEGER,
    "managementCompany" TEXT,
    "licenseNumber" TEXT,
    "propertiesManaged" INTEGER,
    "currentlyRenting" TEXT,
    "moveInDate" TIMESTAMP(3),
    "employmentStatus" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewStatus" TEXT,
    "reviewNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "selectedPlanId" TEXT,
    "selectedBillingCycle" TEXT,
    "customerId" TEXT UNIQUE,
    "userId" TEXT UNIQUE,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referralSource" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "onboarding_applications_status_idx" ON "onboarding_applications"("status");
CREATE INDEX IF NOT EXISTS "onboarding_applications_applicationType_idx" ON "onboarding_applications"("applicationType");
CREATE INDEX IF NOT EXISTS "onboarding_applications_email_idx" ON "onboarding_applications"("email");
CREATE INDEX IF NOT EXISTS "onboarding_applications_createdAt_idx" ON "onboarding_applications"("createdAt");
CREATE INDEX IF NOT EXISTS "onboarding_applications_reviewStatus_idx" ON "onboarding_applications"("reviewStatus");

