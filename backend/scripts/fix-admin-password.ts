import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.users.findUnique({
      where: { email: "admin@contrezz.com" },
    });

    if (!admin) {
      console.log("❌ Admin not found. Creating...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await prisma.users.create({
        data: {
          id: "admin-1",
          email: "admin@contrezz.com",
          name: "Super Admin",
          password: hashedPassword,
          role: "super_admin",
          customerId: null,
          isActive: true,
          status: "active",
        },
      });
      console.log("✅ Admin created with password: admin123");
    } else {
      console.log("✅ Admin found. Updating password to: admin123");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await prisma.users.update({
        where: { email: "admin@contrezz.com" },
        data: { password: hashedPassword },
      });
      console.log("✅ Password updated successfully");
    }

    // Verify
    const updated = await prisma.users.findUnique({
      where: { email: "admin@contrezz.com" },
    });
    if (updated?.password) {
      const isValid = await bcrypt.compare("admin123", updated.password);
      console.log("✅ Password verification:", isValid ? "PASSED" : "FAILED");
    }

    await prisma.$disconnect();
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
