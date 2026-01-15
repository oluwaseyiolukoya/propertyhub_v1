/**
 * Diagnostic script to check why Tax Calculator revenue is not showing
 * Usage: npx tsx scripts/diagnose-tax-revenue-data.ts <email>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseTaxRevenue() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Please provide an email address');
    console.error('Usage: npx tsx scripts/diagnose-tax-revenue-data.ts <email>');
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Diagnosing Tax Calculator revenue data for: ${email}\n`);

    // 1. Get user info
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        customerId: true,
        role: true,
      },
    });

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('👤 User Details:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Customer ID:', user.customerId);
    console.log('  - Role:', user.role);

    if (!user.customerId) {
      console.log('\n⚠️  User has no customerId');
      process.exit(0);
    }

    // 2. Get user's properties
    const properties = await prisma.properties.findMany({
      where: {
        ownerId: user.id, // Tax Calculator uses ownerId
      },
      select: {
        id: true,
        name: true,
        address: true,
        customerId: true,
        units: {
          select: {
            id: true,
            unitNumber: true,
            monthlyRent: true,
            status: true,
          },
        },
      },
    });

    console.log(`\n🏢 Properties Found: ${properties.length}`);
    if (properties.length === 0) {
      console.log('   ❌ No properties found for this user');
      console.log('   Solution: Create properties first before using Tax Calculator');
      process.exit(0);
    }

    properties.forEach((prop, idx) => {
      console.log(`\n   Property ${idx + 1}:`);
      console.log('     - ID:', prop.id);
      console.log('     - Name:', prop.name);
      console.log('     - Address:', prop.address);
      console.log('     - Customer ID:', prop.customerId);
      console.log('     - Units:', prop.units.length);
      console.log('     - Occupied Units:', prop.units.filter((u) => u.status === 'occupied').length);
    });

    // 3. Check payments for each property
    console.log('\n\n💰 Checking Payment Records:\n');

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    for (const property of properties) {
      console.log(`\n📊 Property: ${property.name} (${property.id})`);

      // Check all payments for this property (any status, any type)
      const allPayments = await prisma.payments.findMany({
        where: {
          propertyId: property.id,
        },
        select: {
          id: true,
          amount: true,
          type: true,
          status: true,
          customerId: true,
          paidAt: true,
          createdAt: true,
        },
        orderBy: {
          paidAt: 'desc',
        },
        take: 20,
      });

      console.log(`   Total payments (all types/statuses): ${allPayments.length}`);

      if (allPayments.length === 0) {
        console.log('   ❌ NO PAYMENT RECORDS FOUND');
        console.log('   Problem: Tax Calculator needs payment records with:');
        console.log('     - type: "rent"');
        console.log('     - status: "completed", "success", or "paid"');
        console.log('     - paidAt: date within the tax year');
        console.log('   Solution: Create payment records or record actual tenant payments');
        continue;
      }

      // Show all payments
      console.log('\n   All Payments:');
      allPayments.forEach((p, idx) => {
        const year = p.paidAt ? new Date(p.paidAt).getFullYear() : 'N/A';
        console.log(`     ${idx + 1}. Amount: ₦${p.amount}, Type: ${p.type}, Status: ${p.status}, Year: ${year}, CustomerId: ${p.customerId}`);
      });

      // Filter for valid rent payments in current year
      const validPayments = allPayments.filter((p) =>
        p.type === 'rent' &&
        (p.status === 'completed' || p.status === 'success' || p.status === 'paid') &&
        p.paidAt &&
        p.paidAt >= yearStart &&
        p.paidAt <= yearEnd
      );

      console.log(`\n   Valid rent payments for ${currentYear}: ${validPayments.length}`);

      if (validPayments.length === 0) {
        console.log('   ⚠️  No valid rent payments found for current year');
        console.log('   Issues found:');

        const hasRentType = allPayments.some(p => p.type === 'rent');
        const hasCompletedStatus = allPayments.some(p => p.status === 'completed' || p.status === 'success' || p.status === 'paid');
        const hasCurrentYearPayments = allPayments.some(p => p.paidAt && new Date(p.paidAt).getFullYear() === currentYear);

        if (!hasRentType) {
          console.log('     ❌ No payments with type="rent" (found types:', [...new Set(allPayments.map(p => p.type))].join(', '), ')');
        }
        if (!hasCompletedStatus) {
          console.log('     ❌ No payments with status="completed", "success", or "paid" (found statuses:', [...new Set(allPayments.map(p => p.status))].join(', '), ')');
        }
        if (!hasCurrentYearPayments) {
          console.log('     ❌ No payments with paidAt in', currentYear);
        }
      } else {
        const totalRevenue = validPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        console.log(`   ✅ Total Revenue for ${currentYear}: ₦${totalRevenue.toLocaleString()}`);
        console.log('   Valid payments:');
        validPayments.forEach((p, idx) => {
          console.log(`     ${idx + 1}. ₦${p.amount} on ${p.paidAt?.toLocaleDateString()}`);
        });
      }
    }

    // 4. Summary and recommendations
    console.log('\n\n📋 Summary & Recommendations:\n');

    const totalPaymentsAcrossAll = await prisma.payments.count({
      where: {
        propertyId: { in: properties.map(p => p.id) },
      },
    });

    const validPaymentsAcrossAll = await prisma.payments.count({
      where: {
        propertyId: { in: properties.map(p => p.id) },
        type: 'rent',
        status: { in: ['completed', 'success', 'paid'] },
        paidAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
    });

    console.log(`Total payment records: ${totalPaymentsAcrossAll}`);
    console.log(`Valid rent payments for ${currentYear}: ${validPaymentsAcrossAll}`);

    if (validPaymentsAcrossAll === 0) {
      console.log('\n❌ ISSUE: No valid rent payment records found');
      console.log('\n🔧 Solutions:');
      console.log('   1. Record actual tenant payments through the Payments page');
      console.log('   2. Ensure payment records have:');
      console.log('      - type: "rent"');
      console.log('      - status: "completed", "success", or "paid"');
      console.log('      - paidAt: date within the tax year');
      console.log('      - propertyId: must match the property you select');
      console.log('   3. Or try selecting a different year in the Tax Calculator');
    } else {
      console.log('\n✅ Valid payment records exist!');
      console.log('\nIf Tax Calculator still shows ₦0:');
      console.log('   1. Check browser console for [Tax Calculator] logs');
      console.log('   2. Ensure you selected the correct property and year');
      console.log('   3. Hard refresh the page (Cmd+Shift+R)');
      console.log('   4. Check backend logs when selecting property/year');
    }

    console.log('\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseTaxRevenue();

