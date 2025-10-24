import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setManagerPasswords() {
  console.log('🔧 Setting test passwords for managers...');

  const managers = await prisma.users.findMany({
    where: {
      OR: [
        { role: 'manager' },
        { role: 'property_manager' },
        { role: 'property manager' }
      ]
    },
    select: { id: true, email: true, name: true },
  });

  console.log(`\n📊 Found ${managers.length} manager(s)`);

  if (managers.length === 0) {
    console.log('No managers found. Exiting.');
    return;
  }

  // Set a simple test password for all managers
  const testPassword = 'password123';
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  console.log('\n🔐 Setting password for all managers...');
  const credentials: { name: string; email: string; password: string }[] = [];

  for (const manager of managers) {
    await prisma.users.update({
      where: { id: manager.id },
      data: { password: hashedPassword },
    });
    credentials.push({ name: manager.name, email: manager.email, password: testPassword });
    console.log(`✅ ${manager.name} (${manager.email})`);
  }

  console.log('\n📋 MANAGER LOGIN CREDENTIALS');
  console.log('============================');
  console.log('⚠️  All managers now have the same test password!\n');

  credentials.forEach((creds, index) => {
    console.log(`${index + 1}. ${creds.name}`);
    console.log(`   Email: ${creds.email}`);
    console.log(`   Password: ${creds.password}\n`);
  });
  console.log('============================');

  console.log('\n✅ All managers now have the password: password123');
  console.log('\n🔐 How to log in:');
  console.log('1. Go to http://localhost:5173');
  console.log('2. Select "Property Manager" as User Type');
  console.log('3. Enter manager email from above');
  console.log('4. Enter password: password123');
  console.log('5. Click Login');
}

setManagerPasswords()
  .catch((e) => {
    console.error('❌ Error setting manager passwords:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n✅ Script completed successfully');
  });

