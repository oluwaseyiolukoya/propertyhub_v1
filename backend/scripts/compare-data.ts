/**
 * Data Comparison Script
 * Compare payment and expense data between environments
 * 
 * Usage:
 * - Local: npx tsx scripts/compare-data.ts
 * - Production: Run in DigitalOcean Console
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function compareData() {
  console.log('\n🔍 DATA COMPARISON REPORT\n');
  console.log('='.repeat(60));

  try {
    // Get environment info
    const dbUrl = process.env.DATABASE_URL || '';
    const isProduction = dbUrl.includes('digitalocean.com');
    console.log(`\n📍 Environment: ${isProduction ? 'PRODUCTION' : 'LOCAL'}`);
    console.log(`🔗 Database: ${dbUrl.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);

    // 1. Count total records
    console.log('📊 RECORD COUNTS:');
    console.log('-'.repeat(60));
    
    const [
      propertiesCount,
      unitsCount,
      paymentsCount,
      expensesCount,
      leasesCount,
      usersCount,
      customersCount
    ] = await Promise.all([
      prisma.properties.count(),
      prisma.units.count(),
      prisma.payments.count(),
      prisma.expenses.count(),
      prisma.leases.count(),
      prisma.users.count(),
      prisma.customers.count(),
    ]);

    console.log(`Properties:  ${propertiesCount}`);
    console.log(`Units:       ${unitsCount}`);
    console.log(`Payments:    ${paymentsCount}`);
    console.log(`Expenses:    ${expensesCount}`);
    console.log(`Leases:      ${leasesCount}`);
    console.log(`Users:       ${usersCount}`);
    console.log(`Customers:   ${customersCount}`);

    // 2. Payment breakdown
    console.log('\n💰 PAYMENT BREAKDOWN:');
    console.log('-'.repeat(60));
    
    const paymentsByStatus = await prisma.payments.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    paymentsByStatus.forEach((group) => {
      console.log(`Status: ${group.status || 'null'}`);
      console.log(`  Count: ${group._count.id}`);
      console.log(`  Total: ${Number(group._sum.amount || 0).toFixed(2)}`);
    });

    const paymentsByType = await prisma.payments.groupBy({
      by: ['type'],
      _count: { id: true },
      _sum: { amount: true },
    });

    console.log('\nBy Type:');
    paymentsByType.forEach((group) => {
      console.log(`Type: ${group.type || 'null'}`);
      console.log(`  Count: ${group._count.id}`);
      console.log(`  Total: ${Number(group._sum.amount || 0).toFixed(2)}`);
    });

    // 3. Recent payments (last 10)
    console.log('\n📅 RECENT PAYMENTS (Last 10):');
    console.log('-'.repeat(60));
    
    const recentPayments = await prisma.payments.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
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
    });

    if (recentPayments.length === 0) {
      console.log('No payments found.');
    } else {
      recentPayments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Payment ID: ${payment.id.substring(0, 8)}...`);
        console.log(`   Property: ${payment.properties?.name || 'N/A'}`);
        console.log(`   Amount: ${Number(payment.amount).toFixed(2)}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Type: ${payment.type || 'N/A'}`);
        console.log(`   Paid At: ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}`);
        console.log(`   Created: ${new Date(payment.createdAt).toLocaleDateString()}`);
      });
    }

    // 4. Expense breakdown
    console.log('\n💸 EXPENSE BREAKDOWN:');
    console.log('-'.repeat(60));
    
    const expensesByStatus = await prisma.expenses.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    expensesByStatus.forEach((group) => {
      console.log(`Status: ${group.status || 'null'}`);
      console.log(`  Count: ${group._count.id}`);
      console.log(`  Total: ${Number(group._sum.amount || 0).toFixed(2)}`);
    });

    const expensesByCategory = await prisma.expenses.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { amount: true },
    });

    console.log('\nBy Category:');
    expensesByCategory.forEach((group) => {
      console.log(`Category: ${group.category || 'null'}`);
      console.log(`  Count: ${group._count.id}`);
      console.log(`  Total: ${Number(group._sum.amount || 0).toFixed(2)}`);
    });

    // 5. Recent expenses (last 10)
    console.log('\n📅 RECENT EXPENSES (Last 10):');
    console.log('-'.repeat(60));
    
    const recentExpenses = await prisma.expenses.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        category: true,
        description: true,
        date: true,
        createdAt: true,
        properties: {
          select: { name: true }
        }
      },
    });

    if (recentExpenses.length === 0) {
      console.log('No expenses found.');
    } else {
      recentExpenses.forEach((expense, index) => {
        console.log(`\n${index + 1}. Expense ID: ${expense.id.substring(0, 8)}...`);
        console.log(`   Property: ${expense.properties?.name || 'N/A'}`);
        console.log(`   Amount: ${Number(expense.amount).toFixed(2)}`);
        console.log(`   Status: ${expense.status}`);
        console.log(`   Category: ${expense.category || 'N/A'}`);
        console.log(`   Description: ${expense.description?.substring(0, 50) || 'N/A'}`);
        console.log(`   Date: ${new Date(expense.date).toLocaleDateString()}`);
      });
    }

    // 6. Monthly revenue data (last 12 months)
    console.log('\n📈 MONTHLY REVENUE DATA (Last 12 Months):');
    console.log('-'.repeat(60));
    
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - 11);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);

    const [payments, expenses] = await Promise.all([
      prisma.payments.findMany({
        where: {
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

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const getKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;

    const revenueByMonth = new Map<string, number>();
    const expensesByMonth = new Map<string, number>();

    payments.forEach((p) => {
      if (!p.paidAt) return;
      const d = new Date(p.paidAt);
      const key = getKey(d);
      revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + Number(p.amount || 0));
    });

    expenses.forEach((e) => {
      if (!e.date) return;
      const d = new Date(e.date);
      const key = getKey(d);
      expensesByMonth.set(key, (expensesByMonth.get(key) || 0) + Number(e.amount || 0));
    });

    console.log('\nMonth       Revenue      Expenses     Net Income');
    console.log('-'.repeat(60));
    
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = getKey(d);
      const revenue = revenueByMonth.get(key) || 0;
      const exp = expensesByMonth.get(key) || 0;
      const netIncome = revenue - exp;

      totalRevenue += revenue;
      totalExpenses += exp;

      console.log(
        `${monthNames[d.getMonth()].padEnd(12)}` +
        `${revenue.toFixed(2).padStart(12)}` +
        `${exp.toFixed(2).padStart(13)}` +
        `${netIncome.toFixed(2).padStart(15)}`
      );
    }

    console.log('-'.repeat(60));
    console.log(
      `${'TOTAL'.padEnd(12)}` +
      `${totalRevenue.toFixed(2).padStart(12)}` +
      `${totalExpenses.toFixed(2).padStart(13)}` +
      `${(totalRevenue - totalExpenses).toFixed(2).padStart(15)}`
    );

    // 7. Data quality checks
    console.log('\n✅ DATA QUALITY CHECKS:');
    console.log('-'.repeat(60));
    
    const paymentsWithoutPaidAt = await prisma.payments.count({
      where: { 
        status: 'success',
        paidAt: null 
      }
    });
    console.log(`Success payments without paidAt: ${paymentsWithoutPaidAt}`);

    const subscriptionPayments = await prisma.payments.count({
      where: { type: 'subscription' }
    });
    console.log(`Subscription payments (excluded from revenue): ${subscriptionPayments}`);

    const pendingPayments = await prisma.payments.count({
      where: { status: 'pending' }
    });
    console.log(`Pending payments: ${pendingPayments}`);

    const failedPayments = await prisma.payments.count({
      where: { status: 'failed' }
    });
    console.log(`Failed payments: ${failedPayments}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data comparison complete!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comparison
compareData();

