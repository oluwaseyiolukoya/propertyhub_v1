#!/usr/bin/env tsx
/**
 * Check Payment Status by Reference
 *
 * This script queries the database to check the status of a Monicredit payment
 * Usage: tsx scripts/check-payment-by-reference.ts [order_id] [transaction_id]
 */

import prisma from "../src/lib/db";

const orderId = process.argv[2] || "PH-1765989259432-nzgcko";
const transactionId = process.argv[3] || "ACX6942DB8C6794A";

async function checkPayment() {
  console.log("🔍 Checking Payment Status");
  console.log("==========================");
  console.log(`Order ID: ${orderId}`);
  console.log(`Transaction ID: ${transactionId}`);
  console.log("");

  try {
    // Try to find by order_id (providerReference)
    let payment = await prisma.payments.findFirst({
      where: {
        provider: "monicredit",
        providerReference: orderId,
      },
    });

    // If not found, try by transaction_id in metadata
    if (!payment && transactionId) {
      payment = await prisma.payments.findFirst({
        where: {
          provider: "monicredit",
          OR: [
            { providerReference: transactionId },
            {
              metadata: {
                path: ["monicreditTransactionId"],
                equals: transactionId,
              },
            },
          ],
        },
      });
    }

    if (!payment) {
      console.log("❌ Payment not found in database");
      console.log("");
      console.log("Checking all recent Monicredit payments...");
      const recentPayments = await prisma.payments.findMany({
        where: {
          provider: "monicredit",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          status: true,
          providerReference: true,
          paidAt: true,
          updatedAt: true,
          metadata: true,
        },
      });

      if (recentPayments.length > 0) {
        console.log(
          `Found ${recentPayments.length} recent Monicredit payments:`
        );
        recentPayments.forEach((p, i) => {
          const meta = p.metadata as any;
          console.log(`\n${i + 1}. Payment ID: ${p.id}`);
          console.log(`   Status: ${p.status}`);
          console.log(`   Provider Reference: ${p.providerReference}`);
          console.log(
            `   Transaction ID: ${meta?.monicreditTransactionId || "N/A"}`
          );
          console.log(`   Paid At: ${p.paidAt || "N/A"}`);
          console.log(`   Updated At: ${p.updatedAt}`);
        });
      } else {
        console.log("No Monicredit payments found in database");
      }
      process.exit(1);
    }

    const metadata = payment.metadata as any;

    console.log("✅ Payment found!");
    console.log("");
    console.log("Payment Details:");
    console.log(`  ID: ${payment.id}`);
    console.log(`  Status: ${payment.status}`);
    console.log(`  Provider Reference: ${payment.providerReference}`);
    console.log(
      `  Transaction ID: ${metadata?.monicreditTransactionId || "N/A"}`
    );
    console.log(`  Order ID: ${metadata?.monicreditTransactionId || "N/A"}`);
    console.log(`  Amount: ${payment.amount} ${payment.currency}`);
    console.log(`  Paid At: ${payment.paidAt || "N/A"}`);
    console.log(`  Created At: ${payment.createdAt}`);
    console.log(`  Updated At: ${payment.updatedAt}`);
    console.log("");
    console.log("Metadata:");
    console.log(
      `  Monicredit Transaction ID: ${
        metadata?.monicreditTransactionId || "N/A"
      }`
    );
    console.log(
      `  Monicredit Order ID: ${metadata?.monicreditOrderId || "N/A"}`
    );
    console.log(
      `  Webhook Received At: ${metadata?.webhookReceivedAt || "N/A"}`
    );
    console.log(`  Initialized At: ${metadata?.initializedAt || "N/A"}`);
    console.log("");

    if (payment.status === "success") {
      console.log("✅ Payment status is SUCCESS");
      if (payment.paidAt) {
        console.log(`✅ Payment was marked as paid at: ${payment.paidAt}`);
      }
      if (metadata?.webhookReceivedAt) {
        console.log(
          `✅ Webhook was received at: ${metadata.webhookReceivedAt}`
        );
      }
    } else if (payment.status === "pending") {
      console.log("⚠️  Payment status is still PENDING");
      console.log("");
      console.log("Possible reasons:");
      console.log("  1. Webhook has not been received yet");
      console.log("  2. Webhook was received but payment was not found");
      console.log(
        "  3. Webhook was received but status value was not recognized"
      );
      console.log("");
      console.log("To debug:");
      console.log("  - Check backend logs for webhook processing");
      console.log(
        "  - Verify order_id and transaction_id match webhook payload"
      );
      console.log(
        "  - Check if webhook status value is 'APPROVED' or 'SUCCESS'"
      );
    } else if (payment.status === "failed") {
      console.log("❌ Payment status is FAILED");
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error checking payment:", error);
    process.exit(1);
  }
}

checkPayment();
