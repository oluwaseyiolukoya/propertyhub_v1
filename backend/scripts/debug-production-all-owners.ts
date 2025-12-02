import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper functions to replace date-fns
function getMonthName(monthIndex: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthIndex];
}

function getYearStart(year: number): Date {
  return new Date(year, 0, 1, 0, 0, 0, 0);
}

function getYearEnd(year: number): Date {
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

async function main() {
  try {
    console.log("\n🔍 PRODUCTION DEBUG REPORT - ALL OWNERS\n");
    console.log("=".repeat(80));
    console.log(`\n📍 Environment: PRODUCTION`);
    console.log(`🔗 Database: ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "Unknown"}`);
    console.log(`⏰ Current Time: ${new Date().toISOString()}`);

    // Get all owners
    const owners = await prisma.users.findMany({
      where: { role: "owner" },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`\n👥 Total owners: ${owners.length}\n`);

    if (owners.length === 0) {
      console.log("❌ NO OWNERS FOUND!\n");
      return;
    }

    // Check each owner
    for (const owner of owners) {
      console.log("=".repeat(80));
      console.log(`\n👤 OWNER: ${owner.email} (${owner.name})`);
      console.log(`   ID: ${owner.id}`);
      console.log(`   Created: ${new Date(owner.createdAt).toLocaleDateString()}\n`);

      // Check properties
      const properties = await prisma.properties.findMany({
        where: { ownerId: owner.id },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              units: true,
              leases: true,
            },
          },
        },
      });

      console.log(`   🏢 Properties: ${properties.length}`);

      if (properties.length === 0) {
        console.log("   ❌ No properties found for this owner\n");
        continue;
      }

      properties.forEach((prop, i) => {
        console.log(`      ${i + 1}. ${prop.name} (${prop._count.units} units, ${prop._count.leases} leases)`);
      });

      const propertyIds = properties.map((p) => p.id);

      // Check payments
      const allPayments = await prisma.payments.count({
        where: { propertyId: { in: propertyIds } },
      });

      const chartPayments = await prisma.payments.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: "success",
          NOT: { type: "subscription" },
          paidAt: { not: null },
        },
        select: {
          amount: true,
          type: true,
          paidAt: true,
        },
        orderBy: { paidAt: "desc" },
        take: 5,
      });

      console.log(`\n   💰 Payments:`);
      console.log(`      Total: ${allPayments}`);
      console.log(`      Chart-eligible: ${chartPayments.length}`);

      if (chartPayments.length > 0) {
        console.log(`      Recent chart-eligible payments:`);
        chartPayments.forEach((payment, i) => {
          console.log(
            `         ${i + 1}. ${payment.type} - ${Number(payment.amount).toFixed(2)} (${new Date(payment.paidAt!).toLocaleDateString()})`
          );
        });
      }

      // Check expenses
      const allExpenses = await prisma.expenses.count({
        where: { propertyId: { in: propertyIds } },
      });

      const chartExpenses = await prisma.expenses.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ["paid", "pending"] },
        },
        select: {
          amount: true,
          category: true,
          date: true,
        },
        orderBy: { date: "desc" },
        take: 5,
      });

      console.log(`\n   💸 Expenses:`);
      console.log(`      Total: ${allExpenses}`);
      console.log(`      Chart-eligible: ${chartExpenses.length}`);

      if (chartExpenses.length > 0) {
        console.log(`      Recent chart-eligible expenses:`);
        chartExpenses.forEach((expense, i) => {
          console.log(
            `         ${i + 1}. ${expense.category} - ${Number(expense.amount).toFixed(2)} (${new Date(expense.date).toLocaleDateString()})`
          );
        });
      }

      // Simulate monthly revenue data
      const currentYear = new Date().getFullYear();
      const yearStart = getYearStart(currentYear);
      const yearEnd = getYearEnd(currentYear);

      const yearPayments = await prisma.payments.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: "success",
          NOT: { type: "subscription" },
          paidAt: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        select: {
          amount: true,
          paidAt: true,
        },
      });

      const yearExpenses = await prisma.expenses.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ["paid", "pending"] },
          date: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        select: {
          amount: true,
          date: true,
        },
      });

      // Group by month
      const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};

      for (let month = 0; month < 12; month++) {
        const monthKey = getMonthName(month);
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }

      yearPayments.forEach((payment) => {
        const paidDate = new Date(payment.paidAt!);
        const monthKey = getMonthName(paidDate.getMonth());
        monthlyData[monthKey].revenue += Number(payment.amount);
      });

      yearExpenses.forEach((expense) => {
        const expenseDate = new Date(expense.date);
        const monthKey = getMonthName(expenseDate.getMonth());
        monthlyData[monthKey].expenses += Number(expense.amount);
      });

      console.log(`\n   📊 Chart Data (${currentYear}):`);
      const hasRevenue = Object.values(monthlyData).some((d) => d.revenue > 0);
      const hasExpenses = Object.values(monthlyData).some((d) => d.expenses > 0);

      if (!hasRevenue && !hasExpenses) {
        console.log(`      ❌ No data for ${currentYear}`);
      } else {
        Object.entries(monthlyData).forEach(([month, data]) => {
          if (data.revenue > 0 || data.expenses > 0) {
            const netIncome = data.revenue - data.expenses;
            console.log(
              `      ${month}: Revenue=${data.revenue.toFixed(0)}, Expenses=${data.expenses.toFixed(0)}, Net=${netIncome.toFixed(0)}`
            );
          }
        });
      }

      // Diagnosis
      console.log(`\n   🔬 DIAGNOSIS:`);
      if (chartPayments.length === 0 && chartExpenses.length === 0) {
        console.log(`      ❌ NO DATA - No chart-eligible payments or expenses`);
      } else if (chartPayments.length === 0 && chartExpenses.length > 0) {
        console.log(`      ❌ EXPENSES ONLY - No revenue, chart shows only green bars`);
        console.log(`      ✅ ACTION: Record successful rent/deposit payments`);
      } else if (chartPayments.length > 0 && chartExpenses.length === 0) {
        console.log(`      ✅ REVENUE ONLY - Chart should show blue bars`);
      } else {
        console.log(`      ✅ REVENUE + EXPENSES - Chart should show both bars`);
      }

      console.log("");
    }

    console.log("=".repeat(80));
    console.log("\n✅ Debug report complete!\n");
  } catch (error) {
    console.error("\n❌ Error running debug script:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

