import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding verification service database...');

  // Create API key for main dashboard
  const apiKey = await prisma.api_keys.upsert({
    where: { name: 'main_dashboard' },
    update: {
      key: 'vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04',
      isActive: true,
      permissions: ['read', 'write', 'admin'],
    },
    create: {
      name: 'main_dashboard',
      key: 'vkey_fd6967cc3dbc5d1650b21b580df6f8f49cb7ddd79f1abd04',
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

