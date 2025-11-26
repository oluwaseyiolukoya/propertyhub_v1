import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding verification service database...');

  // Create API key for main dashboard
  const apiKey = await prisma.api_keys.upsert({
    where: { key: 'c4453bd1f9ae085bed83385dcb4bc745374dd0eff62455e53d411985220194da' },
    update: {},
    create: {
      name: 'main-dashboard',
      key: 'c4453bd1f9ae085bed83385dcb4bc745374dd0eff62455e53d411985220194da',
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

