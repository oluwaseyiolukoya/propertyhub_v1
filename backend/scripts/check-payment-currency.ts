import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("\n🔍 CHECKING PAYMENT CURRENCY\n");
    console.log("=".repeat(80));

    // Find the owner
    const owner = await prisma.users.findFirst({
      where: { email: "olukoyaseyifunmi@gmail.com" },
      select: { id: true, email: true, name: true },
    });

    if (!owner) {
      console.log("❌ Owner not found");
      return;
    }

    console.log(`\n👤 Owner: ${owner.email} (${owner.name})`);
    console.log(`   ID: ${owner.id}`);

    // Find properties
    const properties = await prisma.properties.findMany({
      where: { ownerId: owner.id },
      select: { id: true, name: true },
    });

    console.log(`\n🏢 Properties: ${properties.length}`);
    properties.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.id})`);
    });

    if (properties.length === 0) {
      console.log("❌ No properties found");
      return;
    }

    const propertyIds = properties.map((p) => p.id);

    // Find all payments
    const payments = await prisma.payments.findMany({
      where: { propertyId: { in: propertyIds } },
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        type: true,
        paidAt: true,
        createdAt: true,
        properties: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`\n💰 Payments: ${payments.length}\n`);

    if (payments.length === 0) {
      console.log("❌ No payments found");
      return;
    }

    payments.forEach((payment, i) => {
      console.log(`${i + 1}. Payment ID: ${payment.id}`);
      console.log(`   Property: ${payment.properties?.name || "N/A"}`);
      console.log(`   Amount: ${Number(payment.amount).toFixed(2)}`);
      console.log(`   Currency: ${payment.currency || "NULL"}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Type: ${payment.type || "NULL"}`);
      console.log(
        `   Paid At: ${payment.paidAt ? new Date(payment.paidAt).toISOString() : "NULL"}`
      );
      console.log(`   Created: ${new Date(payment.createdAt).toISOString()}`);
      console.log("");
    });

    // Check if any have wrong currency
    const wrongCurrency = payments.filter(
      (p) => p.currency && p.currency !== "NGN"
    );

    if (wrongCurrency.length > 0) {
      console.log("=".repeat(80));
      console.log(`\n⚠️  FOUND ${wrongCurrency.length} PAYMENT(S) WITH NON-NGN CURRENCY:\n`);

      wrongCurrency.forEach((payment, i) => {
        console.log(`${i + 1}. Payment ${payment.id}`);
        console.log(`   Currency: ${payment.currency} (should be NGN)`);
        console.log(`   Amount: ${Number(payment.amount).toFixed(2)}`);
      });

      console.log("\n💡 FIX: Update currency to NGN:");
      console.log("\n```sql");
      wrongCurrency.forEach((payment) => {
        console.log(
          `UPDATE payments SET currency = 'NGN' WHERE id = '${payment.id}';`
        );
      });
      console.log("```\n");
    } else {
      console.log("✅ All payments have correct currency (NGN or NULL)\n");
    }

    console.log("=".repeat(80));
    console.log("\n✅ Check complete!\n");
  } catch (error) {
    console.error("\n❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

