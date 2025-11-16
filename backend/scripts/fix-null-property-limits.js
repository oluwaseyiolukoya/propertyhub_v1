const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNullPropertyLimits() {
  console.log('🔧 Fixing NULL propertyLimit values in plans table...\n');

  try {
    // Find plans with NULL propertyLimit
    const plansWithNull = await prisma.plans.findMany({
      where: {
        propertyLimit: null
      }
    });

    console.log(`Found ${plansWithNull.length} plans with NULL propertyLimit\n`);

    if (plansWithNull.length === 0) {
      console.log('✅ No NULL values found. All good!');
      await prisma.$disconnect();
      return;
    }

    // Update each plan
    for (const plan of plansWithNull) {
      console.log(`  Updating plan: ${plan.name} (${plan.id})`);

      // Set default based on plan category
      const defaultLimit = plan.category === 'development' ? 0 : 5;

      await prisma.plans.update({
        where: { id: plan.id },
        data: { propertyLimit: defaultLimit }
      });

      console.log(`  ✅ Set propertyLimit to ${defaultLimit}\n`);
    }

    console.log('✅ All NULL propertyLimit values have been fixed!');

  } catch (error) {
    console.error('❌ Error fixing NULL values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNullPropertyLimits();





