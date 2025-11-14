const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserStatus() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.error('Usage: node scripts/check-user-status.js <email>');
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Checking status for: ${email}\n`);

    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        customers: {
          include: {
            plans: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('👤 User Details:');
    console.log('  - ID:', user.id);
    console.log('  - Name:', user.name);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);
    console.log('  - Is Active:', user.isActive);
    console.log('  - Status:', user.status);
    console.log('  - Customer ID:', user.customerId);

    if (user.customers) {
      console.log('\n🏢 Customer Details:');
      console.log('  - Company:', user.customers.company);
      console.log('  - Status:', user.customers.status);
      console.log('  - MRR:', user.customers.mrr);
      console.log('  - Plan:', user.customers.plans?.name || 'None');
    }

    console.log('\n📊 Login Check:');
    if (user.isActive === false) {
      console.log('  ❌ BLOCKED: isActive is false');
    } else if (user.status && user.status !== 'active') {
      console.log(`  ❌ BLOCKED: status is '${user.status}' (not 'active')`);
    } else {
      console.log('  ✅ ALLOWED: User can log in');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserStatus();

