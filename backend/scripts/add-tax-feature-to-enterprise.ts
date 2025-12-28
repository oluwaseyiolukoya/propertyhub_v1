/**
 * Script to add tax_calculator feature to Enterprise plan
 * Run this to ensure Enterprise plan customers have access to Tax Calculator
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTaxFeatureToEnterprise() {
  try {
    console.log('🔄 Adding tax_calculator feature to Enterprise plan...\n');

    // Find Enterprise plan
    const enterprisePlan = await prisma.plans.findFirst({
      where: {
        category: 'property_management',
        name: 'Enterprise',
      },
    });

    if (!enterprisePlan) {
      console.log('❌ Enterprise plan not found');
      return;
    }

    console.log(`📦 Found Enterprise plan: ${enterprisePlan.id}`);

    // Parse existing features
    let features: string[] = [];
    if (Array.isArray(enterprisePlan.features)) {
      features = enterprisePlan.features.filter((f): f is string => typeof f === 'string');
    } else if (typeof enterprisePlan.features === 'string') {
      try {
        const parsed = JSON.parse(enterprisePlan.features);
        if (Array.isArray(parsed)) {
          features = parsed.filter((f): f is string => typeof f === 'string');
        }
      } catch {
        features = [];
      }
    } else if (typeof enterprisePlan.features === 'object' && enterprisePlan.features !== null) {
      const featuresObj = enterprisePlan.features as any;
      if (Array.isArray(featuresObj.features)) {
        features = featuresObj.features.filter((f): f is string => typeof f === 'string');
      } else if (Array.isArray(featuresObj.list)) {
        features = featuresObj.list.filter((f): f is string => typeof f === 'string');
      } else {
        features = Object.keys(featuresObj).filter(
          (key) => featuresObj[key] === true || featuresObj[key] === 'enabled'
        );
      }
    }

    console.log(`   Current features (${features.length}):`, features);

    // Check if tax_calculator already exists
    const hasTax = features.some(
      (f: string) =>
        f.toLowerCase() === 'tax_calculator' ||
        f.toLowerCase().includes('tax_calculator') ||
        f.toLowerCase() === 'tax calculator'
    );

    if (hasTax) {
      console.log('✅ Enterprise plan already has tax_calculator feature');
      return;
    }

    // Add tax_calculator feature
    features.push('Tax Calculator', 'tax_calculator');

    await prisma.plans.update({
      where: { id: enterprisePlan.id },
      data: {
        features,
        updatedAt: new Date(),
      },
    });

    console.log('✅ Successfully added tax_calculator feature to Enterprise plan');
    console.log(`   Updated features (${features.length}):`, features);

    // Verify
    const updatedPlan = await prisma.plans.findUnique({
      where: { id: enterprisePlan.id },
      select: {
        name: true,
        features: true,
      },
    });

    if (updatedPlan) {
      const updatedFeatures = Array.isArray(updatedPlan.features) ? updatedPlan.features : [];
      const hasTaxNow = updatedFeatures.some(
        (f: string) =>
          f.toLowerCase() === 'tax_calculator' ||
          f.toLowerCase().includes('tax_calculator') ||
          f.toLowerCase() === 'tax calculator'
      );
      console.log(`\n✅ Verification: ${hasTaxNow ? 'SUCCESS' : 'FAILED'}`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addTaxFeatureToEnterprise();

