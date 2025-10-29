import { PrismaClient } from '@prisma/client';
import { mockDb } from '../src/lib/mock-db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugifyCompany(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  console.log('🔄 Migrating mock data to the real database...');

  // Fetch mock customers from the in-memory mock DB API
  const mockCustomers = await (mockDb as any).customers.findMany();
  console.log(`📦 Found ${mockCustomers.length} mock customers`);

  // Map mock plan IDs to seeded plan names (best-effort)
  const planNameByMockId: Record<string, string> = {
    'plan-starter': 'Starter',
    'plan-professional': 'Professional',
    'plan-enterprise': 'Enterprise',
  };

  // Build lookup of plans by name from the real DB
  const realPlans = await prisma.plans.findMany({ select: { id: true, name: true } });
  const planIdByName = Object.fromEntries(realPlans.map((p) => [p.name, p.id]));

  let createdCustomers = 0;
  let updatedCustomers = 0;
  let createdOwners = 0;

  for (const c of mockCustomers) {
    const company: string = c.company || 'Unknown Company';
    const slug = slugifyCompany(company) || 'company';
    const email = `no-reply+${slug}@mock.local`;
    const owner = c.owner || `Owner of ${company}`;
    const status = c.status || 'active';
    const planName = planNameByMockId[c.planId as string] || undefined;
    const planId = planName ? planIdByName[planName] : undefined;

    const now = new Date();
    const existing = await prisma.customers.findUnique({ where: { email } });
    if (existing) {
      await prisma.customers.update({
        where: { id: existing.id },
        data: {
          company,
          owner,
          status,
          ...(planId ? { planId } : {}),
          updatedAt: now,
        },
      });
      updatedCustomers += 1;
      console.log(`↻ Updated customer: ${company}`);
    } else {
      await prisma.customers.create({
        data: {
          id: crypto.randomUUID(),
          company,
          owner,
          email,
          status,
          ...(planId ? { planId } : {}),
          // Optional extras from mock when available
          createdAt: c.createdAt ? new Date(c.createdAt) : now,
          updatedAt: now,
        },
      });
      createdCustomers += 1;
      console.log(`✅ Created customer: ${company}`);
    }

    // Ensure each customer has at least one owner user for login
    const customerRecord = await prisma.customers.findUnique({ where: { email } });
    if (customerRecord) {
      const existingOwner = await prisma.users.findFirst({
        where: { customerId: customerRecord.id, role: { in: ['owner', 'property_owner', 'property owner'] } },
      });
      if (!existingOwner) {
        const ownerEmail = `owner+${slug}@mock.local`;
        const hashed = await bcrypt.hash('owner123', 10);
        await prisma.users.create({
          data: {
            id: crypto.randomUUID(),
            customerId: customerRecord.id,
            name: owner,
            email: ownerEmail,
            password: hashed,
            role: 'owner',
            status: 'active',
            baseCurrency: 'USD',
            updatedAt: now,
          },
        });
        createdOwners += 1;
        console.log(`👤 Created owner user for ${company}: ${ownerEmail}`);
      }
    }
  }

  // Migrate system settings from mock if missing
  const mockSettings = await (mockDb as any).systemSetting.findMany();
  let createdSettings = 0;
  for (const s of mockSettings) {
    const key = (s as any).key;
    const exists = await prisma.system_settings.findUnique({ where: { key } });
    if (!exists) {
      await prisma.system_settings.create({
        data: {
          id: `setting-${key}`,
          key,
          value: (s as any).value,
          category: (s as any).category || 'system',
          description: (s as any).description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      createdSettings += 1;
      console.log(`⚙️  Created system setting: ${key}`);
    }
  }

  console.log(`\n🎉 Migration complete.`);
  console.log(`   Customers → Created: ${createdCustomers}, Updated: ${updatedCustomers}`);
  console.log(`   Owner users created: ${createdOwners}`);
  console.log(`   System settings created: ${createdSettings}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Migration error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });


