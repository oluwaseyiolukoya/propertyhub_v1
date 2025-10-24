import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding demo properties/units for Metro Properties LLC...');

  const customer = await prisma.customer.findFirst({ where: { company: 'Metro Properties LLC' } });
  if (!customer) {
    console.error('❌ Customer "Metro Properties LLC" not found');
    process.exit(1);
  }

  // Demo properties blueprint
  const demoProps = [
    {
      name: 'Sunset Apartments',
      propertyType: 'Multifamily',
      address: '101 Sunset Blvd',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '100001',
      country: 'Nigeria',
      totalUnits: 4,
      units: [
        { unitNumber: 'A101', type: '1br', bedrooms: 1, bathrooms: 1, monthlyRent: 1200 },
        { unitNumber: 'A102', type: '2br', bedrooms: 2, bathrooms: 2, monthlyRent: 1800 },
        { unitNumber: 'B201', type: 'Studio', bedrooms: 0, bathrooms: 1, monthlyRent: 900 },
        { unitNumber: 'B202', type: '2br', bedrooms: 2, bathrooms: 2, monthlyRent: 1750 },
      ],
    },
    {
      name: 'Oak Street Condos',
      propertyType: 'Condo',
      address: '22 Oak Street',
      city: 'Lagos',
      state: 'Lagos',
      zipCode: '100002',
      country: 'Nigeria',
      totalUnits: 3,
      units: [
        { unitNumber: 'C1', type: '2br', bedrooms: 2, bathrooms: 2, monthlyRent: 2000 },
        { unitNumber: 'C2', type: '3br', bedrooms: 3, bathrooms: 2, monthlyRent: 2600 },
        { unitNumber: 'C3', type: '1br', bedrooms: 1, bathrooms: 1, monthlyRent: 1400 },
      ],
    },
  ];

  let propertiesCreated = 0;
  let unitsCreated = 0;

  for (const p of demoProps) {
    const property = await prisma.property.create({
      data: {
        customerId: customer.id,
        ownerId: (await prisma.user.findFirst({ where: { customerId: customer.id, role: { contains: 'owner', mode: 'insensitive' } } }))?.id || (await prisma.user.findFirst({ where: { customerId: customer.id } }))!.id,
        name: p.name,
        propertyType: p.propertyType,
        address: p.address,
        city: p.city,
        state: p.state,
        zipCode: p.zipCode,
        country: p.country,
        totalUnits: p.totalUnits,
        status: 'active',
      },
    });
    propertiesCreated++;

    for (const u of p.units) {
      await prisma.unit.create({
        data: {
          propertyId: property.id,
          unitNumber: u.unitNumber,
          type: u.type,
          bedrooms: u.bedrooms,
          bathrooms: u.bathrooms,
          monthlyRent: u.monthlyRent,
          status: 'vacant',
        },
      });
      unitsCreated++;
    }
  }

  // Update customer cached counts
  const propCount = await prisma.property.count({ where: { customerId: customer.id } });
  const unitCount = await prisma.unit.count({ where: { property: { customerId: customer.id } } });
  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      propertiesCount: propCount,
      unitsCount: unitCount,
    },
  });

  console.log(`✅ Created ${propertiesCreated} properties and ${unitsCreated} units for Metro Properties LLC.`);
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
