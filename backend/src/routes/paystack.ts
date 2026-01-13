import express, { Response, Request } from "express";
import crypto from "crypto";
import prisma from "../lib/db";
import { emitToCustomer, emitToUser } from "../lib/socket";

// This router must be mounted BEFORE express.json so we can access raw body
const router = express.Router();

// Use raw body for signature verification
router.post(
  "/webhook",
  express.raw({ type: "*/*" }),
  async (req: Request, res: Response) => {
    try {
      const signature = req.header("x-paystack-signature");
      if (!signature) {
        return res.status(400).send("Missing signature");
      }

      // Raw body buffer
      const raw = req.body as Buffer;
      let parsed: any;
      try {
        parsed = JSON.parse(raw.toString("utf8"));
      } catch {
        return res.status(400).send("Invalid JSON");
      }

      const event = parsed?.event;
      const data = parsed?.data;
      const metadata = data?.metadata || {};
      const customerId = metadata?.customerId as string | undefined;
      const type = metadata?.type as string | undefined;

      if (!customerId) {
        return res.status(400).send("Missing customerId in metadata");
      }

      // Determine which secret to use: owner-level for rent, system-level for subscription/upgrade
      let secretForHmac: string | undefined;
      if (type === "subscription" || type === "upgrade") {
        const system = await prisma.system_settings.findUnique({
          where: { key: "payments.paystack" },
        });
        const conf = (system?.value as any) || {};
        // Use system_settings secretKey if available, otherwise fall back to env var
        secretForHmac = conf.secretKey || process.env.PAYSTACK_SECRET_KEY;
      } else {
        const settings = await prisma.payment_settings.findFirst({
          where: { customerId, provider: "paystack" },
        });
        secretForHmac = settings?.secretKey || undefined;
      }

      if (!secretForHmac) {
        return res.status(400).send("Paystack configuration not found");
      }

      // Verify signature
      const computed = crypto
        .createHmac("sha512", secretForHmac)
        .update(raw)
        .digest("hex");

      if (computed !== signature) {
        return res.status(401).send("Invalid signature");
      }

      // Handle events
      if (event === "charge.success") {
        const reference: string | undefined = data?.reference;
        const amountKobo: number | undefined = data?.amount; // amount in kobo
        const currency: string | undefined = data?.currency;
        const paidAt: string | undefined = data?.paid_at;
        const fees: number | undefined = data?.fees; // may be undefined
        const transactionStatus: string | undefined = data?.status; // Transaction status from Paystack

        if (reference) {
          // IMPORTANT: Only update payment status if transaction status is actually "success"
          // This prevents premature status updates when webhook fires before user completes payment
          if (transactionStatus !== "success") {
            console.log(
              `[Paystack Webhook] Ignoring charge.success event - transaction status is "${transactionStatus}", not "success"`
            );
            return res.status(200).send("ok");
          }

          // For subscription/upgrade payments, verify the payment hasn't already been processed
          // to prevent duplicate processing
          // Note: type in metadata can be "subscription" or "upgrade", but payment type is always "subscription"
          if (type === "subscription" || type === "upgrade") {
            const existingPayment = await prisma.payments.findFirst({
              where: {
                customerId,
                provider: "paystack",
                providerReference: reference,
                type: "subscription", // Payment type is always "subscription" for upgrades
              },
            });

            // If payment exists and is already completed, skip update (idempotency)
            if (
              existingPayment &&
              (existingPayment.status === "completed" ||
                existingPayment.status === "paid" ||
                existingPayment.status === "success")
            ) {
              console.log(
                `[Paystack Webhook] Subscription/upgrade payment ${reference} already processed, skipping update`
              );
              return res.status(200).send("ok");
            }
          }

          const updated = await prisma.payments.updateMany({
            where: {
              customerId,
              provider: "paystack",
              providerReference: reference,
            },
            data: {
              status: "success",
              currency: currency || undefined,
              providerFee: fees || undefined,
              paidAt: paidAt ? new Date(paidAt) : new Date(),
              updatedAt: new Date(),
            },
          });
          // Emit socket events
          try {
            const payment = await prisma.payments.findFirst({
              where: { customerId, providerReference: reference },
            });
            if (payment) {
              emitToCustomer(customerId, "payment:updated", {
                reference,
                status: "success",
                amount: payment.amount,
                currency: payment.currency,
              });
              if (payment.tenantId)
                emitToUser(payment.tenantId, "payment:updated", {
                  reference,
                  status: "success",
                });
            } else {
              emitToCustomer(customerId, "payment:updated", {
                reference,
                status: "success",
              });
            }
          } catch {}
        }
      } else if (event === "charge.failed") {
        const reference: string | undefined = data?.reference;
        if (reference) {
          try {
            await prisma.payments.updateMany({
              where: {
                customerId,
                provider: "paystack",
                providerReference: reference,
              },
              data: { status: "failed", updatedAt: new Date() },
            });
            const payment = await prisma.payments.findFirst({
              where: { customerId, providerReference: reference },
            });
            if (payment) {
              emitToCustomer(customerId, "payment:updated", {
                reference,
                status: "failed",
                amount: payment.amount,
                currency: payment.currency,
              });
              if (payment.tenantId)
                emitToUser(payment.tenantId, "payment:updated", {
                  reference,
                  status: "failed",
                });
            } else {
              emitToCustomer(customerId, "payment:updated", {
                reference,
                status: "failed",
              });
            }
          } catch {}
        }
      }

      // Always acknowledge
      return res.status(200).send("ok");
    } catch (error: any) {
      console.error("❌ Paystack webhook error:", error);
      return res.status(500).send("server error");
    }
  }
);

