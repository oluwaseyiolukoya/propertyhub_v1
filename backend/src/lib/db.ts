import { PrismaClient } from '@prisma/client';

// Require real database configuration; fail fast if missing
const DATABASE_URL = process.env.DATABASE_URL || '';

const globalForPrisma = global as unknown as { prisma: any };

let prisma: any;

if (!DATABASE_URL || DATABASE_URL.includes('username:password')) {
  // Fail-fast with clear guidance
  // This avoids silently running with an in-memory mock and losing test data
  // Configure backend/.env with a valid DATABASE_URL for persistent storage
  // Example: postgresql://user:password@localhost:5432/propertyhub
  // Then run: npx prisma migrate deploy (or db push), and npx prisma db seed
  console.error('❌ DATABASE_URL is not configured. A real PostgreSQL database is required.');
  console.error('➡️  Please set DATABASE_URL in backend/.env and restart the server.');
  throw new Error('DATABASE_URL not configured');
}

prisma = globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;


