import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixManagerLogin() {
  console.log('🔧 Starting manager login fix...');

  // Find all managers
  const managers = await prisma.users.findMany({
    where: { 
      OR: [
        { role: 'manager' },
        { role: 'property_manager' },
        { role: 'property manager' }
      ]
    },
    select: { 
      id: true, 
      email: true, 
      name: true, 
      isActive: true, 
      status: true, 
      password: true 
    }
  });

  console.log(`\n📊 Found ${managers.length} manager(s) in database`);
  
  if (managers.length === 0) {
    console.log('No managers found. Exiting.');
    return;
  }

  console.log('\nCurrent manager status:');
  managers.forEach((m, i) => {
    console.log(`${i + 1}. ${m.name} (${m.email})`);
    console.log(`   - isActive: ${m.isActive}`);
    console.log(`   - status: ${m.status}`);
    console.log(`   - has password: ${!!m.password}`);
  });

  // Update all managers to be active
  const updatedManagers = await prisma.users.updateMany({
    where: { 
      OR: [
        { role: 'manager' },
        { role: 'property_manager' },
        { role: 'property manager' }
      ]
    },
    data: {
      status: 'active',
      isActive: true,
    },
  });

  console.log(`\n✅ Updated ${updatedManagers.count} manager(s)`);
  console.log('All managers can now log in!');

  // Verify updates
  console.log('\nVerifying updates...');
  const verifiedManagers = await prisma.users.findMany({
    where: { 
      OR: [
        { role: 'manager' },
        { role: 'property_manager' },
        { role: 'property manager' }
      ]
    },
    select: { id: true, email: true, name: true, isActive: true, status: true }
  });

  console.log('\nUpdated manager status:');
  verifiedManagers.forEach((m, i) => {
    console.log(`${i + 1}. ✅ ${m.name} (${m.email})`);
    console.log(`   - isActive: ${m.isActive}`);
    console.log(`   - status: ${m.status}`);
  });

  console.log('\n🎉 All done! All managers can now log in to their dashboard.');
  console.log('\n📋 How to log in:');
  console.log('1. Go to http://localhost:5173');
  console.log('2. Select "Property Manager" as User Type');
  console.log('3. Enter manager email and password');
  console.log('4. Click Login');
}

fixManagerLogin()
  .catch((e) => {
    console.error('❌ Error during manager login fix:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Script completed successfully');
  });

