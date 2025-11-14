const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function permanentlyFix() {
  try {
    console.log('\n🔧 Permanently fixing developer_two@contrezz.com...\n');

    // Get plan
    const plan = await prisma.plans.findUnique({
      where: { id: 'plan-dev-starter-1' }
    });

    if (!plan) {
      console.error('❌ Plan not found!');
      process.exit(1);
    }

    console.log('📋 Plan:', plan.name);
    console.log('   - Monthly Price:', plan.monthlyPrice);
    console.log('   - Annual Price:', plan.annualPrice);

    // Fix customer
    const customer = await prisma.customers.update({
      where: { email: 'developer_two@contrezz.com' },
      data: {
        status: 'active',
        mrr: plan.monthlyPrice,
        planId: plan.id,
        billingCycle: 'monthly',
        subscriptionStartDate: new Date(),
        trialEndsAt: null,
        trialStartsAt: null,
        gracePeriodEndsAt: null,
        suspendedAt: null,
        suspensionReason: null,
        notes: `Account permanently fixed on ${new Date().toISOString()}. MRR set to ${plan.monthlyPrice}.`
      }
    });

    console.log('\n✅ Customer Fixed:');
    console.log('   - Status:', customer.status);
    console.log('   - MRR:', customer.mrr);
    console.log('   - Billing Cycle:', customer.billingCycle);
    console.log('   - Plan ID:', customer.planId);

    // Fix all users
    const userResult = await prisma.users.updateMany({
      where: { customerId: customer.id },
      data: {
        isActive: true,
        status: 'active',
        updatedAt: new Date()
      }
    });

    console.log('\n✅ Users Fixed:', userResult.count);

    // Verify
    const users = await prisma.users.findMany({
      where: { customerId: customer.id },
      select: { email: true, isActive: true, status: true }
    });

    console.log('\n📋 User Status:');
    users.forEach(u => {
      const icon = u.isActive && u.status === 'active' ? '✅' : '❌';
      console.log(`   ${icon} ${u.email}: isActive=${u.isActive}, status=${u.status}`);
    });

    // Final verification
    const finalCustomer = await prisma.customers.findUnique({
      where: { id: customer.id },
      select: {
        status: true,
        mrr: true,
        planId: true,
        billingCycle: true
      }
    });

    console.log('\n🔍 Final Verification:');
    console.log('   - Status:', finalCustomer.status);
    console.log('   - MRR:', finalCustomer.mrr);
    console.log('   - Plan ID:', finalCustomer.planId);
    console.log('   - Billing Cycle:', finalCustomer.billingCycle);

    if (finalCustomer.status === 'active' && finalCustomer.mrr > 0) {
      console.log('\n✅ SUCCESS! Account is permanently fixed.');
      console.log('   - MRR > 0: Will not be suspended by trial management');
      console.log('   - Status = active: Will not be touched by cron jobs');
      console.log('   - Users active: Can login');
    } else {
      console.log('\n⚠️  WARNING: Fix may not be complete!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

permanentlyFix();

