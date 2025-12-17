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
      // Log all headers and request details for debugging
      console.log("[Monicredit Payment Webhook] Request received:", {
        method: req.method,
        url: req.url,
        headers: req.headers,
        contentType: req.headers["content-type"],
        bodyType: typeof req.body,
        bodyLength: req.body ? (req.body as Buffer).length : 0,
      });

      // Monicredit may send verify token in header or body
      const verifyToken =
        req.header("x-verify-token") || req.header("verify-token");
      const raw = req.body as Buffer;

      if (!raw || raw.length === 0) {
        console.error("[Monicredit Payment Webhook] Empty body received");
        return res.status(400).send("Empty request body");
      }

      let parsed: any;
      try {
        const bodyString = raw.toString("utf8");
        console.log("[Monicredit Payment Webhook] Raw body:", bodyString);
        parsed = JSON.parse(bodyString);
      } catch (err) {
        console.error("[Monicredit Payment Webhook] JSON parse error:", err);
        console.error(
          "[Monicredit Payment Webhook] Raw body (first 500 chars):",
          raw.toString("utf8").substring(0, 500)
        );
        return res.status(400).send("Invalid JSON");
      }

      // Extract transaction details - try multiple possible field names
      // Also check nested objects and arrays
      const transactionId =
        parsed?.transaction_id ||
        parsed?.transid ||
        parsed?.transId ||
        parsed?.transactionId ||
        parsed?.id ||
        parsed?.data?.transaction_id ||
        parsed?.data?.transId ||
        parsed?.data?.transactionId ||
        parsed?.transaction?.id ||
        parsed?.transaction?.transaction_id ||
        parsed?.result?.transaction_id ||
        parsed?.result?.transId;
      const orderId =
        parsed?.order_id ||
        parsed?.orderid ||
        parsed?.orderId ||
        parsed?.data?.order_id ||
        parsed?.data?.orderId ||
        parsed?.order?.id ||
        parsed?.order?.order_id ||
        parsed?.result?.order_id ||
        parsed?.result?.orderId ||
        parsed?.order_number ||
        parsed?.reference;
      const status =
        parsed?.status ||
        parsed?.data?.status ||
        parsed?.payment_status ||
        parsed?.transaction_status ||
        parsed?.transactionStatus ||
        parsed?.paymentStatus;

      // Normalize status to uppercase for comparison
      const normalizedStatus = status ? String(status).toUpperCase() : null;
      const amount = parsed?.amount || parsed?.data?.amount;
      const customerId =
        parsed?.customerId ||
        parsed?.customer_id ||
        parsed?.metadata?.customerId ||
        parsed?.metadata?.customer_id ||
        parsed?.merchant_id ||
        parsed?.merchantId;

      console.log("[Monicredit Payment Webhook] Extracted data:", {
        transactionId,
        orderId,
        status,
        normalizedStatus,
        amount,
        customerId,
        fullPayload: parsed,
        allKeys: Object.keys(parsed),
        nestedKeys: parsed?.data ? Object.keys(parsed.data) : null,
        transactionKeys: parsed?.transaction
          ? Object.keys(parsed.transaction)
          : null,
      });

      // If transactionId and orderId are still undefined, log the full payload structure
      if (!transactionId && !orderId) {
        console.error(
          "[Monicredit Payment Webhook] CRITICAL: Both transactionId and orderId are undefined!",
          {
            payloadStructure: JSON.stringify(parsed, null, 2),
            topLevelKeys: Object.keys(parsed || {}),
          }
        );
      }

      // If customerId is missing, try to find payment by order_id or transaction_id alone
      // This allows webhook to work even if Monicredit doesn't send customerId
      if (!customerId) {
        console.warn(
          "[Monicredit Payment Webhook] Missing customerId, attempting to find payment by reference"
        );

        // Try to find payment by order_id or transaction_id across all customers
        // This is less secure but allows webhook to work
        let payment = null;
        if (orderId) {
          payment = await prisma.payments.findFirst({
            where: {
              provider: "monicredit",
              providerReference: orderId,
            },
          });
        }

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

        if (payment) {
          console.log(
            "[Monicredit Payment Webhook] Found payment without customerId:",
            {
              paymentId: payment.id,
              customerId: payment.customerId,
              providerReference: payment.providerReference,
            }
          );
          // Use the customerId from the found payment
          const foundCustomerId = payment.customerId;

          // Continue with the found customerId
          // We'll use this below instead of returning early
          // For now, let's proceed with the payment we found
          if (
            normalizedStatus === "APPROVED" ||
            normalizedStatus === "SUCCESS" ||
            status === "APPROVED" ||
            status === "SUCCESS"
          ) {
            const updated = await prisma.payments.update({
              where: { id: payment.id },
              data: {
                status: "success",
                currency: "NGN",
                paidAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                  ...((payment.metadata as any) || {}),
                  monicreditTransactionId: transactionId,
                  monicreditOrderId: orderId,
                  webhookReceivedAt: new Date().toISOString(),
                } as any,
              },
            });

            // Keep original providerReference (order_id) for frontend compatibility
            // Transaction ID is already stored in metadata for webhook matching
            console.log(
              "[Monicredit Payment Webhook] Keeping original providerReference:",
              payment.providerReference
            );

            try {
              const finalPayment = await prisma.payments.findUnique({
                where: { id: payment.id },
              });
              if (finalPayment) {
                emitToCustomer(foundCustomerId, "payment:updated", {
                  reference: finalPayment.providerReference,
                  status: "success",
                  amount: finalPayment.amount,
                  currency: finalPayment.currency,
                });
                if (finalPayment.tenantId) {
                  emitToUser(finalPayment.tenantId, "payment:updated", {
                    reference: finalPayment.providerReference,
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

            return res.status(200).json({
              status: "success",
              message: "Webhook received and processed",
            });
          } else if (
            normalizedStatus === "FAILED" ||
            normalizedStatus === "DECLINED" ||
            status === "FAILED" ||
            status === "DECLINED"
          ) {
            await prisma.payments.update({
              where: { id: payment.id },
              data: {
                status: "failed",
                updatedAt: new Date(),
                metadata: {
                  ...((payment.metadata as any) || {}),
                  monicreditTransactionId: transactionId,
                  monicreditOrderId: orderId,
                  webhookReceivedAt: new Date().toISOString(),
                } as any,
              },
            });

            emitToCustomer(foundCustomerId, "payment:updated", {
              reference: payment.providerReference,
              status: "failed",
              amount: payment.amount,
              currency: payment.currency,
            });
            if (payment.tenantId) {
              emitToUser(payment.tenantId, "payment:updated", {
                reference: payment.providerReference,
                status: "failed",
              });
            }

            return res.status(200).json({
              status: "success",
              message: "Webhook received and processed",
            });
          }
        } else {
          console.error(
            "[Monicredit Payment Webhook] Missing customerId and could not find payment by reference:",
            {
              transactionId,
              orderId,
              status,
              normalizedStatus,
              payloadKeys: Object.keys(parsed || {}),
              fullPayload: JSON.stringify(parsed, null, 2).substring(0, 500),
            }
          );
          // Still return 200 to prevent Monicredit from retrying
          return res.status(200).json({
            status: "success",
            message: "Webhook received but payment not found",
          });
        }
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
      if (
        normalizedStatus === "APPROVED" ||
        normalizedStatus === "SUCCESS" ||
        status === "APPROVED" ||
        status === "SUCCESS"
      ) {
        if (transactionId || orderId) {
          // Try to find payment by either order_id (our reference) or transaction_id (Monicredit's ID)
          // First try by order_id (our internal reference)
          let payment = orderId
            ? await prisma.payments.findFirst({
                where: {
                  customerId,
                  provider: "monicredit",
                  providerReference: orderId,
                },
              })
            : null;

          // If not found by order_id, try by transaction_id
          if (!payment && transactionId) {
            payment = await prisma.payments.findFirst({
              where: {
                customerId,
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
            console.error("[Monicredit Payment Webhook] Payment not found:", {
              transactionId,
              orderId,
              customerId,
            });
            // Still acknowledge webhook to prevent retries
            return res.status(200).json({
              status: "success",
              message: "Webhook received but payment not found",
            });
          }

          console.log(
            "[Monicredit Payment Webhook] Found payment, updating status:",
            {
              paymentId: payment.id,
              currentStatus: payment.status,
              orderId,
              transactionId,
              customerId,
            }
          );

          // Update payment - use the payment's ID for precise update
          const updated = await prisma.payments.update({
            where: { id: payment.id },
            data: {
              status: "success",
              currency: "NGN",
              paidAt: new Date(),
              updatedAt: new Date(),
              // Store Monicredit transaction_id in metadata if different from providerReference
              metadata: {
                ...((payment.metadata as any) || {}),
                monicreditTransactionId: transactionId,
                monicreditOrderId: orderId,
                webhookReceivedAt: new Date().toISOString(),
              } as any,
            },
          });

          console.log(
            "[Monicredit Payment Webhook] Payment updated successfully:",
            {
              paymentId: updated.id,
              newStatus: updated.status,
              paidAt: updated.paidAt,
              providerReference: updated.providerReference,
            }
          );

          // Also update providerReference if we have transactionId and it's different
          // BUT: Keep the original order_id as providerReference for frontend compatibility
          // The transaction_id is already stored in metadata for webhook matching
          // Only update providerReference if it's not already set to a valid reference
          // This ensures frontend can still find payment by original order_id
          if (transactionId && !payment.providerReference?.startsWith("ACX")) {
            // Only update if current providerReference is our internal format (PH-...)
            // This way frontend can still query by original order_id
            // But we also store transaction_id in metadata for webhook matching
            console.log(
              "[Monicredit Payment Webhook] Keeping original providerReference for frontend compatibility:",
              payment.providerReference
            );
            // Don't update providerReference - keep original order_id
            // Transaction ID is already in metadata for future webhook matching
          }

          // Emit socket events
          try {
            const finalPayment = await prisma.payments.findUnique({
              where: { id: payment.id },
            });
            if (finalPayment) {
              emitToCustomer(customerId, "payment:updated", {
                reference: finalPayment.providerReference,
                status: "success",
                amount: finalPayment.amount,
                currency: finalPayment.currency,
              });
              if (finalPayment.tenantId) {
                emitToUser(finalPayment.tenantId, "payment:updated", {
                  reference: finalPayment.providerReference,
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
      } else if (
        normalizedStatus === "FAILED" ||
        normalizedStatus === "DECLINED" ||
        status === "FAILED" ||
        status === "DECLINED"
      ) {
        if (transactionId || orderId) {
          // Try to find payment by either order_id or transaction_id
          let payment = orderId
            ? await prisma.payments.findFirst({
                where: {
                  customerId,
                  provider: "monicredit",
                  providerReference: orderId,
                },
              })
            : null;

          if (!payment && transactionId) {
            payment = await prisma.payments.findFirst({
              where: {
                customerId,
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

          if (payment) {
            try {
              await prisma.payments.update({
                where: { id: payment.id },
                data: {
                  status: "failed",
                  updatedAt: new Date(),
                  metadata: {
                    ...((payment.metadata as any) || {}),
                    monicreditTransactionId: transactionId,
                    monicreditOrderId: orderId,
                    webhookReceivedAt: new Date().toISOString(),
                  } as any,
                },
              });

              emitToCustomer(customerId, "payment:updated", {
                reference: payment.providerReference,
                status: "failed",
                amount: payment.amount,
                currency: payment.currency,
              });
              if (payment.tenantId) {
                emitToUser(payment.tenantId, "payment:updated", {
                  reference: payment.providerReference,
                  status: "failed",
                });
              }
            } catch (err) {
              console.error("[Monicredit Payment Webhook] Update error:", err);
            }
          } else {
            console.error(
              "[Monicredit Payment Webhook] Payment not found for failed status:",
              { transactionId, orderId, customerId }
            );
          }
        }
      }

      // Always acknowledge
      console.log("[Monicredit Payment Webhook] Webhook processing complete");
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
