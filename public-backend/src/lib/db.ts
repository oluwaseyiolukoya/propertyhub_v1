import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load environment variables before initializing Prisma
dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Verify DATABASE_URL is set (Prisma reads PUBLIC_DATABASE_URL from schema.prisma)
if (!process.env.PUBLIC_DATABASE_URL) {
  console.error("❌ PUBLIC_DATABASE_URL is not set in environment variables");
  console.error("Please check your .env file in the public-backend directory");
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