// Manual sync endpoint for admins to verify payment status
// POST /api/paystack/sync-payment
router.post("/sync-payment", async (req: Request, res: Response) => {
  try {
    const { reference, customerId } = req.body;

    if (!reference) {
      return res.status(400).json({ error: "Payment reference is required" });
    }

    // Find the payment first to get customerId if not provided
    let payment;
    if (customerId) {
      payment = await prisma.payments.findFirst({
        where: {
          providerReference: reference,
          customerId,
          provider: "paystack",
        },
      });
    } else {
      payment = await prisma.payments.findFirst({
        where: {
          providerReference: reference,
          provider: "paystack",
        },
      });
    }

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const finalCustomerId = customerId || payment.customerId;

    // Determine which secret to use
    let secretKey: string | undefined;
    const paymentMetadata = payment.metadata as any;
    const paymentType = paymentMetadata?.type || payment.type;

    if (paymentType === "subscription" || paymentType === "upgrade") {
      const system = await prisma.system_settings.findUnique({
        where: { key: "payments.paystack" },
      });
      const conf = (system?.value as any) || {};
      secretKey = conf.secretKey || process.env.PAYSTACK_SECRET_KEY;
    } else {
      const settings = await prisma.payment_settings.findFirst({
        where: { customerId: finalCustomerId, provider: "paystack" },
      });
      secretKey = settings?.secretKey || process.env.PAYSTACK_SECRET_KEY;
    }

    if (!secretKey) {
      return res
        .status(400)
        .json({ error: "Paystack configuration not found" });
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const verifyData = (await verifyResponse.json()) as any;

    if (!verifyResponse.ok || !verifyData?.status) {
      return res.status(400).json({
        error: "Failed to verify payment",
        details: verifyData?.message || "Payment verification failed",
      });
    }

    const transaction = verifyData.data;

    // Update payment status based on Paystack response
    if (transaction.status === "success") {
      await prisma.payments.updateMany({
        where: {
          providerReference: reference,
          customerId: finalCustomerId,
          provider: "paystack",
        },
        data: {
          status: "success",
          currency: transaction.currency || payment.currency,
          providerFee: transaction.fees || payment.providerFee,
          paidAt: transaction.paid_at
            ? new Date(transaction.paid_at)
            : new Date(),
          updatedAt: new Date(),
        },
      });

      // Emit socket event
      try {
        const updatedPayment = await prisma.payments.findFirst({
          where: { providerReference: reference, customerId: finalCustomerId },
        });
        if (updatedPayment) {
          emitToCustomer(finalCustomerId, "payment:updated", {
            reference,
            status: "success",
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
          });
        }
      } catch {}

      return res.json({
        success: true,
        message: "Payment status synced successfully",
        status: "success",
        payment: await prisma.payments.findFirst({
          where: { providerReference: reference, customerId: finalCustomerId },
        }),
      });
    } else if (transaction.status === "failed") {
      await prisma.payments.updateMany({
        where: {
          providerReference: reference,
          customerId: finalCustomerId,
          provider: "paystack",
        },
        data: {
          status: "failed",
          updatedAt: new Date(),
        },
      });

      return res.json({
        success: true,
        message: "Payment status synced",
        status: "failed",
      });
    } else {
      return res.json({
        success: true,
        message: "Payment status synced",
        status: transaction.status || "pending",
      });
    }
  } catch (error: any) {
    console.error("❌ Paystack sync payment error:", error);
    return res.status(500).json({
      error: "Failed to sync payment status",
      details: error.message,
    });
  }
});

export default router;
