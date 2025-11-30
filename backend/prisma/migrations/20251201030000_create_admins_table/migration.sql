-- CreateTable: admins
CREATE TABLE IF NOT EXISTS "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'super_admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "admins_email_key" ON "admins"("email");

-- Seed default admin user (password: Admin@123456)
INSERT INTO "admins" ("id", "email", "password", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'admin@contrezz.com',
    '$2a$10$fKlVOPSlQvffp6RRK7x9zuTpgTql4goEnx55kvcNo6Ll6cCizrOb2',
    'Admin User',
    'super_admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

