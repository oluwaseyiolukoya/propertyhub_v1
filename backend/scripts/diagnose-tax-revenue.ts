/**
 * Diagnostic script to check why a property shows no taxable income
 * Usage: npx ts-node scripts/diagnose-tax-revenue.ts <propertyName> [taxYear]
 */

import prisma from '../src/lib/db';

async function diagnoseProperty(propertyName: string, taxYear?: number) {
  try {
    const year = taxYear || new Date().getFullYear();
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    console.log('========================================');
    console.log(`Diagnosing: ${propertyName}`);
    console.log(`Tax Year: ${year}`);
    console.log(`Date Range: ${yearStart.toISOString()} to ${yearEnd.toISOString()}`);
    console.log('========================================\n');

    // 1. Find the property
    const property = await prisma.properties.findFirst({
      where: {
        name: {
          contains: propertyName,
          mode: 'insensitive',
        },
      },
      include: {
        units: {
          select: {
            id: true,
            unitNumber: true,
            monthlyRent: true,
            status: true,
            features: true,
          },
        },
        leases: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
            unitId: true,
            monthlyRent: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    });

    if (!property) {
      console.log('❌ Property not found!');
      return;
    }

    console.log('✅ Property Found:');
    console.log(`   ID: ${property.id}`);
    console.log(`   Name: ${property.name}`);
    console.log(`   Owner ID: ${property.ownerId}`);
    console.log(`   Customer ID: ${property.customerId}`);
    console.log(`   Total Units: ${property.units?.length || 0}`);
    console.log(`   Occupied Units: ${property.units?.filter((u: any) => u.status === 'occupied').length || 0}`);
    console.log(`   Active Leases: ${property.leases?.length || 0}\n`);

    // 2. Check payments
    console.log('📊 Checking Payments:');
    const allPayments = await prisma.payments.findMany({
      where: {
        propertyId: property.id,
      },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        paidAt: true,
        customerId: true,
        propertyId: true,
      },
      orderBy: {
        paidAt: 'desc',
      },
    });

    console.log(`   Total payments for property: ${allPayments.length}`);

    if (allPayments.length > 0) {
      console.log('\n   Payment Details:');
      allPayments.slice(0, 10).forEach((p: any, idx: number) => {
        const paidYear = p.paidAt ? new Date(p.paidAt).getFullYear() : 'N/A';
        console.log(`   ${idx + 1}. Amount: ₦${p.amount?.toLocaleString()}, Type: ${p.type}, Status: ${p.status}, Year: ${paidYear}, PaidAt: ${p.paidAt}`);
      });
      if (allPayments.length > 10) {
        console.log(`   ... and ${allPayments.length - 10} more payments`);
      }
    }

    // Filter payments for tax year
    const paymentsForYear = allPayments.filter((p: any) => {
      if (!p.paidAt) return false;
      const paymentYear = new Date(p.paidAt).getFullYear();
      return paymentYear === year;
    });

    console.log(`\n   Payments in ${year}: ${paymentsForYear.length}`);

    // Filter by type and status (same as tax calculator)
    const rentPayments = paymentsForYear.filter((p: any) => {
      return p.type === 'rent' && ['completed', 'success'].includes(p.status);
    });

    console.log(`   Rent payments (completed/success) in ${year}: ${rentPayments.length}`);

    const totalRevenue = rentPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
    console.log(`   Total Revenue from payments: ₦${totalRevenue.toLocaleString()}\n`);

    // 3. Check units and leases
    console.log('🏠 Checking Units & Leases:');
    if (property.units && property.units.length > 0) {
      console.log('\n   Units:');
      property.units.forEach((unit: any, idx: number) => {
        console.log(`   ${idx + 1}. ${unit.unitNumber || `Unit ${unit.id}`} - Status: ${unit.status}, Rent: ₦${unit.monthlyRent?.toLocaleString() || 0}`);
      });
    }

    if (property.leases && property.leases.length > 0) {
      console.log('\n   Active Leases:');
      property.leases.forEach((lease: any, idx: number) => {
        const startYear = new Date(lease.startDate).getFullYear();
        const endYear = lease.endDate ? new Date(lease.endDate).getFullYear() : 'Ongoing';
        const spansYear = startYear <= year && (!lease.endDate || new Date(lease.endDate).getFullYear() >= year);
        console.log(`   ${idx + 1}. Unit ID: ${lease.unitId}, Rent: ₦${lease.monthlyRent?.toLocaleString() || 0}, Start: ${lease.startDate}, End: ${lease.endDate || 'N/A'}, Spans ${year}: ${spansYear}`);
      });
    }

    // 4. Calculate potential revenue from occupied units
    console.log('\n💰 Potential Revenue Calculation:');
    let potentialRevenue = 0;
    const occupiedUnits = property.units?.filter((u: any) => u.status === 'occupied') || [];

    occupiedUnits.forEach((unit: any) => {
      let unitFeatures = unit.features;
      if (typeof unitFeatures === 'string') {
        try {
          unitFeatures = JSON.parse(unitFeatures);
        } catch {
          unitFeatures = {};
        }
      }

      const rentFrequency =
        (unitFeatures as any)?.nigeria?.rentFrequency ||
        (unitFeatures as any)?.rentFrequency ||
        'monthly';

      const monthlyRent = unit.monthlyRent || 0;

      if (rentFrequency === 'annual' || rentFrequency === 'yearly') {
        potentialRevenue += monthlyRent; // monthlyRent is actually annual rent
      } else {
        potentialRevenue += monthlyRent * 12; // Monthly rent × 12
      }
    });

    console.log(`   Potential Annual Revenue (from occupied units): ₦${potentialRevenue.toLocaleString()}`);
    console.log(`   Actual Revenue (from payments): ₦${totalRevenue.toLocaleString()}`);
    console.log(`   Difference: ₦${(potentialRevenue - totalRevenue).toLocaleString()}\n`);

    // 5. Check expenses
    console.log('💸 Checking Expenses:');
    const allExpenses = await prisma.expenses.findMany({
      where: {
        propertyId: property.id,
        category: { not: 'Property Tax' },
        status: { in: ['paid', 'pending'] },
      },
      select: {
        id: true,
        amount: true,
        category: true,
        date: true,
        paidDate: true,
        status: true,
      },
    });

    console.log(`   Total expenses: ${allExpenses.length}`);

    const expensesForYear = allExpenses.filter((exp: any) => {
      const expenseDate = exp.paidDate || exp.date;
      if (!expenseDate) return false;
      const expenseYear = new Date(expenseDate).getFullYear();
      return expenseYear === year;
    });

    console.log(`   Expenses in ${year}: ${expensesForYear.length}`);

    const totalExpenses = expensesForYear.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
    console.log(`   Total Expenses: ₦${totalExpenses.toLocaleString()}\n`);

    // 6. Summary
    console.log('========================================');
    console.log('SUMMARY:');
    console.log('========================================');
    console.log(`Property: ${property.name}`);
    console.log(`Tax Year: ${year}`);
    console.log(`Revenue from Payments: ₦${totalRevenue.toLocaleString()}`);
    console.log(`Potential Revenue (from units): ₦${potentialRevenue.toLocaleString()}`);
    console.log(`Expenses: ₦${totalExpenses.toLocaleString()}`);
    console.log(`Taxable Income: ₦${Math.max(0, totalRevenue - totalExpenses).toLocaleString()}`);

    if (totalRevenue === 0 && potentialRevenue > 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   No payment records found, but property has occupied units.');
      console.log('   The tax calculator requires actual payment records in the payments table.');
      console.log('   Consider:');
      console.log('   1. Recording rent payments in the Payments page');
      console.log('   2. Or updating the tax calculator to use occupied units as fallback');
    } else if (totalRevenue === 0 && potentialRevenue === 0) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   No revenue sources found.');
      console.log('   Property has no occupied units and no payment records.');
    } else if (totalRevenue > 0) {
      console.log('\n✅ Revenue found from payment records!');
    }

    console.log('========================================\n');
  } catch (error: any) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const propertyName = process.argv[2];
const taxYear = process.argv[3] ? parseInt(process.argv[3]) : undefined;

if (!propertyName) {
  console.error('Usage: npx ts-node scripts/diagnose-tax-revenue.ts <propertyName> [taxYear]');
  console.error('Example: npx ts-node scripts/diagnose-tax-revenue.ts "Adewole Estate" 2025');
  process.exit(1);
}

diagnoseProperty(propertyName, taxYear);

