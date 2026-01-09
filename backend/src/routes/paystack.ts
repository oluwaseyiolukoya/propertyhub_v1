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

      // Determine which secret to use: owner-level for rent, system-level for subscription
      let secretForHmac: string | undefined;
      if (type === "subscription") {
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

          // For subscription payments, verify the payment hasn't already been processed
          // to prevent duplicate processing
          if (type === "subscription") {
            const existingPayment = await prisma.payments.findFirst({
              where: {
                customerId,
                provider: "paystack",
                providerReference: reference,
                type: "subscription",
              },
            });

            // If payment exists and is already completed, skip update (idempotency)
            if (
              existingPayment &&
              (existingPayment.status === "completed" ||
                existingPayment.status === "success")
            ) {
              console.log(
                `[Paystack Webhook] Subscription payment ${reference} already processed, skipping update`
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

export default router;
