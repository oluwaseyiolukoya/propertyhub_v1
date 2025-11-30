import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding verification service database...');

  // Create API key for main dashboard
  // First, try to find and delete any existing keys
  await prisma.api_keys.deleteMany({
    where: { name: 'main_dashboard' },
  });

  // Then create the new key using the API_KEY_MAIN_DASHBOARD from environment
  const apiKeyValue = process.env.API_KEY_MAIN_DASHBOARD || 'c4453bd1f9ae085bed83385dcb4bc745374dd0eff62455e53d411985220194da';

  const apiKey = await prisma.api_keys.create({
    data: {
      name: 'main_dashboard',
      key: apiKeyValue,
      isActive: true,
      permissions: ['read', 'write', 'admin'],
    },
  });

  console.log('✅ Created API key:', apiKey.name);
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

