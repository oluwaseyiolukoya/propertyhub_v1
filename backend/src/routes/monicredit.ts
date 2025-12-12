import express, { Response, Request } from "express";
import crypto from "crypto";
import prisma from "../lib/db";
import { emitToCustomer, emitToUser } from "../lib/socket";

// This router must be mounted BEFORE express.json so we can access raw body
const router = express.Router();

// Payment Webhook - handles payment events
router.post(
  "/webhook/payment",
  express.raw({ type: "*/*" }),
  async (req: Request, res: Response) => {
    try {
      // Monicredit may send verify token in header or body
      const verifyToken =
        req.header("x-verify-token") || req.header("verify-token");
      const raw = req.body as Buffer;

      let parsed: any;
      try {
        parsed = JSON.parse(raw.toString("utf8"));
      } catch {
        return res.status(400).send("Invalid JSON");
      }

      // Extract transaction details
      const transactionId = parsed?.transaction_id || parsed?.transid;
      const orderId = parsed?.order_id || parsed?.orderid;
      const status = parsed?.status || parsed?.data?.status;
      const amount = parsed?.amount || parsed?.data?.amount;
      const customerId = parsed?.customerId || parsed?.metadata?.customerId;

      if (!customerId) {
        console.error("[Monicredit Payment Webhook] Missing customerId");
        return res.status(400).send("Missing customerId");
      }

      // Verify token if provided
      if (verifyToken) {
        const settings = await prisma.payment_settings.findFirst({
          where: { customerId, provider: "monicredit" },
        });

        const storedToken = (settings?.metadata as any)?.verifyToken;
        if (storedToken && verifyToken !== storedToken) {
          console.error("[Monicredit Payment Webhook] Invalid verify token");
          return res.status(401).send("Invalid verify token");
        }
      }

      // Handle payment events based on status
      if (status === "APPROVED" || status === "SUCCESS") {
        if (transactionId || orderId) {
          const reference = transactionId || orderId;
          const updated = await prisma.payments.updateMany({
            where: {
              customerId,
              provider: "monicredit",
              providerReference: reference,
            },
            data: {
              status: "success",
              currency: "NGN",
              paidAt: new Date(),
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
              if (payment.tenantId) {
                emitToUser(payment.tenantId, "payment:updated", {
                  reference,
                  status: "success",
                });
              }
            }
          } catch (err) {
            console.error(
              "[Monicredit Payment Webhook] Socket emit error:",
              err
            );
          }
        }
      } else if (status === "FAILED" || status === "DECLINED") {
        if (transactionId || orderId) {
          const reference = transactionId || orderId;
          try {
            await prisma.payments.updateMany({
              where: {
                customerId,
                provider: "monicredit",
                providerReference: reference,
              },
              data: {
                status: "failed",
                updatedAt: new Date(),
              },
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
              if (payment.tenantId) {
                emitToUser(payment.tenantId, "payment:updated", {
                  reference,
                  status: "failed",
                });
              }
            }
          } catch (err) {
            console.error("[Monicredit Payment Webhook] Update error:", err);
          }
        }
      }

      // Always acknowledge
      return res
        .status(200)
        .json({ status: "success", message: "Webhook received" });
    } catch (error: any) {
      console.error("❌ Monicredit payment webhook error:", error);
      return res.status(500).json({ status: "error", message: "Server error" });
    }
  }
);

// Wallet Webhook - handles wallet-related events
router.post(
  "/webhook/wallet",
  express.raw({ type: "*/*" }),
  async (req: Request, res: Response) => {
    try {
      // Monicredit may send verify token in header or body
      const verifyToken =
        req.header("x-verify-token") || req.header("verify-token");
      const raw = req.body as Buffer;

      let parsed: any;
      try {
        parsed = JSON.parse(raw.toString("utf8"));
      } catch {
        return res.status(400).send("Invalid JSON");
      }

      // Extract wallet event details
      const walletId = parsed?.wallet_id;
      const customerId = parsed?.customerId || parsed?.metadata?.customerId;
      const eventType = parsed?.event || parsed?.type;

      if (!customerId) {
        console.error("[Monicredit Wallet Webhook] Missing customerId");
        return res.status(400).send("Missing customerId");
      }

      // Verify token if provided
      if (verifyToken) {
        const settings = await prisma.payment_settings.findFirst({
          where: { customerId, provider: "monicredit" },
        });

        const storedToken = (settings?.metadata as any)?.verifyToken;
        if (storedToken && verifyToken !== storedToken) {
          console.error("[Monicredit Wallet Webhook] Invalid verify token");
          return res.status(401).send("Invalid verify token");
        }
      }

      // Handle wallet events (virtual account creation, balance updates, etc.)
      console.log("[Monicredit Wallet Webhook] Event received:", {
        eventType,
        walletId,
        customerId,
      });

      // TODO: Implement wallet event handling based on Monicredit's wallet webhook format
      // This could include virtual account creation, balance updates, etc.

      // Always acknowledge
      return res
        .status(200)
        .json({ status: "success", message: "Webhook received" });
    } catch (error: any) {
      console.error("❌ Monicredit wallet webhook error:", error);
      return res.status(500).json({ status: "error", message: "Server error" });
    }
  }
);

export default router;
