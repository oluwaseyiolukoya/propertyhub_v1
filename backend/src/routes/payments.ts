import express, { Response } from "express";
import { randomUUID } from "crypto";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/db";
import { emitToCustomer, emitToUser } from "../lib/socket";

const router = express.Router();

router.use(authMiddleware);

// Get all payments (temporary stub until payments model is added)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const role = (req.user?.role || "").toLowerCase();
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId)
      return res.status(401).json({ error: "Unauthorized" });

    if (
      ![
        "owner",
        "property owner",
        "property_owner",
        "manager",
        "property_manager",
        "admin",
        "super_admin",
        "tenant",
      ].includes(role)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { status, method, propertyId, startDate, endDate, search, type } =
      req.query as any;
    const page = Math.max(1, parseInt((req.query as any).page || "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt((req.query as any).pageSize || "10", 10))
    );

    const where: any = { customerId };

    if (status) where.status = status;
    if (method) where.paymentMethod = method;
    if (type) where.type = type;
    if (propertyId) where.propertyId = propertyId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        {
          providerReference: { contains: String(search), mode: "insensitive" },
        },
        { type: { contains: String(search), mode: "insensitive" } },
      ];
    }

    // Scope by role
    if (["owner", "property owner", "property_owner"].includes(role)) {
      // For subscription payments, they're already scoped by customerId (no propertyId)
      // For rent/other payments, scope by property ownership
      if (type !== "subscription") {
        where.properties = { ownerId: userId };
      }
    } else if (["manager", "property_manager"].includes(role)) {
      // Managers can only see property-related payments, not subscriptions
      if (type === "subscription") {
        return res.json({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      where.properties = {
        property_managers: {
          some: { managerId: userId, isActive: true },
        },
      };
    } else if (role === "tenant") {
      // Tenants can only see their own rent payments, not subscriptions
      if (type === "subscription") {
        return res.json({ items: [], total: 0, page, pageSize, totalPages: 0 });
      }
      where.tenantId = userId;
    }

    console.log(
      "[Payments API] Query where clause:",
      JSON.stringify(where, null, 2)
    );

    const [total, list] = await Promise.all([
      prisma.payments.count({ where }),
      prisma.payments.findMany({
        where,
        include: {
          leases: {
            select: {
              id: true,
              leaseNumber: true,
              users: { select: { id: true, name: true, email: true } },
              properties: { select: { id: true, name: true } },
              units: { select: { id: true, unitNumber: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    console.log(
      "[Payments API] Found",
      total,
      "payments, returning",
      list.length,
      "items"
    );
    if (type === "subscription") {
      console.log(
        "[Payments API] Subscription payments:",
        list.map((p) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          paidAt: p.paidAt,
        }))
      );
    }

    return res.json({
      items: list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    console.error("Get payments error:", error);
    return res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Record manual payment (for cash, bank transfer, etc.) - Manager/Owner only
router.post("/record", async (req: AuthRequest, res: Response) => {
  try {
    const role = (req.user?.role || "").toLowerCase();
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId)
      return res.status(401).json({ error: "Unauthorized" });

    // Only managers and owners can record manual payments
    if (
      ![
        "owner",
        "property owner",
        "property_owner",
        "manager",
        "property_manager",
      ].includes(role)
    ) {
      return res
        .status(403)
        .json({ error: "Only managers and owners can record payments" });
    }

    const {
      leaseId,
      amount,
      paymentMethod,
      paymentDate,
      notes,
      type = "rent",
    } = req.body;

    if (!leaseId || !amount || !paymentMethod) {
      return res
        .status(400)
        .json({ error: "leaseId, amount, and paymentMethod are required" });
    }

    // Validate payment method
    const validMethods = [
      "cash",
      "bank_transfer",
      "cheque",
      "mobile_money",
      "other",
    ];
    if (!validMethods.includes(paymentMethod.toLowerCase())) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    // Fetch lease details
    const lease = await prisma.leases.findUnique({
      where: { id: leaseId },
      include: {
        properties: { select: { id: true, name: true, ownerId: true } },
        units: { select: { id: true, unitNumber: true } },
        users: { select: { id: true, name: true, email: true } },
      },
    });

    if (!lease) {
      return res.status(404).json({ error: "Lease not found" });
    }

    // Verify access rights
    if (["owner", "property owner", "property_owner"].includes(role)) {
      if (lease.properties.ownerId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only record payments for your properties" });
      }
    } else if (["manager", "property_manager"].includes(role)) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: lease.propertyId,
          managerId: userId,
          isActive: true,
        },
      });
      if (!assignment) {
        return res.status(403).json({
          error: "You can only record payments for properties you manage",
        });
      }
    }

    // Create payment record
    const reference = `PH-MANUAL-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const paidAt = paymentDate ? new Date(paymentDate) : new Date();

    const payment = await prisma.payments.create({
      data: {
        id: randomUUID(),
        customerId,
        propertyId: lease.propertyId,
        unitId: lease.unitId,
        leaseId: lease.id,
        tenantId: lease.tenantId,
        amount: parseFloat(amount),
        currency: lease.currency || "NGN",
        status: "success",
        type: type || "rent",
        paymentMethod: paymentMethod.toLowerCase(),
        provider: "manual",
        providerReference: reference,
        paidAt,
        metadata: {
          recordedBy: userId,
          recordedByRole: role,
          notes: notes || null,
        } as any,
        updatedAt: new Date(),
      },
      include: {
        leases: {
          select: {
            id: true,
            leaseNumber: true,
            users: { select: { id: true, name: true, email: true } },
            properties: { select: { id: true, name: true } },
            units: { select: { id: true, unitNumber: true } },
          },
        },
      },
    });

    // Emit real-time updates
    emitToCustomer(customerId, "payment:updated", payment);
    if (lease.tenantId) {
      emitToUser(lease.tenantId, "payment:updated", payment);
    }

    return res.status(201).json({ success: true, payment });
  } catch (error: any) {
    console.error("Record payment error:", error);
    return res.status(500).json({ error: "Failed to record payment" });
  }
});

// Update manual payment (amount, method, date, notes, type) - Owner/Manager only
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const role = (req.user?.role || "").toLowerCase();
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const { id } = req.params;

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only managers and owners can edit manual payments
    if (
      ![
        "owner",
        "property owner",
        "property_owner",
        "manager",
        "property_manager",
      ].includes(role)
    ) {
      return res
        .status(403)
        .json({ error: "Only managers and owners can edit payments" });
    }

    const existing = await prisma.payments.findUnique({
      where: { id },
      include: {
        properties: { select: { id: true, ownerId: true } },
      },
    });

    if (!existing || existing.customerId !== customerId) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Only manual, non-subscription payments can be edited from dashboard
    if (existing.provider !== "manual") {
      return res
        .status(400)
        .json({ error: "Only manually recorded payments can be edited" });
    }
    if (existing.type === "subscription") {
      return res
        .status(400)
        .json({ error: "Subscription payments cannot be edited from here" });
    }

    // Verify access rights similar to /record
    if (["owner", "property owner", "property_owner"].includes(role)) {
      if (existing.properties?.ownerId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only edit payments for your properties" });
      }
    } else if (["manager", "property_manager"].includes(role)) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: existing.propertyId,
          managerId: userId,
          isActive: true,
        },
      });
      if (!assignment) {
        return res.status(403).json({
          error: "You can only edit payments for properties you manage",
        });
      }
    }

    const { amount, paymentMethod, paymentDate, notes, type, status } =
      req.body || {};

    const data: any = {
      updatedAt: new Date(),
    };

    if (typeof amount !== "undefined") {
      const parsed = parseFloat(String(amount));
      if (Number.isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      data.amount = parsed;
    }

    if (typeof paymentMethod === "string" && paymentMethod.trim()) {
      const validMethods = [
        "cash",
        "bank_transfer",
        "cheque",
        "mobile_money",
        "other",
      ];
      const methodLower = paymentMethod.toLowerCase();
      if (!validMethods.includes(methodLower)) {
        return res.status(400).json({ error: "Invalid payment method" });
      }
      data.paymentMethod = methodLower;
    }

    if (typeof paymentDate === "string" && paymentDate) {
      const d = new Date(paymentDate);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: "Invalid payment date" });
      }
      data.paidAt = d;
    }

    if (typeof type === "string" && type.trim()) {
      data.type = type;
    }

    if (typeof status === "string" && status.trim()) {
      const validStatuses = ["success", "pending", "failed"];
      const statusLower = status.toLowerCase();
      if (!validStatuses.includes(statusLower)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      data.status = statusLower;
    }

    // Update notes inside metadata while preserving existing metadata fields
    if (typeof notes !== "undefined") {
      const currentMeta: any = (existing as any).metadata || {};
      data.metadata = {
        ...currentMeta,
        notes: notes || null,
      };
    }

    const updated = await prisma.payments.update({
      where: { id },
      data,
      include: {
        leases: {
          select: {
            id: true,
            leaseNumber: true,
            users: { select: { id: true, name: true, email: true } },
            properties: { select: { id: true, name: true } },
            units: { select: { id: true, unitNumber: true } },
          },
        },
      },
    });

    emitToCustomer(customerId, "payment:updated", updated);
    if (updated.tenantId) {
      emitToUser(updated.tenantId, "payment:updated", updated);
    }

    return res.json({ success: true, payment: updated });
  } catch (error: any) {
    console.error("Update payment error:", error);
    return res.status(500).json({ error: "Failed to update payment" });
  }
});

// Delete manual payment - Owner/Manager only
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const role = (req.user?.role || "").toLowerCase();
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const { id } = req.params;

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
      ![
        "owner",
        "property owner",
        "property_owner",
        "manager",
        "property_manager",
      ].includes(role)
    ) {
      return res
        .status(403)
        .json({ error: "Only managers and owners can delete payments" });
    }

    const existing = await prisma.payments.findUnique({
      where: { id },
      include: {
        properties: { select: { id: true, ownerId: true } },
      },
    });

    if (!existing || existing.customerId !== customerId) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (existing.provider !== "manual") {
      return res
        .status(400)
        .json({ error: "Only manually recorded payments can be deleted" });
    }
    if (existing.type === "subscription") {
      return res
        .status(400)
        .json({ error: "Subscription payments cannot be deleted from here" });
    }

    if (["owner", "property owner", "property_owner"].includes(role)) {
      if (existing.properties?.ownerId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only delete payments for your properties" });
      }
    } else if (["manager", "property_manager"].includes(role)) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: existing.propertyId,
          managerId: userId,
          isActive: true,
        },
      });
      if (!assignment) {
        return res.status(403).json({
          error: "You can only delete payments for properties you manage",
        });
      }
    }

    await prisma.payments.delete({
      where: { id },
    });

    emitToCustomer(customerId, "payment:deleted", { id });
    if (existing.tenantId) {
      emitToUser(existing.tenantId, "payment:deleted", { id });
    }

    return res.json({ success: true, message: "Payment deleted successfully" });
  } catch (error: any) {
    console.error("Delete payment error:", error);
    return res.status(500).json({ error: "Failed to delete payment" });
  }
});

// Initialize tenant payment via Paystack
router.post("/initialize", async (req: AuthRequest, res: Response) => {
  try {
    // Ensure real database is configured
    const hasPrismaPayments =
      (prisma as any)?.payments?.create &&
      (prisma as any)?.payment_settings?.findFirst;
    if (!hasPrismaPayments) {
      return res.status(503).json({
        error:
          "Database not configured for payments. Set DATABASE_URL and run Prisma migrations.",
        action:
          "Create backend/.env with DATABASE_URL, then: cd backend && npx prisma generate && npx prisma migrate dev",
      });
    }

    const user = req.user;
    if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { leaseId, amount, currency } = req.body || {};
    if (!leaseId) return res.status(400).json({ error: "leaseId is required" });

    // Load lease, tenant, property, customer
    const lease = await prisma.leases.findUnique({
      where: { id: leaseId },
      include: {
        users: { select: { id: true, email: true, name: true } },
        properties: {
          select: { id: true, customerId: true, ownerId: true, currency: true },
        },
        units: { select: { id: true, unitNumber: true } },
      },
    });
    if (!lease) return res.status(404).json({ error: "Lease not found" });

    const customerId = lease.properties.customerId;
    const tenant = lease.users;
    const property = lease.properties;
    const unit = lease.units;

    // Ensure tenant or manager/owner can initiate
    const role = (user.role || "").toLowerCase();
    if (
      ![
        "tenant",
        "manager",
        "property_manager",
        "owner",
        "property owner",
        "property_owner",
        "admin",
        "super_admin",
      ].includes(role)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Payment settings - check for any enabled gateway (Paystack or Monicredit)
    // Priority: Paystack first, then Monicredit
    const paystackSettings = await prisma.payment_settings.findFirst({
      where: { customerId, provider: "paystack", isEnabled: true },
    });
    const monicreditSettings = await prisma.payment_settings.findFirst({
      where: { customerId, provider: "monicredit", isEnabled: true },
    });

    console.log("[Payment Init] Checking payment gateways:", {
      customerId,
      hasPaystack: !!paystackSettings,
      paystackEnabled: paystackSettings?.isEnabled,
      hasPaystackKeys: !!(
        paystackSettings?.secretKey && paystackSettings?.publicKey
      ),
      hasMonicredit: !!monicreditSettings,
      monicreditEnabled: monicreditSettings?.isEnabled,
      hasMonicreditKeys: !!(
        monicreditSettings?.secretKey && monicreditSettings?.publicKey
      ),
    });

    // Use the first enabled gateway found (Paystack has priority)
    const settings = paystackSettings || monicreditSettings;
    const provider = paystackSettings
      ? "paystack"
      : monicreditSettings
      ? "monicredit"
      : null;

    if (!settings || !provider) {
      console.error(
        "[Payment Init] No enabled payment gateway found for customer:",
        customerId
      );
      return res.status(400).json({
        error: "Owner has not configured any payment gateway",
        details:
          "Please ask the property owner to configure a payment gateway (Paystack or Monicredit) in their settings.",
      });
    }

    // Validate required keys based on provider
    if (
      provider === "paystack" &&
      (!settings.secretKey || !settings.publicKey)
    ) {
      console.error("[Payment Init] Paystack keys missing:", {
        hasSecretKey: !!settings.secretKey,
        hasPublicKey: !!settings.publicKey,
      });
      return res.status(400).json({
        error: "Owner has not configured Paystack properly",
        details:
          "Paystack public key or secret key is missing. Please ask the property owner to complete their Paystack configuration.",
      });
    }
    if (
      provider === "monicredit" &&
      (!settings.secretKey || !settings.publicKey)
    ) {
      console.error("[Payment Init] Monicredit keys missing:", {
        hasSecretKey: !!settings.secretKey,
        hasPublicKey: !!settings.publicKey,
      });
      return res.status(400).json({
        error: "Owner has not configured Monicredit properly",
        details:
          "Monicredit public key or private key is missing. Please ask the property owner to complete their Monicredit configuration.",
      });
    }

    // Determine amount and currency
    const payAmount =
      typeof amount === "number" && amount > 0 ? amount : lease.monthlyRent;
    let payCurrency = (
      currency ||
      lease.currency ||
      property.currency ||
      "NGN"
    ).toUpperCase();
    // Enforce Paystack-supported currencies; default to NGN
    const supportedCurrencies = new Set(["NGN"]);
    if (!supportedCurrencies.has(payCurrency)) {
      payCurrency = "NGN";
    }

    // Create pending payment record
    const reference = `PH-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    try {
      await prisma.payments.create({
        data: {
          id: randomUUID(),
          customerId,
          propertyId: property.id,
          unitId: unit?.id || null,
          leaseId: lease.id,
          tenantId: tenant.id,
          amount: payAmount,
          currency: payCurrency,
          status: "pending",
          type: "rent",
          provider: provider,
          providerReference: reference,
          metadata: {
            leaseNumber: lease.leaseNumber,
            unitNumber: unit?.unitNumber,
          } as any,
          updatedAt: new Date(),
        },
      });
    } catch (err: any) {
      // Prisma code P2021: table does not exist; P2022: column does not exist
      if (err?.code === "P2021" || err?.code === "P2022") {
        console.error(
          "Payments table missing or out of date. Run migrations.",
          err?.meta || err
        );
        return res.status(503).json({
          error:
            "Database not migrated for payments. Please run prisma migrate.",
          action: "Execute: cd backend && npx prisma migrate dev",
        });
      }
      throw err;
    }

    // Initialize transaction based on provider
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const callbackUrl = `${frontendUrl}/?payment_ref=${encodeURIComponent(
      reference
    )}`;

    let resp: any;
    let authorizationUrl: string | null = null;

    if (provider === "paystack") {
      // Paystack payment initialization
      try {
        resp = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${settings.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: tenant.email || `${tenant.id}@tenant.local`,
            amount: Math.round(payAmount * 100),
            currency: payCurrency,
            reference,
            callback_url: callbackUrl,
            metadata: {
              customerId,
              leaseId: lease.id,
              propertyId: property.id,
              unitId: unit?.id,
              tenantId: tenant.id,
              type: "rent",
            },
          }),
        } as any);
      } catch (err: any) {
        console.error("Paystack init network error:", err?.message || err);
        try {
          await prisma.payments.updateMany({
            where: {
              customerId,
              provider: provider,
              providerReference: reference,
            },
            data: { status: "failed", updatedAt: new Date() },
          });
        } catch {}
        return res.status(400).json({
          error: "Network error initializing payment. Please try again.",
        });
      }

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || !json?.status) {
        console.error("Paystack init error:", json);
        try {
          await prisma.payments.updateMany({
            where: {
              customerId,
              provider: provider,
              providerReference: reference,
            },
            data: { status: "failed", updatedAt: new Date() },
          });
        } catch {}
        return res
          .status(400)
          .json({ error: json?.message || "Failed to initialize payment" });
      }

      authorizationUrl = json.data?.authorization_url;
    } else if (provider === "monicredit") {
      // Monicredit payment initialization
      // Based on Monicredit API documentation:
      // 1. First authenticate to get Bearer token
      // 2. Use Bearer token for transaction initiation
      // Base URL structure: https://demo.backend.monicredit.com/api/v1/...
      const monicreditBaseUrl =
        process.env.MONICREDIT_BASE_URL ||
        "https://demo.backend.monicredit.com";
      // Monicredit API base - try both /api/v1 and direct /v1 patterns
      // The init-transaction endpoint uses /v1/payment/transactions/init-transaction
      const monicreditApiBase = `${monicreditBaseUrl}/api/v1`;
      const monicreditApiBaseV1 = `${monicreditBaseUrl}/v1`; // For endpoints that use /v1 directly

      try {
        // Step 1: Get owner's email for Monicredit authentication
        // Monicredit login requires email, public_key, and private_key
        // customerId refers to the customers table, not users table
        const customer = await prisma.customers.findUnique({
          where: { id: customerId },
          select: { email: true },
        });

        if (!customer?.email) {
          throw new Error(
            "Owner email not found. Please ensure the property owner has a valid email address in their customer profile."
          );
        }

        const ownerEmail = customer.email;

        // Step 2: Authenticate with Monicredit to get Bearer token
        // Endpoint: POST /api/v1/core/auth/login
        const loginUrl = `${monicreditApiBase}/core/auth/login`;

        console.log("[Monicredit Auth] Authenticating to get Bearer token...", {
          loginUrl,
          ownerEmail: ownerEmail,
          customerId,
          hasPublicKey: !!settings.publicKey,
          hasPrivateKey: !!settings.secretKey,
        });

        // Monicredit authentication - try two approaches:
        // Approach 1: Login endpoint (requires account email + account password, not API keys)
        // Approach 2: Basic Auth directly on transaction endpoint (public_key:private_key)
        // Since login requires account password (not API private key), we'll try Basic Auth first

        // Try Basic Auth directly on transaction endpoint (common for payment APIs)
        // Based on Monicredit docs, transaction endpoints are under /payment/transactions
        // Try common patterns: /payment/transactions/init, /payment/transactions/initiate, /payment/initiate

        // Define possible endpoints to try
        // Based on Monicredit API documentation:
        // - Standard payment: POST /v1/payment/transactions/init-transaction
        //   (from https://monicredit.gitbook.io/mc-api/collection/accept-payment-standard)
        // Note: The endpoint uses /v1/ not /api/v1/, so we need to adjust the base URL
        const possibleEndpoints = [
          process.env.MONICREDIT_TRANSACTION_ENDPOINT, // User-configured first
          "/v1/payment/transactions/init-transaction", // Official endpoint from docs
          "/payment/transactions/init-transaction", // Alternative (without /v1)
          "/api/v1/payment/transactions/init-transaction", // With /api/v1 prefix
        ].filter(Boolean) as string[]; // Remove undefined and type as string array

        // Create Basic Auth header: base64(publicKey:privateKey)
        const credentials = `${settings.publicKey}:${settings.secretKey}`;
        const base64Credentials = Buffer.from(credentials).toString("base64");

        console.log(
          "[Monicredit] Attempting Basic Auth on transaction endpoints:",
          {
            endpointsToTry: possibleEndpoints,
            hasPublicKey: !!settings.publicKey,
            hasPrivateKey: !!settings.secretKey,
            publicKeyPreview: settings.publicKey
              ? `${settings.publicKey.substring(0, 15)}...`
              : null,
          }
        );

        // Try transaction endpoint with Basic Auth first
        // Try multiple endpoints if the first one fails with 404/400 (route not found)
        let resp: Response | null = null;
        let lastError: any = null;
        let successfulEndpoint: string | null = null;
        let successfulUrl: string | null = null;

        for (const endpoint of possibleEndpoints) {
          // Try with /api/v1 base first, then /v1 base if endpoint starts with /v1
          let testUrl: string;
          if (endpoint.startsWith("/v1/")) {
            // Endpoint already includes /v1, use base URL directly
            testUrl = `${monicreditBaseUrl}${endpoint}`;
          } else if (endpoint.startsWith("/api/v1/")) {
            // Endpoint already includes /api/v1, use base URL directly
            testUrl = `${monicreditBaseUrl}${endpoint}`;
          } else {
            // Endpoint is relative, try with /api/v1 base first
            testUrl = `${monicreditApiBase}${endpoint}`;
          }
          console.log(`[Monicredit] Trying endpoint: ${testUrl}`);

          try {
            // Try with Basic Auth first, but Monicredit Standard Payment API might use public_key in body
            // According to docs, public_key is in the request body, not necessarily in headers
            const testResp = await fetch(testUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                // Try Basic Auth, but Monicredit might not require it if public_key is in body
                ...(base64Credentials
                  ? { Authorization: `Basic ${base64Credentials}` }
                  : {}),
              },
              body: JSON.stringify({
                // Monicredit Standard Payment API format (from official docs)
                order_id: reference,
                public_key: settings.publicKey, // Required in body
                customer: {
                  first_name: tenant.name?.split(" ")[0] || "Tenant",
                  last_name:
                    tenant.name?.split(" ").slice(1).join(" ") || "User",
                  email: tenant.email || `${tenant.id}@tenant.local`,
                  phone: tenant.phone || "00000000000",
                  // bvn or nin required by new policies
                  // bvn: "", // Add if available
                  // nin: "", // Add if available
                },
                items: [
                  {
                    item: "Rent Payment",
                    // revenue_head_code might be required - if Monicredit rejects, owner needs to create revenue head
                    revenue_head_code:
                      process.env.MONICREDIT_REVENUE_HEAD_CODE || "",
                    unit_cost: payAmount.toString(),
                    // split_details: [] // Optional
                  },
                ],
                currency: payCurrency || "NGN",
                paytype: "standard", // Required for standard flow
                // Optional metadata
                meta_data: {
                  customerId,
                  leaseId: lease.id,
                  propertyId: property.id,
                  unitId: unit?.id,
                  tenantId: tenant.id,
                  type: "rent",
                  callback_url: callbackUrl,
                },
              }),
            } as any);

            // If we get a non-404/400 response, this might be the right endpoint
            // 401/403 = auth issue (endpoint exists), 404/400 = route not found
            if (testResp.status !== 404 && testResp.status !== 400) {
              console.log(
                `[Monicredit] Endpoint ${endpoint} returned status ${testResp.status} - using this endpoint`
              );
              resp = testResp;
              successfulEndpoint = endpoint;
              successfulUrl = testUrl;
              break;
            }

            // If 404/400, try next endpoint
            const testRaw = await testResp.text();
            let testJson: any = {};
            try {
              testJson = JSON.parse(testRaw);
            } catch {}

            if (
              testJson?.message?.includes("route") ||
              testJson?.errors?.includes("route")
            ) {
              console.log(
                `[Monicredit] Endpoint ${endpoint} returned 404/400 (route not found) - trying next endpoint`
              );
              continue;
            } else {
              // Not a "route not found" error, use this response
              resp = testResp;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.log(
              `[Monicredit] Endpoint ${endpoint} failed:`,
              err.message
            );
            continue;
          }
        }

        if (!resp) {
          throw new Error(
            `All Monicredit transaction endpoints failed. Tried: ${possibleEndpoints.join(
              ", "
            )}. Please check Monicredit API documentation for the correct transaction initiation endpoint, or set MONICREDIT_TRANSACTION_ENDPOINT environment variable.`
          );
        }

        // If Basic Auth works (status 200-299), use it
        if (resp.ok) {
          console.log(
            "[Monicredit] Basic Auth successful on transaction endpoint"
          );
          // Continue with response processing below
        } else if (resp.status === 401 || resp.status === 403) {
          // Basic Auth failed, try login endpoint approach
          console.log(
            "[Monicredit] Basic Auth failed, trying login endpoint..."
          );

          const loginUrl = `${monicreditApiBase}/core/auth/login`;
          const loginBody = {
            email: ownerEmail,
            password: settings.secretKey, // Try private key as password
          };

          const loginResp = await fetch(loginUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(loginBody),
          } as any);

          const loginRaw = await loginResp.text();
          let loginJson: any = {};

          try {
            loginJson = JSON.parse(loginRaw);
          } catch (err) {
            throw new Error(
              `Monicredit authentication failed: Invalid login response. Status: ${loginResp.status}`
            );
          }

          if (!loginResp.ok || !loginJson?.success || !loginJson?.accessToken) {
            throw new Error(
              loginJson?.message ||
                `Monicredit login failed. The login endpoint requires your Monicredit account password (not the API private key). Please verify your account email and password, or contact Monicredit support for API authentication instructions.`
            );
          }

          const bearerToken = loginJson.accessToken;
          console.log("[Monicredit] Login successful, using Bearer token");

          // Retry transaction with Bearer token using the successful endpoint
          const retryUrl =
            successfulUrl || `${monicreditApiBase}${possibleEndpoints[0]}`;
          resp = await fetch(retryUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${bearerToken}`,
            },
            body: JSON.stringify({
              // Monicredit Standard Payment API format (from official docs)
              order_id: reference,
              public_key: settings.publicKey, // Required in body
              customer: {
                first_name: tenant.name?.split(" ")[0] || "Tenant",
                last_name: tenant.name?.split(" ").slice(1).join(" ") || "User",
                email: tenant.email || `${tenant.id}@tenant.local`,
                phone: tenant.phone || "00000000000",
              },
              items: [
                {
                  item: "Rent Payment",
                  revenue_head_code:
                    process.env.MONICREDIT_REVENUE_HEAD_CODE || "",
                  unit_cost: payAmount.toString(),
                },
              ],
              currency: payCurrency || "NGN",
              paytype: "standard", // Required for standard flow
              meta_data: {
                customerId,
                leaseId: lease.id,
                propertyId: property.id,
                unitId: unit?.id,
                tenantId: tenant.id,
                type: "rent",
                callback_url: callbackUrl,
              },
            }),
          } as any);
        }

        // Continue with response processing below

        console.log(
          "[Monicredit Transaction] Response status:",
          resp.status,
          resp.statusText,
          "URL:",
          successfulUrl || "unknown"
        );

        // If we get 405, the endpoint exists but method is wrong - provide detailed guidance
        if (resp.status === 405) {
          console.error("[Monicredit] ⚠️ 405 Method Not Allowed");
          console.error(
            "[Monicredit] The endpoint exists but doesn't accept POST method"
          );
          console.error("[Monicredit] Possible solutions:");
          console.error(
            "  1. Check Monicredit API documentation for the correct endpoint path"
          );
          console.error(
            "  2. Verify the HTTP method (might need GET, PUT, or different method)"
          );
          console.error(
            "  3. Check if endpoint requires public_key in URL path"
          );
          console.error("  4. Verify the base URL is correct");
          console.error(`[Monicredit] Current configuration:`);
          console.error(`  - Base URL: ${monicreditBaseUrl}`);
          console.error(`  - Endpoint: ${successfulEndpoint || "unknown"}`);
          console.error(`  - Full URL: ${successfulUrl || "unknown"}`);
          console.error(`  - Method: POST`);
          console.error(
            `[Monicredit] To configure a different endpoint, set MONICREDIT_TRANSACTION_ENDPOINT environment variable`
          );
        }

        // Get raw response to handle both JSON and non-JSON responses
        const rawResponse = await resp.text();
        console.log("[Monicredit Transaction] Raw response:", {
          status: resp.status,
          statusText: resp.statusText,
          contentType: resp.headers.get("content-type"),
          responseLength: rawResponse.length,
          responsePreview: rawResponse.substring(0, 500),
        });

        let json: any = {};
        try {
          json = JSON.parse(rawResponse);
        } catch (err) {
          console.error("[Monicredit Transaction] JSON parse error:", err);
          // If HTML response, extract error
          if (
            rawResponse.includes("<html>") ||
            rawResponse.includes("<!DOCTYPE")
          ) {
            const titleMatch = rawResponse.match(/<title>(.*?)<\/title>/i);
            const errorTitle = titleMatch ? titleMatch[1] : "Unknown error";
            json = {
              error: "Received HTML response",
              details: `Status: ${resp.status}. ${errorTitle}. Check Monicredit API endpoint and configuration.`,
            };
          } else {
            json = {
              error: "Failed to parse response",
              details: `Response was not valid JSON. Status: ${
                resp.status
              }. Response: ${rawResponse.substring(0, 200)}`,
            };
          }
        }

        console.log("[Monicredit Transaction] Parsed response:", {
          ok: resp.ok,
          status: resp.status,
          hasSuccess: !!json?.success,
          hasData: !!json?.data,
          responseKeys: Object.keys(json || {}),
          error: json?.error || json?.message,
        });

        if (!resp.ok) {
          console.error("[Monicredit Transaction] Init failed:", {
            status: resp.status,
            statusText: resp.statusText,
            response: json,
            rawResponsePreview: rawResponse.substring(0, 500),
          });
          try {
            await prisma.payments.updateMany({
              where: {
                customerId,
                provider: provider,
                providerReference: reference,
              },
              data: { status: "failed", updatedAt: new Date() },
            });
          } catch {}
          // Provide specific guidance for 405 errors
          const errorDetails =
            resp.status === 405
              ? `The Monicredit API endpoint exists but doesn't accept POST method. ` +
                `Please check your Monicredit API documentation for the correct endpoint path and HTTP method. ` +
                `Current endpoint: ${successfulEndpoint || "unknown"}. ` +
                `You can configure a different endpoint using MONICREDIT_TRANSACTION_ENDPOINT environment variable.`
              : json?.details ||
                `Transaction initialization failed with status ${resp.status}. Please check your Monicredit API keys and endpoint configuration.`;

          return res.status(400).json({
            error:
              json?.error || json?.message || "Failed to initialize payment",
            details: errorDetails,
            statusCode: resp.status,
            endpoint: successfulUrl || "unknown",
            method: "POST",
          });
        }

        // Monicredit Standard Payment API response format (from official docs):
        // { status: true, authorization_url: "...", id: "..." }
        let rawAuthUrl =
          json.authorization_url || // Standard response format
          json.data?.authorization_url ||
          json.data?.payment_url ||
          json.data?.checkout_url ||
          json.payment_url ||
          json.checkout_url;

        // Ensure authorization URL has protocol (Monicredit sometimes returns URLs without https://)
        if (rawAuthUrl) {
          if (
            !rawAuthUrl.startsWith("http://") &&
            !rawAuthUrl.startsWith("https://")
          ) {
            // Prepend https:// if protocol is missing
            authorizationUrl = `https://${rawAuthUrl}`;
          } else {
            authorizationUrl = rawAuthUrl;
          }
        }

        console.log("[Monicredit Transaction] Authorization URL:", {
          found: !!authorizationUrl,
          url: authorizationUrl
            ? `${authorizationUrl.substring(0, 50)}...`
            : null,
          originalUrl: rawAuthUrl ? `${rawAuthUrl.substring(0, 50)}...` : null,
          hadProtocol: rawAuthUrl?.startsWith("http"),
          responseStructure: {
            hasData: !!json.data,
            topLevelKeys: Object.keys(json),
            dataKeys: json.data ? Object.keys(json.data) : [],
          },
        });
      } catch (err: any) {
        console.error("[Monicredit Transaction] Network error:", {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
          code: err?.code,
          cause: err?.cause,
        });
        try {
          await prisma.payments.updateMany({
            where: {
              customerId,
              provider: provider,
              providerReference: reference,
            },
            data: { status: "failed", updatedAt: new Date() },
          });
        } catch {}
        return res.status(400).json({
          error: "Network error initializing payment. Please try again.",
          details:
            err?.message ||
            `Network request failed: ${
              err?.code || "Unknown error"
            }. Check your internet connection and Monicredit API availability.`,
        });
      }
    }

    if (!authorizationUrl) {
      try {
        await prisma.payments.updateMany({
          where: {
            customerId,
            provider: provider,
            providerReference: reference,
          },
          data: { status: "failed", updatedAt: new Date() },
        });
      } catch {}
      return res
        .status(400)
        .json({ error: "Failed to get payment authorization URL" });
    }

    return res.json({
      authorizationUrl,
      reference,
      publicKey: settings.publicKey,
      provider: provider,
    });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      console.error(
        "Initialize payment failed due to missing migrations:",
        error?.meta || error
      );
      return res.status(503).json({
        error: "Database not migrated for payments. Please run prisma migrate.",
        action: "Execute: cd backend && npx prisma migrate dev",
      });
    }
    console.error("Initialize payment error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to initialize payment",
      details: error?.message || String(error),
    });
  }
});

