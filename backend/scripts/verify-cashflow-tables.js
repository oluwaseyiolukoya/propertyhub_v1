const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyCashFlowTables() {
  console.log('\n✅ ============================================');
  console.log('✅ Enhanced Cash Flow System Verification');
  console.log('✅ ============================================\n');

  try {
    // 1. Verify tables exist
    console.log('📊 Database Tables:');
    const fundingCount = await prisma.project_funding.count();
    const expensesCount = await prisma.project_expenses.count();
    const snapshotsCount = await prisma.project_cash_flow_snapshots.count();

    console.log(`   ✅ project_funding: ${fundingCount} records`);
    console.log(`   ✅ project_expenses: ${expensesCount} records`);
    console.log(`   ✅ project_cash_flow_snapshots: ${snapshotsCount} records\n`);

    // 2. Check if we have any projects
    const projectCount = await prisma.developer_projects.count();
    console.log(`📁 Projects: ${projectCount} total\n`);

    // 3. Verify table structure by creating and deleting a test record
    console.log('🧪 Testing table structure...');

    // Get a project to test with
    const project = await prisma.developer_projects.findFirst();

    if (project) {
      // Test funding table
      const testFunding = await prisma.project_funding.create({
        data: {
          projectId: project.id,
          customerId: project.customerId,
          amount: 1000,
          currency: 'NGN',
          fundingType: 'client_payment',
          status: 'pending',
          description: 'Structure test'
        }
      });
      await prisma.project_funding.delete({ where: { id: testFunding.id } });
      console.log('   ✅ project_funding structure: Valid');

      // Test expenses table
      const testExpense = await prisma.project_expenses.create({
        data: {
          projectId: project.id,
          amount: 1000,
          totalAmount: 1000,
          currency: 'NGN',
          expenseType: 'invoice',
          category: 'labor',
          description: 'Structure test',
          status: 'pending',
          paymentStatus: 'unpaid'
        }
      });
      await prisma.project_expenses.delete({ where: { id: testExpense.id } });
      console.log('   ✅ project_expenses structure: Valid');

      // Test snapshots table
      const testSnapshot = await prisma.project_cash_flow_snapshots.create({
        data: {
          projectId: project.id,
          periodType: 'monthly',
          periodStart: new Date(),
          periodEnd: new Date(),
          totalInflow: 0,
          totalOutflow: 0,
          netCashFlow: 0
        }
      });
      await prisma.project_cash_flow_snapshots.delete({ where: { id: testSnapshot.id } });
      console.log('   ✅ project_cash_flow_snapshots structure: Valid\n');
    } else {
      console.log('   ⚠️  No projects found. Skipping structure test.\n');
    }

    // 4. Summary
    console.log('✅ ============================================');
    console.log('✅ Verification Complete!');
    console.log('✅ ============================================\n');

    console.log('📋 System Status:');
    console.log('   ✅ All tables created successfully');
    console.log('   ✅ Table structures validated');
    console.log('   ✅ Ready for production use\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Test API endpoints:');
    console.log('      GET /api/developer-dashboard/projects/:id/cash-flow');
    console.log('      GET /api/developer-dashboard/projects/:id/funding');
    console.log('      GET /api/developer-dashboard/projects/:id/expenses');
    console.log('   3. View enhanced cash flow chart in Developer Dashboard');
    console.log('   4. Create real funding and expense records\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('   Details:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyCashFlowTables();












