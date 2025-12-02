/**
 * Production Debugging Script
 * Comprehensive check for production issues
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugProduction() {
  console.log('\n🔍 PRODUCTION DEBUG REPORT\n');
  console.log('='.repeat(80));

  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const isProduction = dbUrl.includes('digitalocean.com');
    
    console.log(`\n📍 Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'}`);
    console.log(`🔗 Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'Unknown'}`);
    console.log(`⏰ Current Time: ${new Date().toISOString()}\n`);

    // 1. Check if we have any owners
    console.log('👥 CHECKING USERS & OWNERS:');
    console.log('-'.repeat(80));
    
    const owners = await prisma.users.findMany({
      where: { role: 'owner' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      }
    });

    console.log(`Total owners: ${owners.length}`);
    owners.forEach((owner, i) => {
      console.log(`${i + 1}. ${owner.email} (${owner.firstName} ${owner.lastName})`);
      console.log(`   ID: ${owner.id}`);
      console.log(`   Created: ${new Date(owner.createdAt).toLocaleDateString()}`);
    });

    if (owners.length === 0) {
      console.log('\n❌ NO OWNERS FOUND! This is the problem.');
      console.log('   Solution: Create an owner account in production.\n');
      return;
    }

    const ownerId = owners[0].id;
    console.log(`\n✅ Using owner: ${owners[0].email} (ID: ${ownerId})`);

    // 2. Check properties for this owner
    console.log('\n🏢 CHECKING PROPERTIES:');
    console.log('-'.repeat(80));
    
    const properties = await prisma.properties.findMany({
      where: { ownerId },
      select: {
        id: true,
        name: true,
        address: true,
        createdAt: true,
        _count: {
          select: {
            units: true,
            leases: true,
          }
        }
      }
    });

    console.log(`Total properties: ${properties.length}`);
    
    if (properties.length === 0) {
      console.log('\n❌ NO PROPERTIES FOUND for this owner!');
      console.log('   Solution: Add properties in production.\n');
      return;
    }

    properties.forEach((prop, i) => {
      console.log(`${i + 1}. ${prop.name}`);
      console.log(`   ID: ${prop.id}`);
      console.log(`   Address: ${prop.address || 'N/A'}`);
      console.log(`   Units: ${prop._count.units}`);
      console.log(`   Leases: ${prop._count.leases}`);
    });

    const propertyIds = properties.map(p => p.id);

    // 3. Check payments for these properties
    console.log('\n💰 CHECKING PAYMENTS:');
    console.log('-'.repeat(80));
    
    const allPayments = await prisma.payments.findMany({
      where: { propertyId: { in: propertyIds } },
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        paidAt: true,
        createdAt: true,
        properties: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    console.log(`Total payments: ${allPayments.length}`);
    
    if (allPayments.length === 0) {
      console.log('\n❌ NO PAYMENTS FOUND for these properties!');
      console.log('   This is why the chart shows no revenue.');
      console.log('   Solution: Record payments in production.\n');
    } else {
      console.log('\nRecent payments:');
      allPayments.forEach((payment, i) => {
        console.log(`${i + 1}. ${payment.properties?.name || 'N/A'}`);
        console.log(`   Amount: ${Number(payment.amount).toFixed(2)}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Type: ${payment.type || 'N/A'}`);
        console.log(`   Paid At: ${payment.paidAt ? new Date(payment.paidAt).toISOString() : 'NULL'}`);
        console.log(`   Created: ${new Date(payment.createdAt).toISOString()}`);
      });
    }

    // 4. Check specifically for successful non-subscription payments (what the chart uses)
    console.log('\n📊 CHECKING CHART-ELIGIBLE PAYMENTS:');
    console.log('-'.repeat(80));
    console.log('(Success status, NOT subscription type, has paidAt date)\n');
    
    const chartPayments = await prisma.payments.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'success',
        NOT: { type: 'subscription' },
        paidAt: { not: null }
      },
      select: {
        id: true,
        amount: true,
        type: true,
        paidAt: true,
        properties: {
          select: { name: true }
        }
      },
      orderBy: { paidAt: 'desc' }
    });

    console.log(`Chart-eligible payments: ${chartPayments.length}`);
    
    if (chartPayments.length === 0) {
      console.log('\n❌ NO CHART-ELIGIBLE PAYMENTS FOUND!');
      console.log('   This is why revenue bars are missing.');
      console.log('\n   Possible reasons:');
      console.log('   1. All payments have status != "success"');
      console.log('   2. All payments are type = "subscription"');
      console.log('   3. Payments don\'t have paidAt date set');
      console.log('   4. No payments exist at all\n');
      
      // Show what we DO have
      const nonSuccessPayments = await prisma.payments.count({
        where: {
          propertyId: { in: propertyIds },
          status: { not: 'success' }
        }
      });
      console.log(`   Payments with non-success status: ${nonSuccessPayments}`);
      
      const subscriptionPayments = await prisma.payments.count({
        where: {
          propertyId: { in: propertyIds },
          type: 'subscription'
        }
      });
      console.log(`   Subscription payments: ${subscriptionPayments}`);
      
      const paymentsWithoutPaidAt = await prisma.payments.count({
        where: {
          propertyId: { in: propertyIds },
          status: 'success',
          paidAt: null
        }
      });
      console.log(`   Success payments without paidAt: ${paymentsWithoutPaidAt}\n`);
    } else {
      chartPayments.forEach((payment, i) => {
        console.log(`${i + 1}. ${payment.properties?.name || 'N/A'} - ${payment.type}`);
        console.log(`   Amount: ${Number(payment.amount).toFixed(2)}`);
        console.log(`   Paid At: ${new Date(payment.paidAt!).toISOString()}`);
      });
    }

    // 5. Check expenses
    console.log('\n💸 CHECKING EXPENSES:');
    console.log('-'.repeat(80));
    
    const expenses = await prisma.expenses.findMany({
      where: { propertyId: { in: propertyIds } },
      select: {
        id: true,
        amount: true,
        status: true,
        category: true,
        date: true,
        properties: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    console.log(`Total expenses: ${expenses.length}`);
    
    if (expenses.length > 0) {
      expenses.forEach((expense, i) => {
        console.log(`${i + 1}. ${expense.properties?.name || 'N/A'} - ${expense.category}`);
        console.log(`   Amount: ${Number(expense.amount).toFixed(2)}`);
        console.log(`   Status: ${expense.status}`);
        console.log(`   Date: ${new Date(expense.date).toISOString()}`);
      });
    }

    // 6. Simulate the monthly revenue API call
    console.log('\n📈 SIMULATING /api/financial/monthly-revenue:');
    console.log('-'.repeat(80));
    
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);

    console.log(`Date range: ${from.toISOString()} to ${now.toISOString()}\n`);

    const [paymentsInRange, expensesInRange] = await Promise.all([
      prisma.payments.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: 'success',
          NOT: { type: 'subscription' },
          paidAt: {
            gte: from,
            lte: now,
          },
        },
        select: {
          amount: true,
          paidAt: true,
        },
      }),
      prisma.expenses.findMany({
        where: {
          propertyId: { in: propertyIds },
          status: { in: ['paid', 'pending'] },
          date: {
            gte: from,
            lte: now,
          },
        },
        select: {
          amount: true,
          date: true,
        },
      }),
    ]);

    console.log(`Payments in range: ${paymentsInRange.length}`);
    console.log(`Expenses in range: ${expensesInRange.length}\n`);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const getKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

    const revenueByMonth = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();

    paymentsInRange.forEach((p) => {
      if (!p.paidAt) return;
      const d = new Date(p.paidAt);
      const key = getKey(d);
      revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + Number(p.amount || 0));
    });

    expensesInRange.forEach((e) => {
      if (!e.date) return;
      const d = new Date(e.date);
      const key = getKey(d);
      expensesByMonth.set(key, (expensesByMonth.get(key) || 0) + Number(e.amount || 0));
    });

    console.log('Month       Revenue      Expenses     Net Income');
    console.log('-'.repeat(80));
    
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = getKey(d);
      const revenue = revenueByMonth.get(key) || 0;
      const exp = expensesByMonth.get(key) || 0;
      const netIncome = revenue - exp;

      monthlyData.push({
        month: monthNames[d.getMonth()],
        revenue: Math.round(revenue),
        expenses: Math.round(exp),
        netIncome: Math.round(netIncome)
      });

      console.log(
        `${monthNames[d.getMonth()].padEnd(12)}` +
        `${revenue.toFixed(2).padStart(12)}` +
        `${exp.toFixed(2).padStart(13)}` +
        `${netIncome.toFixed(2).padStart(15)}`
      );
    }

    console.log('\n📋 API RESPONSE PREVIEW:');
    console.log(JSON.stringify(monthlyData, null, 2));

    // 7. Final diagnosis
    console.log('\n🔬 DIAGNOSIS:');
    console.log('='.repeat(80));
    
    const hasRevenue = monthlyData.some(m => m.revenue > 0);
    const hasExpenses = monthlyData.some(m => m.expenses > 0);
    
    if (!hasRevenue && !hasExpenses) {
      console.log('❌ NO FINANCIAL DATA in the last 12 months');
      console.log('   The chart will be empty.');
      console.log('   Action: Record payments and expenses in production.');
    } else if (!hasRevenue && hasExpenses) {
      console.log('❌ EXPENSES ONLY, NO REVENUE');
      console.log('   This matches your screenshot - green bars only, negative net income.');
      console.log('   Action: Record successful rent/deposit payments in production.');
    } else if (hasRevenue && !hasExpenses) {
      console.log('✅ REVENUE ONLY, NO EXPENSES');
      console.log('   Chart will show blue bars and orange line.');
    } else {
      console.log('✅ BOTH REVENUE AND EXPENSES PRESENT');
      console.log('   Chart should display correctly.');
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Debug complete!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProduction();

