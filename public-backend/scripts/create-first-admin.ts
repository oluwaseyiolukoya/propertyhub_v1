/**
 * Script to create the first public admin user
 *
 * Usage:
 *   npx tsx scripts/create-first-admin.ts
 *
 * Or with custom values:
 *   EMAIL=admin@contrezz.com NAME="Admin User" PASSWORD=yourpassword npx tsx scripts/create-first-admin.ts
 */

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import * as readline from "readline";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createFirstAdmin() {
  try {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║   Create First Public Admin User      ║");
    console.log("╚════════════════════════════════════════╝\n");

    // Check if any admin already exists
    const existingAdmins = await prisma.public_admins.count();
    if (existingAdmins > 0) {
      console.log("⚠️  Admin users already exist in the database.");
      const proceed = await question(
        "Do you want to create another admin? (yes/no): "
      );
      if (proceed.toLowerCase() !== "yes") {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    // Get admin details
    const email =
      process.env.EMAIL ||
      (await question("Enter admin email: ")) ||
      "admin@contrezz.com";
    const name =
      process.env.NAME ||
      (await question("Enter admin name: ")) ||
      "Admin User";
    let password =
      process.env.PASSWORD || (await question("Enter admin password: "));

    if (!password) {
      console.error("❌ Password is required!");
      process.exit(1);
    }

    // Confirm password
    if (!process.env.PASSWORD) {
      const confirmPassword = await question("Confirm password: ");
      if (password !== confirmPassword) {
        console.error("❌ Passwords do not match!");
        process.exit(1);
      }
    }

    // Validate password strength
    if (password.length < 8) {
      console.error("❌ Password must be at least 8 characters long!");
      process.exit(1);
    }

    // Check if email already exists
    const existing = await prisma.public_admins.findUnique({
      where: { email },
    });

    if (existing) {
      console.error(`❌ Admin with email ${email} already exists!`);
      process.exit(1);
    }

    // Hash password
    console.log("\n🔐 Hashing password...");
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin
    console.log("👤 Creating admin user...");
    const admin = await prisma.public_admins.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "admin", // First admin should be full admin
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log("\n✅ Admin user created successfully!\n");
    console.log("📋 Admin Details:");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive}`);
    console.log(`   Created: ${admin.createdAt.toISOString()}\n`);

    console.log("🔑 You can now log in to the admin interface with:");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: [the password you entered]\n`);

    console.log("🌐 Access the admin interface at:");
    console.log("   Local: http://localhost:5173/admin/login");
    console.log("   Production: https://admin.contrezz.com\n");
  } catch (error: any) {
    console.error("\n❌ Error creating admin:", error.message);
    if (error.code === "P2002") {
      console.error("   This email is already in use.");
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Run the script
createFirstAdmin();
