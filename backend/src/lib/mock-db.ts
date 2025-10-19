/**
 * Mock Database for Development
 * This allows the app to run without PostgreSQL
 */

export const mockDb = {
  customer: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
    count: async () => 0,
    aggregate: async () => ({ _sum: {}, _avg: {}, _count: {} }),
    groupBy: async () => [],
  },
  user: {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
    count: async () => 0,
  },
  property: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
    count: async () => 0,
  },
  unit: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
    count: async () => 0,
  },
  lease: {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    count: async () => 0,
  },
  payment: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    aggregate: async () => ({ _sum: { amount: 0 } }),
    count: async () => 0,
  },
  maintenanceRequest: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ticketNumber: 'MOCK-001', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    count: async () => 0,
  },
  plan: {
    findMany: async () => [],
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
  },
  admin: {
    findUnique: async () => null,
  },
  tenant: {
    findUnique: async () => null,
    findFirst: async () => null,
  },
  propertyOwner: {
    findUnique: async () => null,
  },
  propertyManager: {
    findMany: async () => [],
    findUnique: async () => null,
  },
  invoice: {
    findMany: async () => [],
    aggregate: async () => ({ _sum: { amount: 0 } }),
  },
  $queryRaw: async () => [],
};

