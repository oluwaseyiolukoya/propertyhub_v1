-- CreateTable
CREATE TABLE "onboarding_applications" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_applications_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "onboarding_applications_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "onboarding_applications_activatedBy_fkey" FOREIGN KEY ("activatedBy") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "onboarding_applications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "onboarding_applications_selectedPlanId_fkey" FOREIGN KEY ("selectedPlanId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "onboarding_applications_status_idx" ON "onboarding_applications"("status");
CREATE INDEX "onboarding_applications_applicationType_idx" ON "onboarding_applications"("applicationType");
CREATE INDEX "onboarding_applications_email_idx" ON "onboarding_applications"("email");
CREATE INDEX "onboarding_applications_createdAt_idx" ON "onboarding_applications"("createdAt");
CREATE INDEX "onboarding_applications_reviewStatus_idx" ON "onboarding_applications"("reviewStatus");

