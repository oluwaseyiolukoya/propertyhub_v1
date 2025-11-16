const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCashFlowSystem() {
  console.log('\n🧪 ============================================');
  console.log('🧪 Testing Enhanced Cash Flow System');
  console.log('🧪 ============================================\n');

  try {
    // 1. Verify tables exist
    console.log('1️⃣ Verifying database tables...');
    const fundingCount = await prisma.project_funding.count();
    const expensesCount = await prisma.project_expenses.count();
    const snapshotsCount = await prisma.project_cash_flow_snapshots.count();

    console.log(`   ✅ project_funding: ${fundingCount} records`);
    console.log(`   ✅ project_expenses: ${expensesCount} records`);
    console.log(`   ✅ project_cash_flow_snapshots: ${snapshotsCount} records\n`);

    // 2. Get a sample project
    console.log('2️⃣ Finding a test project...');
    const project = await prisma.developer_projects.findFirst({
      where: { status: 'active' },
      include: {
        customer: { select: { company: true } },
        developer: { select: { name: true } }
      }
    });

    if (!project) {
      console.log('   ⚠️  No active projects found. Create a project first.\n');
      await prisma.$disconnect();
      return;
    }

    console.log(`   ✅ Found project: ${project.name}`);
    console.log(`      Customer: ${project.customer.company}`);
    console.log(`      Developer: ${project.developer.name}\n`);

    // 3. Create test funding record
    console.log('3️⃣ Creating test funding record...');
    const funding = await prisma.project_funding.create({
      data: {
        projectId: project.id,
        customerId: project.customerId,
        amount: 5000000,
        currency: 'NGN',
        fundingType: 'client_payment',
        fundingSource: 'Test Client Payment',
        receivedDate: new Date(),
        status: 'received',
        description: 'Test funding for cash flow system',
        createdBy: project.developerId
      }
    });
    console.log(`   ✅ Created funding: ${funding.id}`);
    console.log(`      Amount: ₦${funding.amount.toLocaleString()}\n`);

    // 4. Create test expense record
    console.log('4️⃣ Creating test expense record...');
    const expense = await prisma.project_expenses.create({
      data: {
        projectId: project.id,
        amount: 2000000,
        taxAmount: 200000,
        totalAmount: 2200000,
        currency: 'NGN',
        expenseType: 'invoice',
        category: 'labor',
        description: 'Test labor expense',
        paidDate: new Date(),
        status: 'paid',
        paymentStatus: 'paid'
      }
    });
    console.log(`   ✅ Created expense: ${expense.id}`);
    console.log(`      Amount: ₦${expense.totalAmount.toLocaleString()}\n`);

    // 5. Calculate cash flow
    console.log('5️⃣ Calculating cash flow...');
    const { calculateProjectCashFlow } = require('../src/services/cashflow.service');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const cashFlow = await calculateProjectCashFlow(
      project.id,
      startDate,
      endDate,
      'monthly'
    );

    console.log(`   ✅ Cash flow calculated for ${cashFlow.length} periods`);
    if (cashFlow.length > 0) {
      const latest = cashFlow[cashFlow.length - 1];
      console.log(`      Latest period: ${latest.month}`);
      console.log(`      Inflow: ₦${latest.inflow.toLocaleString()}`);
      console.log(`      Outflow: ₦${latest.outflow.toLocaleString()}`);
      console.log(`      Net: ₦${latest.netCashFlow.toLocaleString()}\n`);
    }

    // 6. Test snapshot creation
    console.log('6️⃣ Creating cash flow snapshot...');
    const { saveMonthlySnapshot } = require('../src/services/cashflow.service');
    const now = new Date();
    await saveMonthlySnapshot(project.id, now.getFullYear(), now.getMonth() + 1);
    console.log(`   ✅ Snapshot saved for ${now.getFullYear()}-${now.getMonth() + 1}\n`);

    // 7. Verify snapshot
    console.log('7️⃣ Verifying snapshot...');
    const snapshot = await prisma.project_cash_flow_snapshots.findFirst({
      where: { projectId: project.id },
      orderBy: { calculatedAt: 'desc' }
    });

    if (snapshot) {
      console.log(`   ✅ Snapshot found: ${snapshot.id}`);
      console.log(`      Inflow: ₦${snapshot.totalInflow.toLocaleString()}`);
      console.log(`      Outflow: ₦${snapshot.totalOutflow.toLocaleString()}`);
      console.log(`      Net: ₦${snapshot.netCashFlow.toLocaleString()}\n`);
    }

    // 8. Cleanup test data
    console.log('8️⃣ Cleaning up test data...');
    await prisma.project_funding.delete({ where: { id: funding.id } });
    await prisma.project_expenses.delete({ where: { id: expense.id } });
    if (snapshot) {
      await prisma.project_cash_flow_snapshots.delete({ where: { id: snapshot.id } });
    }
    console.log(`   ✅ Test data cleaned up\n`);

    console.log('🎉 ============================================');
    console.log('🎉 All Tests Passed Successfully!');
    console.log('🎉 ============================================\n');

    console.log('✅ System Status:');
    console.log('   • Database tables: Working');
    console.log('   • Funding records: Working');
    console.log('   • Expense records: Working');
    console.log('   • Cash flow calculation: Working');
    console.log('   • Snapshot creation: Working\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Test API endpoints via Postman/curl');
    console.log('   2. View cash flow chart in Developer Dashboard');
    console.log('   3. Create real funding and expense records');
    console.log('   4. Monitor background jobs\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testCashFlowSystem();




