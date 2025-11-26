import { PrismaClient } from '@prisma/client';
import { config } from './env';

// Require real database configuration; fail fast if missing
const DATABASE_URL = config.database.url;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

if (!DATABASE_URL || DATABASE_URL.includes('username:password')) {
  // Fail-fast with clear guidance
  console.error('❌ DATABASE_URL is not configured. A real PostgreSQL database is required.');
  console.error('➡️  Please set DATABASE_URL in verification-service/.env and restart the server.');
  console.error('➡️  Example: postgresql://user:password@localhost:5432/verification_db');
  throw new Error('DATABASE_URL not configured');
}

prisma = globalForPrisma.prisma ||
  new PrismaClient({
    log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (!config.isProduction) {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;

