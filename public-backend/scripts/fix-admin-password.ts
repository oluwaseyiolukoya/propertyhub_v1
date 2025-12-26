import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const email = process.env.EMAIL || "admin@contrezz.com";
    const password = process.env.PASSWORD || "admin123";

    const admin = await prisma.public_admins.findUnique({
      where: { email },
    });

    if (!admin) {
      console.log("❌ Admin not found. Creating...");
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.public_admins.create({
        data: {
          email,
          name: "Admin User",
          password: hashedPassword,
          role: "admin",
          isActive: true,
        },
      });
      console.log(`✅ Admin created with password: ${password}`);
    } else {
      console.log(`✅ Admin found. Updating password to: ${password}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.public_admins.update({
        where: { email },
        data: { password: hashedPassword },
      });
      console.log("✅ Password updated successfully");
    }

    // Verify
    const updated = await prisma.public_admins.findUnique({
      where: { email },
    });
    if (updated?.password) {
      const isValid = await bcrypt.compare(password, updated.password);
      console.log("✅ Password verification:", isValid ? "PASSED" : "FAILED");
    }

    console.log("\n📋 Login Credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
