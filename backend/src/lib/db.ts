import { PrismaClient } from '@prisma/client';
import { mockDb } from './mock-db';

// Check if we should use mock database
const DATABASE_URL = process.env.DATABASE_URL || '';
const useMockDb = !DATABASE_URL || DATABASE_URL.includes('username:password');

const globalForPrisma = global as unknown as { prisma: any };

let prisma: any;

if (useMockDb) {
  console.log('⚠️  Using MOCK database (no real database connected)');
  console.log('💡 To use a real database, update DATABASE_URL in .env');
  prisma = mockDb;
} else {
  prisma = globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

  // Graceful shutdown
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;


