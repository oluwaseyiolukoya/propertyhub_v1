/**
 * Mock Database for Development
 * This allows the app to run without PostgreSQL
 */

export const mockDb = {
  customer: {
    findMany: async (args?: any) => {
      const customers = mockCustomers;
      if (args?.select && typeof args.select === 'object') {
        return customers.map((c) => {
          const selected: any = {};
          for (const key of Object.keys(args.select)) {
            if (args.select[key]) selected[key] = (c as any)[key];
          }
          return selected;
        });
      }
      return customers;
    },
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
    count: async () => mockCustomers.length,
    aggregate: async () => ({ _sum: {}, _avg: {}, _count: { _all: mockCustomers.length } }),
    groupBy: async () => {
      const bucket: Record<string, number> = {};
      for (const c of mockCustomers) {
        if (!c.planId) continue;
        bucket[c.planId] = (bucket[c.planId] || 0) + 1;
      }
      return Object.entries(bucket).map(([planId, count]) => ({ planId, _count: count }));
    },
  },
  // Add plural alias matching Prisma model naming used across the codebase
  customers: {
    findMany: async (args?: any) => {
      const customers = mockCustomers;
      if (args?.select && typeof args.select === 'object') {
        return customers.map((c) => {
          const selected: any = {};
          for (const key of Object.keys(args.select)) {
            if (args.select[key]) selected[key] = (c as any)[key];
          }
          return selected;
        });
      }
      return customers;
    },
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
    count: async () => mockCustomers.length,
    aggregate: async () => ({ _sum: {}, _avg: {}, _count: { _all: mockCustomers.length } }),
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
  // Add plural alias matching Prisma model naming used across the codebase
  users: {
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
  // Optional plural alias
  properties: {
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
    findMany: async () => mockPlans,
    findUnique: async () => null,
    create: async (data: any) => ({ id: 'mock-id', ...data.data }),
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
    delete: async () => ({ id: 'deleted' }),
  },
  admin: {
    findUnique: async () => null,
  },
  // Add plural alias used by routes/middleware
  admins: {
    findUnique: async () => null,
    update: async (data: any) => ({ id: data.where.id, ...data.data }),
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
  activityLog: {
    findMany: async () => [],
    count: async () => 0,
    create: async (data: any) => ({ id: 'mock-log', ...data.data }),
  },
  systemSetting: {
    findMany: async (args?: any) => {
      const all = Object.values(mockSystemSettings);
      if (args?.where?.category) {
        return all.filter((s: any) => s.category === args.where.category);
      }
      return all as any[];
    },
    findUnique: async (args: any) => {
      return (mockSystemSettings as any)[args.where.key] || null;
    },
    upsert: async (args: any) => {
      const now = new Date();
      const key = args.where.key;
      const existing = (mockSystemSettings as any)[key];
      if (existing) {
        const updated = { ...existing, ...args.update, updatedAt: now };
        (mockSystemSettings as any)[key] = updated;
        return updated;
      } else {
        const created = { id: `mock-${args.create.key}`, createdAt: now, updatedAt: now, ...args.create };
        (mockSystemSettings as any)[key] = created;
        return created;
      }
    },
    delete: async (args: any) => {
      const key = args.where.key;
      delete (mockSystemSettings as any)[key];
      return { key } as any;
    }
  },
  $queryRaw: async () => [],
};

// --- Simple in-memory mock data for demo environments ---
const mockPlans = [
  { id: 'plan-starter', name: 'Starter' },
  { id: 'plan-professional', name: 'Professional' },
  { id: 'plan-enterprise', name: 'Enterprise' },
];

const mockCustomers = [
  { id: 'cust-1', company: 'Alpha Estates', planId: 'plan-starter', status: 'active', createdAt: new Date() },
  { id: 'cust-2', company: 'Metro Properties', planId: 'plan-professional', status: 'active', createdAt: new Date() },
  { id: 'cust-3', company: 'Greenfield Homes', planId: 'plan-professional', status: 'trial', createdAt: new Date() },
  { id: 'cust-4', company: 'Sunset Realty', planId: 'plan-enterprise', status: 'active', createdAt: new Date() },
  { id: 'cust-5', company: 'Downtown Holdings', planId: 'plan-enterprise', status: 'active', createdAt: new Date() },
  { id: 'cust-6', company: 'Harbor View', planId: 'plan-enterprise', status: 'active', createdAt: new Date() },
];

const mockSystemSettings: Record<string, any> = {
  site_name: { id: 'mock-site_name', key: 'site_name', value: 'PropertyHub', category: 'system', description: 'Platform name', createdAt: new Date(), updatedAt: new Date() },
  default_currency: { id: 'mock-default_currency', key: 'default_currency', value: 'NGN', category: 'system', description: 'Default platform currency', createdAt: new Date(), updatedAt: new Date() },
};

