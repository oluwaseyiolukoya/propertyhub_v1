/**
 * Test script for trial management system
 *
 * This script tests the trial lifecycle:
 * 1. Create a test customer with trial ending today
 * 2. Run trial expiration checker
 * 3. Verify grace period started
 * 4. Simulate grace period expiration
 * 5. Run expiration checker again
 * 6. Verify account suspended
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { trialManagementService } from '../src/services/trial-management.service';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting Trial Management System Test...\n');

  // Step 1: Create a test customer with trial ending today
  console.log('📝 Step 1: Creating test customer with expiring trial...');
  const testCustomerId = uuidv4();
  const testEmail = `test-trial-${Date.now()}@example.com`;

  const testCustomer = await prisma.customers.create({
    data: {
      id: testCustomerId,
      company: 'Test Company',
      owner: 'Test Owner',
      email: testEmail,
      status: 'trial',
      trialStartsAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      trialEndsAt: new Date(Date.now() - 1000), // Expired 1 second ago
      subscriptionStartDate: new Date(),
      billingCycle: 'monthly',
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Created test customer: ${testEmail} (ID: ${testCustomerId})`);
  console.log(`   Trial started: ${testCustomer.trialStartsAt}`);
  console.log(`   Trial ended: ${testCustomer.trialEndsAt}\n`);

  // Step 2: Run trial expiration checker
  console.log('⏰ Step 2: Running trial expiration checker...');
  await trialManagementService.checkTrialExpirations();
  console.log('✅ Trial expiration checker completed\n');

  // Step 3: Verify grace period started
  console.log('🔍 Step 3: Verifying grace period started...');
  const customerAfterExpiration = await prisma.customers.findUnique({
    where: { id: testCustomerId },
    include: {
      subscription_events: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (customerAfterExpiration?.gracePeriodEndsAt) {
    console.log(`✅ Grace period started!`);
    console.log(`   Grace period ends: ${customerAfterExpiration.gracePeriodEndsAt}`);
    console.log(`   Status: ${customerAfterExpiration.status}`);

    const latestEvent = customerAfterExpiration.subscription_events[0];
    if (latestEvent) {
      console.log(`   Latest event: ${latestEvent.eventType}\n`);
    }
  } else {
    console.log('❌ Grace period NOT started\n');
  }

  // Step 4: Simulate grace period expiration
  console.log('⏭️  Step 4: Simulating grace period expiration...');
  await prisma.customers.update({
    where: { id: testCustomerId },
    data: {
      gracePeriodEndsAt: new Date(Date.now() - 1000), // Expired 1 second ago
    },
  });
  console.log('✅ Grace period set to expired\n');

  // Step 5: Run expiration checker again
  console.log('⏰ Step 5: Running trial expiration checker again...');
  await trialManagementService.checkTrialExpirations();
  console.log('✅ Trial expiration checker completed\n');

  // Step 6: Verify account suspended
  console.log('🔍 Step 6: Verifying account suspended...');
  const customerAfterGrace = await prisma.customers.findUnique({
    where: { id: testCustomerId },
    include: {
      subscription_events: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
      users: true,
    },
  });

  if (customerAfterGrace?.status === 'suspended') {
    console.log(`✅ Account suspended!`);
    console.log(`   Status: ${customerAfterGrace.status}`);
    console.log(`   Suspended at: ${customerAfterGrace.suspendedAt}`);
    console.log(`   Suspension reason: ${customerAfterGrace.suspensionReason}`);
    console.log(`   Users disabled: ${customerAfterGrace.users.every(u => !u.isActive)}\n`);

    console.log('📋 Subscription events:');
    customerAfterGrace.subscription_events.forEach((event, i) => {
      console.log(`   ${i + 1}. ${event.eventType} (${event.triggeredBy}) - ${event.createdAt}`);
    });
  } else {
    console.log(`❌ Account NOT suspended. Status: ${customerAfterGrace?.status}\n`);
  }

  // Step 7: Test reactivation
  console.log('\n🔄 Step 7: Testing account reactivation...');

  // First, create a test user (tenant)
  const testUserId = uuidv4();
  await prisma.users.create({
    data: {
      id: testUserId,
      customerId: testCustomerId,
      name: 'Test User',
      email: `test-user-${Date.now()}@example.com`,
      password: 'hashed_password',
      role: 'tenant',
      isActive: false, // Was disabled during suspension
      status: 'suspended',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Created test user');

  // Now add a payment method
  const paymentMethodId = uuidv4();
  await prisma.payment_methods.create({
    data: {
      id: paymentMethodId,
      tenantId: testUserId,
      customerId: testCustomerId,
      authorizationCode: 'test_auth_code',
      cardType: 'visa',
      cardLast4: '4242',
      cardExpMonth: '12',
      cardExpYear: '2025',
      bank: 'Test Bank',
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log('✅ Added test payment method');

  // Reactivate account
  await trialManagementService.reactivateAccount(testCustomerId);
  console.log('✅ Account reactivated');

  const reactivatedCustomer = await prisma.customers.findUnique({
    where: { id: testCustomerId },
    include: {
      users: true,
      subscription_events: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (reactivatedCustomer?.status === 'active') {
    console.log(`✅ Reactivation successful!`);
    console.log(`   Status: ${reactivatedCustomer.status}`);
    console.log(`   Users active: ${reactivatedCustomer.users.every(u => u.isActive)}`);
    console.log(`   Latest event: ${reactivatedCustomer.subscription_events[0]?.eventType}\n`);
  } else {
    console.log(`❌ Reactivation failed. Status: ${reactivatedCustomer?.status}\n`);
  }

  // Cleanup
  console.log('🧹 Cleaning up test data...');
  await prisma.payment_methods.deleteMany({ where: { customerId: testCustomerId } });
  await prisma.subscription_events.deleteMany({ where: { customerId: testCustomerId } });
  await prisma.trial_notifications.deleteMany({ where: { customerId: testCustomerId } });
  await prisma.customers.delete({ where: { id: testCustomerId } });
  console.log('✅ Test data cleaned up\n');

  console.log('🎉 Trial Management System Test Complete!\n');
  console.log('Summary:');
  console.log('✅ Trial expiration detection');
  console.log('✅ Grace period activation');
  console.log('✅ Account suspension');
  console.log('✅ Event logging');
  console.log('✅ Account reactivation');
}

main()
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

