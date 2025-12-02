import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("\n🔍 CHECKING LEASE CURRENCY\n");
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
      select: {
        id: true,
        name: true,
        currency: true,
        leases: {
          select: {
            id: true,
            leaseNumber: true,
            currency: true,
            users: {
              select: { name: true },
            },
          },
        },
      },
    });

    console.log(`\n🏢 Properties: ${properties.length}\n`);

    if (properties.length === 0) {
      console.log("❌ No properties found");
      return;
    }

    properties.forEach((property, i) => {
      console.log(`${i + 1}. Property: ${property.name}`);
      console.log(`   ID: ${property.id}`);
      console.log(`   Currency: ${property.currency || "NULL"}`);
      console.log(`   Leases: ${property.leases.length}`);

      if (property.leases.length > 0) {
        property.leases.forEach((lease, j) => {
          console.log(
            `      ${j + 1}. Lease ${lease.leaseNumber} - Tenant: ${lease.users?.name || "N/A"}`
          );
          console.log(`         Currency: ${lease.currency || "NULL"}`);
        });
      }
      console.log("");
    });

    // Check if any have wrong currency
    const wrongPropertyCurrency = properties.filter(
      (p) => p.currency && p.currency !== "NGN"
    );
    const wrongLeaseCurrency: any[] = [];

    properties.forEach((property) => {
      property.leases.forEach((lease) => {
        if (lease.currency && lease.currency !== "NGN") {
          wrongLeaseCurrency.push({
            propertyName: property.name,
            leaseNumber: lease.leaseNumber,
            leaseId: lease.id,
            currency: lease.currency,
          });
        }
      });
    });

    if (wrongPropertyCurrency.length > 0 || wrongLeaseCurrency.length > 0) {
      console.log("=".repeat(80));
      console.log("\n⚠️  FOUND CURRENCY ISSUES:\n");

      if (wrongPropertyCurrency.length > 0) {
        console.log(`📍 Properties with non-NGN currency:\n`);
        wrongPropertyCurrency.forEach((property, i) => {
          console.log(`${i + 1}. ${property.name}`);
          console.log(`   ID: ${property.id}`);
          console.log(`   Currency: ${property.currency} (should be NGN)`);
        });
        console.log("\n💡 FIX Properties:");
        console.log("```sql");
        wrongPropertyCurrency.forEach((property) => {
          console.log(
            `UPDATE properties SET currency = 'NGN' WHERE id = '${property.id}';`
          );
        });
        console.log("```\n");
      }

      if (wrongLeaseCurrency.length > 0) {
        console.log(`📄 Leases with non-NGN currency:\n`);
        wrongLeaseCurrency.forEach((lease, i) => {
          console.log(`${i + 1}. ${lease.propertyName} - ${lease.leaseNumber}`);
          console.log(`   ID: ${lease.leaseId}`);
          console.log(`   Currency: ${lease.currency} (should be NGN)`);
        });
        console.log("\n💡 FIX Leases:");
        console.log("```sql");
        wrongLeaseCurrency.forEach((lease) => {
          console.log(
            `UPDATE leases SET currency = 'NGN' WHERE id = '${lease.leaseId}';`
          );
        });
        console.log("```\n");
      }
    } else {
      console.log("✅ All properties and leases have correct currency (NGN or NULL)\n");
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

