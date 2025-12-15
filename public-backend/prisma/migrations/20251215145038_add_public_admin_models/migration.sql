-- CreateTable
CREATE TABLE "public_admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_admin_sessions" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_admin_activity_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_admin_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "public_admins_email_key" ON "public_admins"("email");

-- CreateIndex
CREATE INDEX "public_admins_email_idx" ON "public_admins"("email");

-- CreateIndex
CREATE INDEX "public_admins_role_idx" ON "public_admins"("role");

-- CreateIndex
CREATE INDEX "public_admins_isActive_idx" ON "public_admins"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "public_admin_sessions_token_key" ON "public_admin_sessions"("token");

-- CreateIndex
CREATE INDEX "public_admin_sessions_adminId_idx" ON "public_admin_sessions"("adminId");

-- CreateIndex
CREATE INDEX "public_admin_sessions_token_idx" ON "public_admin_sessions"("token");

-- CreateIndex
CREATE INDEX "public_admin_sessions_expiresAt_idx" ON "public_admin_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "public_admin_activity_logs_adminId_idx" ON "public_admin_activity_logs"("adminId");

-- CreateIndex
CREATE INDEX "public_admin_activity_logs_resource_resourceId_idx" ON "public_admin_activity_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "public_admin_activity_logs_createdAt_idx" ON "public_admin_activity_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "public_admin_sessions" ADD CONSTRAINT "public_admin_sessions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_admin_activity_logs" ADD CONSTRAINT "public_admin_activity_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
