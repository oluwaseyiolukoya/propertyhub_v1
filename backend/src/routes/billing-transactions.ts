/**
 * Billing Transactions API (Admin Only)
 *
 * Provides aggregated view of all transactions (invoices + payments) for admin billing dashboard
 */

import express, { Response } from "express";
import prisma from "../lib/db";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth";

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware);
router.use(adminOnly);

// GET /api/billing-transactions - Get all transactions (invoices + payments) for admin
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { status, search, startDate, endDate, limit, page, pageSize } = req.query;
    // Support both old limit parameter and new pagination parameters
    const pageNum = page ? Math.max(1, parseInt(page as string)) : 1;
    const pageSizeNum = pageSize
      ? Math.min(parseInt(pageSize as string), 100)
      : limit
        ? Math.min(parseInt(limit as string), 100)
        : 10; // Default to 10 per page
    const skip = (pageNum - 1) * pageSizeNum;

    // Build where clause for invoices
    // Only include invoices from PropertyOwner (role: 'owner') and PropertyDeveloper (role: 'developer')
    const invoiceWhere: any = {
      customers: {
        users: {
          some: {
            role: { in: ["owner", "property_owner", "property owner", "developer", "property_developer", "property-developer"] },
          },
        },
      },
    };
    if (status && status !== "all") {
      if (status === "completed") {
        invoiceWhere.status = "paid";
      } else if (status === "pending") {
        invoiceWhere.status = { in: ["pending", "overdue"] };
      } else if (status === "refunded") {
        invoiceWhere.status = { in: ["refunded", "partially_refunded"] };
      }
    }

    if (startDate || endDate) {
      invoiceWhere.createdAt = {};
      if (startDate) invoiceWhere.createdAt.gte = new Date(startDate as string);
      if (endDate) invoiceWhere.createdAt.lte = new Date(endDate as string);
    }

    // Build where clause for payments
    // Only include payments from PropertyOwner (role: 'owner') and PropertyDeveloper (role: 'developer')
    const paymentWhere: any = {
      customers: {
        users: {
          some: {
            role: { in: ["owner", "property_owner", "property owner", "developer", "property_developer", "property-developer"] },
          },
        },
      },
    };
    if (status && status !== "all") {
      if (status === "completed") {
        paymentWhere.status = { in: ["completed", "success"] };
      } else if (status === "pending") {
        paymentWhere.status = "pending";
      } else if (status === "failed") {
        paymentWhere.status = "failed";
      }
    }

    if (startDate || endDate) {
      paymentWhere.createdAt = {};
      if (startDate) paymentWhere.createdAt.gte = new Date(startDate as string);
      if (endDate) paymentWhere.createdAt.lte = new Date(endDate as string);
    }

    // Fetch invoices and payments in parallel
    // Fetch a reasonable amount (1000) to allow for filtering and pagination
    const maxFetchLimit = 1000;
    const [invoices, payments] = await Promise.all([
      prisma.invoices.findMany({
        where: invoiceWhere,
        include: {
          customers: {
            select: {
              id: true,
              company: true,
              planId: true,
              plans: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: maxFetchLimit,
      }),
      prisma.payments.findMany({
        where: paymentWhere,
        include: {
          customers: {
            select: {
              id: true,
              company: true,
              planId: true,
              plans: {
                select: {
                  name: true,
                },
              },
            },
          },
          properties: {
            select: {
              id: true,
              name: true,
            },
          },
          units: {
            select: {
              id: true,
              unitNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: maxFetchLimit,
      }),
    ]);

    // Transform invoices to transaction format
    const invoiceTransactions = invoices.map((inv) => ({
      id: `inv-${inv.id}`,
      type: "invoice",
      customer: inv.customers?.company || "Unknown",
      customerId: inv.customerId,
      plan: inv.customers?.plans?.name || "—",
      amount: inv.amount,
      currency: inv.currency,
      status:
        inv.status === "paid"
          ? "completed"
          : inv.status === "refunded" || inv.status === "partially_refunded"
          ? "refunded"
          : "pending",
      date: inv.createdAt,
      invoice: inv.invoiceNumber,
      description: inv.description || `Invoice ${inv.invoiceNumber}`,
      billingPeriod: inv.billingPeriod,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      _raw: inv,
    }));

    // Transform payments to transaction format
    const paymentTransactions = payments.map((pay) => ({
      id: `pay-${pay.id}`,
      type: "payment",
      customer: pay.customers?.company || "Unknown",
      customerId: pay.customerId,
      plan: pay.customers?.plans?.name || "—",
      amount: pay.amount,
      currency: pay.currency,
      status:
        pay.status === "completed" || pay.status === "paid" || pay.status === "success"
          ? "completed"
          : pay.status === "failed"
          ? "failed"
          : "pending",
      date: pay.createdAt,
      invoice:
        pay.providerReference || `PAY-${pay.id.slice(0, 8).toUpperCase()}`,
      description: `${pay.type} payment${
        pay.properties ? ` for ${pay.properties.name}` : ""
      }${pay.units ? ` - Unit ${pay.units.unitNumber}` : ""}`,
      paymentMethod: pay.paymentMethod,
      provider: pay.provider,
      paidAt: pay.paidAt,
      invoiceId: pay.invoiceId, // Include invoiceId for deduplication
      _raw: pay,
    }));

    // Create a set of invoice IDs that have associated payments (for subscription payments)
    // For subscription payments, we only want to show the payment, not the invoice
    const invoiceIdsWithPayments = new Set(
      paymentTransactions
        .filter((pay) => {
          const paymentType = (pay._raw as any)?.type;
          return pay.invoiceId && paymentType === "subscription";
        })
        .map((pay) => pay.invoiceId)
        .filter((id): id is string => id !== null && id !== undefined)
    );

    // Filter out invoices that have associated subscription payments
    // Keep invoices that don't have payments or are not subscription-related
    const filteredInvoiceTransactions = invoiceTransactions.filter((inv) => {
      // If this invoice has a payment for a subscription, exclude it
      if (inv._raw?.id && invoiceIdsWithPayments.has(inv._raw.id)) {
        return false;
      }
      return true;
    });

    // Combine and sort by date (most recent first)
    const allTransactions = [
      ...filteredInvoiceTransactions,
      ...paymentTransactions,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply search filter if provided
    let filteredTransactions = allTransactions;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredTransactions = allTransactions.filter(
        (tx) =>
          tx.customer.toLowerCase().includes(searchLower) ||
          tx.plan.toLowerCase().includes(searchLower) ||
          tx.invoice.toLowerCase().includes(searchLower) ||
          tx.description.toLowerCase().includes(searchLower)
      );
    }

    // Get total count before pagination
    const totalCount = filteredTransactions.length;

    // Apply pagination
    const paginatedTransactions = filteredTransactions.slice(skip, skip + pageSizeNum);

    // Calculate summary stats for all filtered transactions (not just current page)
    const totalAmount = filteredTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    const completedCount = filteredTransactions.filter(
      (tx) => tx.status === "completed"
    ).length;
    const pendingCount = filteredTransactions.filter(
      (tx) => tx.status === "pending"
    ).length;
    const failedCount = filteredTransactions.filter(
      (tx) => tx.status === "failed"
    ).length;

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSizeNum),
      },
      summary: {
        total: totalCount,
        totalAmount,
        completed: completedCount,
        pending: pendingCount,
        failed: failedCount,
      },
    });
  } catch (error: any) {
    console.error("Billing transactions error:", error);
    res.status(500).json({ error: "Failed to fetch billing transactions" });
  }
});

export default router;