// Initialize subscription payment (Admin/platform-level)
router.post(
  "/subscription/initialize",
  async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user?.id) return res.status(401).json({ error: "Unauthorized" });

      const { customerId, invoiceId } = req.body || {};
      if (!customerId || !invoiceId)
        return res
          .status(400)
          .json({ error: "customerId and invoiceId are required" });

      // Load invoice
      const invoice = await prisma.invoices.findUnique({
        where: { id: invoiceId },
      });
      if (!invoice || invoice.customerId !== customerId) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Load system-level paystack keys from system_settings
      const system = await prisma.system_settings.findUnique({
        where: { key: "payments.paystack" },
      });
      const conf = (system?.value as any) || {};
      if (!conf.secretKey || !conf.publicKey) {
        return res
          .status(400)
          .json({ error: "Platform Paystack keys not configured" });
      }

      const reference = `PH-SUB-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      await prisma.payments.create({
        data: {
          id: randomUUID(),
          customerId,
          invoiceId,
          amount: invoice.amount,
          currency: invoice.currency || "NGN",
          status: "pending",
          type: "subscription",
          provider: "paystack",
          providerReference: reference,
          metadata: { billingPeriod: invoice.billingPeriod } as any,
          updatedAt: new Date(),
        },
      });

      const resp = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${conf.secretKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "billing@customer.local",
            amount: Math.round(invoice.amount * 100),
            currency: invoice.currency || "NGN",
            reference,
            metadata: { customerId, invoiceId, type: "subscription" },
          }),
        } as any
      );

      const json = (await resp.json()) as any;
      if (!resp.ok || !json?.status) {
        console.error("Paystack init (subscription) error:", json);
        return res.status(400).json({
          error: json?.message || "Failed to initialize subscription payment",
        });
      }

      return res.json({
        authorizationUrl: json.data?.authorization_url,
        reference,
        publicKey: conf.publicKey,
      });
    } catch (error: any) {
      console.error("Initialize subscription error:", error);
      return res
        .status(500)
        .json({ error: "Failed to initialize subscription payment" });
    }
  }
);

// Get single payment
router.get("/id/:id", async (req: AuthRequest, res: Response) => {
  try {
    console.warn("Payments model not implemented yet - returning 404");
    return res
      .status(404)
      .json({ error: "Payment not found or access denied" });
  } catch (error: any) {
    console.error("Get payment error:", error);
    return res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// Verify payment status with Paystack by reference and update DB
router.get("/verify/:reference", async (req: AuthRequest, res: Response) => {
  try {
    const { reference } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    if (!userId || !customerId)
      return res.status(401).json({ error: "Unauthorized" });

    // Find pending/any payment by reference within the same customer
    // Support both Paystack and Monicredit
    const payment = await prisma.payments.findFirst({
      where: {
        customerId,
        providerReference: reference,
        // Allow both providers - we'll determine which one based on payment record
      },
    });
    if (!payment) return res.status(404).json({ error: "Payment not found" });

    const provider = payment.provider || "paystack";

    // Verify payment based on provider
    let mappedStatus: "success" | "failed" | "pending" = "pending";
    let verifiedData: any = {};

    if (provider === "monicredit") {
      // Monicredit verification
      const settings = await prisma.payment_settings.findFirst({
        where: { customerId, provider: "monicredit" },
      });
      if (!settings?.publicKey || !settings?.secretKey) {
        return res
          .status(400)
          .json({ error: "Monicredit configuration not found" });
      }

      // Monicredit verification endpoint: GET /api/v1/payment/transactions/verify-transaction/{reference}
      // Or use: GET /api/v1/payment/transactions/init-transaction-info/{reference}
      const monicreditBaseUrl =
        process.env.MONICREDIT_BASE_URL ||
        "https://demo.backend.monicredit.com";
      const monicreditApiBase = `${monicreditBaseUrl}/api/v1`;

      // Try verify-transaction endpoint first
      const verifyUrl = `${monicreditApiBase}/payment/transactions/verify-transaction/${reference}`;

      // Create Basic Auth header: base64(publicKey:privateKey)
      const credentials = `${settings.publicKey}:${settings.secretKey}`;
      const base64Credentials = Buffer.from(credentials).toString("base64");

      try {
        const verifyResp = await fetch(verifyUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Basic ${base64Credentials}`,
          },
        } as any);

        const verifyRaw = await verifyResp.text();
        let verifyJson: any = {};

        try {
          verifyJson = JSON.parse(verifyRaw);
        } catch (err) {
          console.error("[Monicredit Verify] Failed to parse response:", err);
          return res.status(400).json({
            error: "Monicredit verification failed: Invalid response",
          });
        }

        if (!verifyResp.ok || !verifyJson?.status) {
          return res.status(400).json({
            error: verifyJson?.message || "Monicredit verification failed",
          });
        }

        verifiedData = verifyJson.data || {};
        // Map Monicredit status: APPROVED, SUCCESS, FAILED, DECLINED, PENDING
        if (
          verifiedData.status === "APPROVED" ||
          verifiedData.status === "SUCCESS"
        ) {
          mappedStatus = "success";
        } else if (
          verifiedData.status === "FAILED" ||
          verifiedData.status === "DECLINED"
        ) {
          mappedStatus = "failed";
        } else {
          mappedStatus = "pending";
        }
      } catch (err: any) {
        console.error("[Monicredit Verify] Network error:", err);
        return res
          .status(400)
          .json({ error: "Monicredit verification failed: Network error" });
      }
    } else {
      // Paystack verification (existing code)
      let secretKey: string | undefined;
      if (payment.type === "subscription") {
        const system = await prisma.system_settings.findUnique({
          where: { key: "payments.paystack" },
        });
        secretKey = (system?.value as any)?.secretKey;
      } else {
        const settings = await prisma.payment_settings.findFirst({
          where: { customerId, provider: "paystack" },
        });
        secretKey = settings?.secretKey;
      }
      if (!secretKey)
        return res
          .status(400)
          .json({ error: "Paystack configuration not found" });

      // Call Paystack verify
      const resp = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(
          reference
        )}`,
        {
          headers: { Authorization: `Bearer ${secretKey}` },
        } as any
      );
      const json = (await resp.json().catch(() => ({}))) as any;
      if (!resp.ok || !json?.status) {
        return res
          .status(400)
          .json({ error: json?.message || "Verification failed" });
      }

      verifiedData = json.data || {};
      // Map Paystack status
      // success | failed | abandoned | reversed (map abandoned/reversed to failed/pending decisions)
      if (verifiedData.status === "success") mappedStatus = "success";
      else if (
        verifiedData.status === "failed" ||
        verifiedData.status === "reversed" ||
        verifiedData.gateway_response === "Abandoned"
      )
        mappedStatus = "failed";
      else if (verifiedData.status === "abandoned") mappedStatus = "failed";
    }

    // Update DB record
    const paidAt =
      provider === "monicredit"
        ? verifiedData.date_paid
          ? new Date(verifiedData.date_paid)
          : mappedStatus === "success"
          ? new Date()
          : payment.paidAt || undefined
        : verifiedData.paid_at
        ? new Date(verifiedData.paid_at)
        : mappedStatus === "success"
        ? new Date()
        : payment.paidAt || undefined;

    const updated = await prisma.payments.updateMany({
      where: { customerId, provider, providerReference: reference },
      data: {
        status: mappedStatus,
        currency:
          provider === "monicredit"
            ? verifiedData.currency || payment.currency
            : verifiedData.currency || payment.currency,
        providerFee:
          provider === "monicredit"
            ? verifiedData.charges || payment.providerFee || undefined
            : verifiedData.fees || payment.providerFee || undefined,
        paymentMethod:
          provider === "monicredit"
            ? verifiedData.channel || payment.paymentMethod || undefined
            : verifiedData.channel || payment.paymentMethod || undefined,
        paidAt,
        updatedAt: new Date(),
      },
    });

    // If payment successful and it's a rent payment, update lease and create next scheduled payment
    if (
      mappedStatus === "success" &&
      payment.type === "rent" &&
      payment.leaseId
    ) {
      try {
        // Get lease details to determine rent frequency
        const lease = await prisma.leases.findUnique({
          where: { id: payment.leaseId },
          include: {
            units: { select: { features: true } },
          },
        });

        if (lease) {
          // Determine rent frequency from unit features
          const unitFeatures = lease.units?.features as any;
          const rentFrequency =
            unitFeatures?.nigeria?.rentFrequency ||
            unitFeatures?.rentFrequency ||
            "monthly";
          const isAnnualRent = rentFrequency === "annual";

          // Calculate next payment due date
          const paymentDate = paidAt || new Date();
          let nextPaymentDue: Date;

          if (isAnnualRent) {
            // For annual rent, next payment is 1 year from now
            nextPaymentDue = new Date(paymentDate);
            nextPaymentDue.setFullYear(nextPaymentDue.getFullYear() + 1);
          } else {
            // For monthly rent, next payment is 1 month from now
            nextPaymentDue = new Date(paymentDate);
            nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
          }

          // Create a scheduled payment record for the next payment
          const scheduledReference = `SCH-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`;
          await prisma.payments.create({
            data: {
              id: randomUUID(),
              customerId,
              propertyId: payment.propertyId,
              unitId: payment.unitId,
              leaseId: payment.leaseId,
              tenantId: payment.tenantId,
              amount: lease.monthlyRent,
              currency: payment.currency || "NGN",
              status: "scheduled",
              type: "rent",
              provider: "paystack",
              providerReference: scheduledReference,
              metadata: {
                leaseNumber: lease.leaseNumber,
                rentFrequency,
                previousPaymentRef: reference,
                scheduledDate: nextPaymentDue.toISOString(),
              } as any,
              updatedAt: new Date(),
            },
          });

          console.log(
            `[Payments] Created scheduled payment for ${nextPaymentDue.toISOString()}, frequency: ${rentFrequency}`
          );
        }
      } catch (scheduleError: any) {
        console.error(
          "[Payments] Failed to create scheduled payment:",
          scheduleError?.message || scheduleError
        );
        // Don't fail the verification if scheduled payment creation fails
      }
    }

    // Emit realtime update
    try {
      emitToCustomer(customerId, "payment:updated", {
        reference,
        status: mappedStatus,
      });
      if (payment.tenantId)
        emitToUser(payment.tenantId, "payment:updated", {
          reference,
          status: mappedStatus,
        });
    } catch {}

    return res.json({ reference, status: mappedStatus, paidAt });
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
});

// Get payment by provider reference
router.get(
  "/by-reference/:reference",
  async (req: AuthRequest, res: Response) => {
    try {
      const { reference } = req.params;
      const userId = req.user?.id;
      const role = (req.user?.role || "").toLowerCase();
      const customerId = req.user?.customerId;

      if (!userId || !customerId)
        return res.status(401).json({ error: "Unauthorized" });

      const where: any = { customerId, providerReference: reference };
      // Scope by role
      if (["owner", "property owner", "property_owner"].includes(role)) {
        where.properties = { ownerId: userId };
      } else if (["manager", "property_manager"].includes(role)) {
        where.properties = {
          property_managers: { some: { managerId: userId, isActive: true } },
        };
      } else if (role === "tenant") {
        where.tenantId = userId;
      }

      const payment = await prisma.payments.findFirst({
        where,
        select: {
          id: true,
          providerReference: true,
          status: true,
          amount: true,
          currency: true,
          type: true,
          paidAt: true,
        },
      });

      if (!payment) return res.status(404).json({ error: "Payment not found" });
      return res.json(payment);
    } catch (error: any) {
      console.error("Get payment by reference error:", error);
      return res.status(500).json({ error: "Failed to fetch payment" });
    }
  }
);

// Get scheduled payments (for tenant or owner/manager)
router.get("/scheduled", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = (req.user?.role || "").toLowerCase();

    if (!userId || !customerId)
      return res.status(401).json({ error: "Unauthorized" });

    const where: any = {
      customerId,
      status: "scheduled",
      type: "rent",
    };

    // Scope by role
    if (role === "tenant") {
      where.tenantId = userId;
    } else if (["owner", "property owner", "property_owner"].includes(role)) {
      where.properties = { ownerId: userId };
    } else if (["manager", "property_manager"].includes(role)) {
      where.properties = {
        property_managers: { some: { managerId: userId, isActive: true } },
      };
    }

    const scheduledPayments = await prisma.payments.findMany({
      where,
      include: {
        leases: {
          select: {
            id: true,
            leaseNumber: true,
            properties: { select: { id: true, name: true } },
            units: { select: { id: true, unitNumber: true } },
            users: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to include scheduled date from metadata
    const transformed = scheduledPayments.map((p) => {
      const metadata = p.metadata as any;
      return {
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        type: p.type,
        scheduledDate: metadata?.scheduledDate || null,
        rentFrequency: metadata?.rentFrequency || "monthly",
        lease: p.leases,
        createdAt: p.createdAt,
      };
    });

    return res.json(transformed);
  } catch (error: any) {
    console.error("Get scheduled payments error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch scheduled payments" });
  }
});

// Create payment (record payment)
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    return res.status(400).json({ error: "Payments not implemented yet" });
  } catch (error: any) {
    console.error("Create payment error:", error);
    return res.status(500).json({ error: "Failed to create payment" });
  }
});

// Update payment
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;
    const role = req.user?.role;

    // Only managers/owners can update payments
    if (role === "tenant") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    // Not implemented yet
    return res.status(400).json({ error: "Payments not implemented yet" });
  } catch (error: any) {
    console.error("Update payment error:", error);
    return res.status(500).json({ error: "Failed to update payment" });
  }
});

// Get payment statistics
router.get("/stats/overview", async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, startDate, endDate } = req.query as any;
    const userId = req.user?.id;
    const role = (req.user?.role || "").toLowerCase();
    const customerId = req.user?.customerId;

    if (!userId || !customerId)
      return res.status(401).json({ error: "Unauthorized" });
    if (
      ![
        "owner",
        "property owner",
        "property_owner",
        "manager",
        "property_manager",
        "admin",
        "super_admin",
      ].includes(role)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const baseWhere: any = { customerId };
    if (propertyId) baseWhere.propertyId = propertyId;
    if (startDate || endDate) {
      baseWhere.createdAt = {};
      if (startDate) baseWhere.createdAt.gte = new Date(startDate);
      if (endDate) baseWhere.createdAt.lte = new Date(endDate);
    }

    // Scope by role
    if (["owner", "property owner", "property_owner"].includes(role)) {
      baseWhere.properties = { ownerId: userId };
    } else if (["manager", "property_manager"].includes(role)) {
      baseWhere.properties = {
        property_managers: { some: { managerId: userId, isActive: true } },
      };
    }

    const [totalCollectedAgg, pendingAgg, byMethod, byType, recent] =
      await Promise.all([
        prisma.payments.aggregate({
          _sum: { amount: true },
          where: { ...baseWhere, status: "success" },
        }),
        prisma.payments.aggregate({
          _sum: { amount: true },
          where: { ...baseWhere, status: "pending" },
        }),
        prisma.payments.groupBy({
          by: ["paymentMethod"],
          where: { ...baseWhere, status: "success" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payments.groupBy({
          by: ["type"],
          where: { ...baseWhere, status: "success" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.payments.findMany({
          where: { ...baseWhere, status: "success" },
          include: {
            leases: {
              select: {
                id: true,
                leaseNumber: true,
                users: { select: { id: true, name: true } },
                properties: { select: { id: true, name: true } },
                units: { select: { id: true, unitNumber: true } },
              },
            },
          },
          orderBy: { paidAt: "desc" },
          take: 10,
        }),
      ]);

    return res.json({
      totalCollected: totalCollectedAgg._sum.amount || 0,
      pendingAmount: pendingAgg._sum.amount || 0,
      lateFees: 0,
      byMethod: byMethod.map((m: any) => ({
        method: m.paymentMethod || "Unknown",
        amount: m._sum.amount || 0,
        count: m._count,
      })),
      byType: byType.map((t: any) => ({
        type: t.type || "Unknown",
        amount: t._sum.amount || 0,
        count: t._count,
      })),
      recentPayments: recent,
    });

    /* COMMENTED OUT UNTIL SCHEMA IS UPDATED
    const where: any = {};

    if (role === 'owner') {
      where.lease = { property: { ownerId: userId } };
    } else if (role === 'manager') {
      where.lease = {
        property: {
          managers: {
            some: {
              managerId: userId,
              isActive: true
            }
          }
        }
      };
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (propertyId) {
      where.lease = { ...where.lease, propertyId };
    }

    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate as string);
      if (endDate) where.paymentDate.lte = new Date(endDate as string);
    }

    // Total collected
    const totalCollected = await prisma.payment.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { amount: true }
    });

    // Pending payments
    const pendingAmount = await prisma.payment.aggregate({
      where: { ...where, status: 'pending' },
      _sum: { amount: true }
    });

    // Late fees collected
    const lateFees = await prisma.payment.aggregate({
      where: { ...where, status: 'completed' },
      _sum: { lateFeesIncluded: true }
    });

    // Payment by method
    const byMethod = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: { ...where, status: 'completed' },
      _sum: { amount: true },
      _count: true
    });

    // Payment by type
    const byType = await prisma.payment.groupBy({
      by: ['type'],
      where: { ...where, status: 'completed' },
      _sum: { amount: true },
      _count: true
    });

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: { ...where, status: 'completed' },
      include: {
        lease: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true
              }
            },
            property: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { paymentDate: 'desc' },
      take: 10
    });

    return res.json({
      totalCollected: totalCollected._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
      lateFees: lateFees._sum.lateFeesIncluded || 0,
      byMethod: byMethod.map(m => ({
        method: m.paymentMethod,
        amount: m._sum.amount || 0,
        count: m._count
      })),
      byType: byType.map(t => ({
        type: t.type,
        amount: t._sum.amount || 0,
        count: t._count
      })),
      recentPayments
    });
    */
  } catch (error: any) {
    console.error("Get payment stats error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch payment statistics" });
  }
});

// Get overdue payments
router.get("/overdue/list", async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    if (
      role !== "owner" &&
      role !== "property owner" &&
      role !== "property_owner" &&
      role !== "manager" &&
      role !== "property_manager"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const where: any = {
      status: "active",
    };

    if (
      role === "owner" ||
      role === "property owner" ||
      role === "property_owner"
    ) {
      where.properties = { ownerId: userId };
    } else if (role === "manager" || role === "property_manager") {
      where.properties = {
        property_managers: {
          some: {
            managerId: userId,
            isActive: true,
          },
        },
      };
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    // Get active leases (use correct pluralized models)
    const leases = await prisma.leases.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
    });

    // Calculate overdue
    const currentDate = new Date();
    const overdueLeases = leases
      .map((lease) => {
        const daysSincePayment = Math.floor(
          (currentDate.getTime() - new Date(lease.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const isOverdue = daysSincePayment > 30; // More than 30 days

        return {
          leaseId: lease.id,
          tenant: lease.users,
          property: lease.properties,
          unit: lease.units,
          monthlyRent: lease.monthlyRent,
          lastPaymentDate: null,
          daysSincePayment,
          isOverdue,
          estimatedOverdueAmount: isOverdue
            ? lease.monthlyRent * Math.floor(daysSincePayment / 30)
            : 0,
        };
      })
      .filter((l) => l.isOverdue);

    return res.json(overdueLeases);
  } catch (error: any) {
    console.error("Get overdue payments error:", error);
    return res.status(500).json({ error: "Failed to fetch overdue payments" });
  }
});

export default router;
