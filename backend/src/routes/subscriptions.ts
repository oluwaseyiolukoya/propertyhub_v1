import express, { Response } from "express";
import prisma from "../lib/db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { emitToAdmins, emitToCustomer } from "../lib/socket";
import { captureSnapshotOnChange } from "../lib/mrr-snapshot";

const router = express.Router();

// Change subscription plan
router.post(
  "/change-plan",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      // Get user and customer
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: { customers: true },
      });

      if (!user || !user.customerId) {
        return res
          .status(403)
          .json({ error: "Only customer owners can change plans" });
      }

      // Verify user is owner
      if (user.role !== "owner") {
        return res
          .status(403)
          .json({ error: "Only owners can change subscription plans" });
      }

      // Get the new plan
      const newPlan = await prisma.plans.findUnique({
        where: { id: planId },
      });

      if (!newPlan || !newPlan.isActive) {
        return res.status(404).json({ error: "Plan not found or inactive" });
      }

      const customer = user.customers;
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Validate plan category matches user role
      const userPlanCategory =
        user.role === "developer" || user.role === "property-developer"
          ? "development"
          : "property_management";

      if (newPlan.category !== userPlanCategory) {
        return res.status(400).json({
          error: `Invalid plan category. ${
            user.role === "developer" || user.role === "property-developer"
              ? "Developers"
              : "Property owners/managers"
          } can only select ${userPlanCategory} plans.`,
        });
      }

      // Calculate new MRR based on billing cycle
      const billingCycle = customer.billingCycle || "monthly";
      const newMRR =
        billingCycle === "annual"
          ? newPlan.annualPrice / 12
          : newPlan.monthlyPrice;

      // Update customer with new plan
      const updateData: any = {
        planId: newPlan.id,
        planCategory: newPlan.category,
        userLimit: newPlan.userLimit,
        storageLimit: newPlan.storageLimit,
        // Also update storage_limit in bytes (storageLimit is in MB)
        storage_limit: BigInt((newPlan.storageLimit || 0) * 1024 * 1024),
        mrr: newMRR,
        updatedAt: new Date(),
      };

      // Set limits based on plan category
      if (newPlan.category === "property_management") {
        updateData.propertyLimit = newPlan.propertyLimit;
      } else if (newPlan.category === "development") {
        updateData.projectLimit = newPlan.projectLimit;
      }

      const updatedCustomer = await prisma.customers.update({
        where: { id: user.customerId },
        data: updateData,
        include: { plans: true },
      });

      // Emit real-time event to admins
      emitToAdmins("subscription:plan-changed", {
        customerId: updatedCustomer.id,
        customerName: updatedCustomer.company,
        oldPlan: customer.planId,
        newPlan: newPlan.name,
        newMRR: newMRR,
      });

      // Emit to customer
      emitToCustomer(updatedCustomer.id, "subscription:updated", {
        plan: newPlan.name,
        limits: {
          properties: newPlan.propertyLimit,
          users: newPlan.userLimit,
          storage: newPlan.storageLimit,
        },
      });

      // Capture MRR snapshot for plan change
      try {
        await captureSnapshotOnChange(updatedCustomer.id);
      } catch (snapshotError) {
        console.error("Failed to capture MRR snapshot:", snapshotError);
      }

      res.json({
        message: "Subscription plan updated successfully",
        customer: updatedCustomer,
        plan: newPlan,
      });
    } catch (error: any) {
      console.error("Change plan error:", error);
      res.status(500).json({ error: "Failed to change subscription plan" });
    }
  }
);

// Change billing cycle
router.post(
  "/change-billing-cycle",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { billingCycle } = req.body;
      if (!billingCycle || !["monthly", "annual"].includes(billingCycle)) {
        return res.status(400).json({
          error: 'Invalid billing cycle. Must be "monthly" or "annual"',
        });
      }

      // Get user and customer
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          customers: {
            include: { plans: true },
          },
        },
      });

      if (!user || !user.customerId) {
        return res
          .status(403)
          .json({ error: "Only customer owners can change billing cycle" });
      }

      // Verify user is owner
      if (user.role !== "owner") {
        return res
          .status(403)
          .json({ error: "Only owners can change billing cycle" });
      }

      const customer = user.customers;
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const plan = customer.plans;
      if (!plan) {
        return res.status(404).json({ error: "No active plan found" });
      }

      // Calculate new MRR
      const newMRR =
        billingCycle === "annual" ? plan.annualPrice / 12 : plan.monthlyPrice;

      // Update billing cycle
      const updatedCustomer = await prisma.customers.update({
        where: { id: user.customerId },
        data: {
          billingCycle,
          mrr: newMRR,
          updatedAt: new Date(),
        },
        include: { plans: true },
      });

      // Emit real-time event to admins
      emitToAdmins("subscription:billing-changed", {
        customerId: updatedCustomer.id,
        customerName: updatedCustomer.company,
        newBillingCycle: billingCycle,
        newMRR: newMRR,
      });

      // Emit to customer
      emitToCustomer(updatedCustomer.id, "subscription:updated", {
        billingCycle: billingCycle,
      });

      // Capture MRR snapshot for billing cycle change
      try {
        await captureSnapshotOnChange(updatedCustomer.id);
      } catch (snapshotError) {
        console.error("Failed to capture MRR snapshot:", snapshotError);
      }

      res.json({
        message: "Billing cycle updated successfully",
        customer: updatedCustomer,
        billingCycle: billingCycle,
        newMRR: newMRR,
      });
    } catch (error: any) {
      console.error("Change billing cycle error:", error);
      res.status(500).json({ error: "Failed to change billing cycle" });
    }
  }
);

// Cancel subscription
router.post(
  "/cancel",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { reason, confirmation } = req.body;

      // Require explicit confirmation
      if (confirmation !== "CANCEL_SUBSCRIPTION") {
        return res
          .status(400)
          .json({ error: "Confirmation text does not match" });
      }

      // Get user and customer
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: { customers: true },
      });

      if (!user || !user.customerId) {
        return res
          .status(403)
          .json({ error: "Only customer owners can cancel subscription" });
      }

      // Verify user is owner or developer
      if (
        user.role !== "owner" &&
        user.role !== "developer" &&
        user.role !== "property-developer"
      ) {
        return res
          .status(403)
          .json({ error: "Only account owners can cancel subscription" });
      }

      const customer = user.customers;
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Deactivate customer account
      const updatedCustomer = await prisma.customers.update({
        where: { id: user.customerId },
        data: {
          status: "cancelled",
          mrr: 0,
          notes: `${
            customer.notes || ""
          }\n\nSubscription cancelled on ${new Date().toISOString()}. Reason: ${
            reason || "Not provided"
          }`,
          updatedAt: new Date(),
        },
      });

      // Deactivate all users associated with this customer (owner, managers, tenants)
      await prisma.users.updateMany({
        where: { customerId: user.customerId },
        data: {
          isActive: false,
          status: "inactive",
          updatedAt: new Date(),
        },
      });

      // Emit real-time event to admins
      emitToAdmins("subscription:cancelled", {
        customerId: updatedCustomer.id,
        customerName: updatedCustomer.company,
        reason: reason || "Not provided",
        cancelledAt: new Date().toISOString(),
      });

      // Emit to all users in the customer account
      emitToCustomer(updatedCustomer.id, "account:deactivated", {
        message:
          "Your subscription has been cancelled. Your account is now inactive.",
        cancelledAt: new Date().toISOString(),
      });

      // Capture MRR snapshot for cancellation
      try {
        await captureSnapshotOnChange(updatedCustomer.id);
      } catch (snapshotError) {
        console.error("Failed to capture MRR snapshot:", snapshotError);
      }

      res.json({
        message:
          "Subscription cancelled successfully. All associated accounts have been deactivated.",
        customer: updatedCustomer,
      });
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  }
);

// Get available plans for owner (filtered by user role/category)
router.get(
  "/plans",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user to determine plan category
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          customers: {
            select: { planCategory: true },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Determine plan category based on user role
      let planCategory =
        user.role === "developer" || user.role === "property-developer"
          ? "development"
          : "property_management";

      // If customer has a plan category set, use that
      if (user.customers?.planCategory) {
        planCategory = user.customers.planCategory;
      }

      const plans = await prisma.plans.findMany({
        where: {
          category: planCategory,
          isActive: true,
          monthlyPrice: { gt: 0 }, // Exclude free/trial plans
        },
        orderBy: [{ monthlyPrice: "asc" }],
      });

      res.json({ plans, category: planCategory });
    } catch (error: any) {
      console.error("Get plans error:", error);
      res.status(500).json({ error: "Failed to fetch plans" });
    }
  }
);

// Get billing history for current user
router.get(
  "/billing-history",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get user's customer ID
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { customerId: true },
      });

      if (!user || !user.customerId) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Fetch invoices for this customer
      const invoices = await prisma.invoices.findMany({
        where: {
          customerId: user.customerId,
          status: { in: ["paid", "pending", "overdue"] }, // Exclude cancelled/draft
        },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          currency: true,
          status: true,
          dueDate: true,
          paidAt: true,
          billingPeriod: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 12, // Last 12 invoices
      });

      res.json({ invoices });
    } catch (error: any) {
      console.error("Get billing history error:", error);
      res.status(500).json({ error: "Failed to fetch billing history" });
    }
  }
);

// Initialize upgrade payment
router.post(
  "/upgrade/initialize",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { planId, billingCycle: requestedBillingCycle } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      console.log(
        "[Upgrade] Initialize payment for user:",
        userId,
        "plan:",
        planId,
        "billing cycle:",
        requestedBillingCycle
      );

      // Get user and customer
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          customers: {
            include: { plans: true },
          },
        },
      });

      if (!user || !user.customerId || !user.customers) {
        return res.status(403).json({ error: "Customer not found" });
      }

      const customer = user.customers;

      // Get the new plan
      const newPlan = await prisma.plans.findUnique({
        where: { id: planId },
      });

      if (!newPlan || !newPlan.isActive) {
        return res.status(404).json({ error: "Plan not found or inactive" });
      }

      // Validate plan category matches user role
      const userPlanCategory =
        user.role === "developer" || user.role === "property-developer"
          ? "development"
          : "property_management";

      if (newPlan.category !== userPlanCategory) {
        return res.status(400).json({
          error: `Invalid plan category. ${
            user.role === "developer" || user.role === "property-developer"
              ? "Developers"
              : "Property owners/managers"
          } can only select ${userPlanCategory} plans.`,
        });
      }

      // Calculate amount based on requested billing cycle (or fall back to customer's current cycle)
      const billingCycle =
        requestedBillingCycle || customer.billingCycle || "monthly";
      const amount =
        billingCycle === "annual" ? newPlan.annualPrice : newPlan.monthlyPrice;
      const currency = newPlan.currency || "NGN";

      console.log(
        "[Upgrade] Billing cycle:",
        billingCycle,
        "Amount:",
        amount,
        "Currency:",
        currency
      );

      // Determine payment provider (from request or default to Paystack, then check Monicredit)
      const requestedProvider = (req.body.provider || "paystack").toLowerCase();
      let provider = "paystack"; // Default
      let paystackSecretKey: string | undefined;
      let paystackPublicKey: string | undefined;
      let monicreditConfig: any = null;

      // Check which providers are available
      console.log("[Upgrade] Checking available payment providers...");

      // Check Paystack (system-level only for subscriptions)
      // Only use Paystack if it's enabled in system_settings
      let paystackEnabled = false;
      try {
        const paystackSystemSettings = await prisma.system_settings.findUnique({
          where: { key: "payments.paystack" },
        });
        const paystackConf = (paystackSystemSettings?.value as any) || {};

        if (paystackSystemSettings && paystackConf?.isEnabled) {
          paystackEnabled = true;
          paystackSecretKey =
            paystackConf?.secretKey || process.env.PAYSTACK_SECRET_KEY;
          paystackPublicKey =
            paystackConf?.publicKey || process.env.PAYSTACK_PUBLIC_KEY;
          console.log("[Upgrade] Paystack system-level config found:", {
            isEnabled: paystackConf.isEnabled,
            hasKeys: !!(paystackSecretKey && paystackPublicKey),
          });
        } else {
          console.log("[Upgrade] Paystack not enabled in system_settings");
          paystackSecretKey = undefined;
          paystackPublicKey = undefined;
        }
      } catch (err) {
        console.warn(
          "[Upgrade] Failed to read Paystack settings:",
          (err as any)?.message
        );
        paystackSecretKey = undefined;
        paystackPublicKey = undefined;
      }

      // Check Monicredit (system-level only for subscriptions)
      try {
        const monicreditSystemSettings =
          await prisma.system_settings.findUnique({
            where: { key: "payments.monicredit" },
          });
        const monicreditConf = (monicreditSystemSettings?.value as any) || {};

        if (monicreditSystemSettings && monicreditConf?.isEnabled) {
          monicreditConfig = {
            publicKey: monicreditConf.publicKey,
            privateKey: monicreditConf.privateKey,
            merchantId: monicreditConf.merchantId,
            verifyToken: monicreditConf.verifyToken,
            isEnabled: true,
            testMode: monicreditConf.testMode || false,
          };
          console.log("[Upgrade] Monicredit system-level config found:", {
            isEnabled: monicreditConfig.isEnabled,
            hasKeys: !!(
              monicreditConfig.publicKey && monicreditConfig.privateKey
            ),
          });
        }
      } catch (err) {
        console.warn(
          "[Upgrade] Failed to read Monicredit settings:",
          (err as any)?.message
        );
      }

      // Determine provider based on request and availability
      // Only use providers that are enabled in system_settings
      if (requestedProvider === "monicredit" && monicreditConfig?.isEnabled) {
        provider = "monicredit";
        console.log("[Upgrade] Using Monicredit (requested and enabled)");
      } else if (
        requestedProvider === "paystack" &&
        paystackEnabled &&
        paystackSecretKey &&
        paystackPublicKey
      ) {
        provider = "paystack";
        console.log("[Upgrade] Using Paystack (requested and enabled)");
      } else if (monicreditConfig?.isEnabled) {
        provider = "monicredit";
        console.log("[Upgrade] Using Monicredit (enabled in system_settings)");
      } else if (paystackEnabled && paystackSecretKey && paystackPublicKey) {
        provider = "paystack";
        console.log("[Upgrade] Using Paystack (enabled in system_settings)");
      } else {
        console.error(
          "[Upgrade] No payment gateway enabled in Platform Settings"
        );
        return res.status(400).json({
          error: "Payment gateway not configured. Please contact support.",
          details:
            "No payment gateway is enabled in Platform Settings → Integrations. Please enable Paystack or Monicredit.",
        });
      }

      console.log("[Upgrade] Selected provider:", provider);

      // Generate unique reference
      const reference = `UPG-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      // Create invoice for the upgrade
      const invoice = await prisma.invoices.create({
        data: {
          id: require("crypto").randomUUID(),
          customerId: customer.id,
          invoiceNumber: `INV-UPG-${Date.now()}`,
          amount,
          currency,
          status: "pending",
          dueDate: new Date(),
          billingPeriod: new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          description: `Plan upgrade to ${newPlan.name}`,
          items: JSON.stringify([
            {
              description: `${newPlan.name} - ${billingCycle} subscription`,
              quantity: 1,
              unitPrice: amount,
              total: amount,
            },
          ]),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("[Upgrade] Invoice created:", invoice.id);

      let authorizationUrl: string | null = null;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const callbackUrl = `${frontendUrl}/?payment_callback=upgrade&tab=billing`;

      if (provider === "paystack") {
        // Initialize Paystack payment
        const paystackResponse = await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: customer.email,
              amount: Math.round(amount * 100), // Paystack expects amount in kobo/cents
              currency,
              reference,
              metadata: {
                customerId: customer.id,
                invoiceId: invoice.id,
                planId: newPlan.id,
                billingCycle,
                type: "upgrade",
                userId: user.id,
              },
              callback_url: callbackUrl,
            }),
          }
        );

        const paystackData = (await paystackResponse.json()) as any;

        if (!paystackResponse.ok || !paystackData?.status) {
          console.error(
            "[Upgrade] Paystack initialization failed:",
            paystackData
          );
          return res.status(400).json({
            error: paystackData?.message || "Failed to initialize payment",
          });
        }

        console.log("[Upgrade] Paystack initialized successfully:", reference);
        authorizationUrl = paystackData.data?.authorization_url;
      } else if (provider === "monicredit") {
        // Initialize Monicredit payment
        const monicreditBaseUrl =
          process.env.MONICREDIT_BASE_URL ||
          "https://demo.backend.monicredit.com";
        const possibleEndpoints = [
          process.env.MONICREDIT_TRANSACTION_ENDPOINT,
          "/v1/payment/transactions/init-transaction",
          "/payment/transactions/init-transaction",
          "/api/v1/payment/transactions/init-transaction",
        ].filter(Boolean) as string[];

        // Create Basic Auth header
        const credentials = `${monicreditConfig.publicKey}:${monicreditConfig.privateKey}`;
        const base64Credentials = Buffer.from(credentials).toString("base64");

        console.log(
          "[Upgrade Monicredit] Attempting Basic Auth on transaction endpoints:",
          {
            endpointsToTry: possibleEndpoints,
            hasPublicKey: !!monicreditConfig.publicKey,
            hasPrivateKey: !!monicreditConfig.privateKey,
            publicKeyPreview: monicreditConfig.publicKey
              ? `${monicreditConfig.publicKey.substring(0, 15)}...`
              : null,
          }
        );

        let monicreditResp: globalThis.Response | null = null;
        let monicreditUrl: string | null = null;
        let lastError: any = null;

        for (const endpoint of possibleEndpoints) {
          let testUrl: string;
          if (endpoint.startsWith("/v1/")) {
            testUrl = `${monicreditBaseUrl}${endpoint}`;
          } else if (endpoint.startsWith("/api/v1/")) {
            testUrl = `${monicreditBaseUrl}${endpoint}`;
          } else {
            testUrl = `${monicreditBaseUrl}/api/v1${endpoint}`;
          }

          console.log(`[Upgrade Monicredit] Trying endpoint: ${testUrl}`);

          try {
            const testResp = await fetch(testUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...(base64Credentials
                  ? { Authorization: `Basic ${base64Credentials}` }
                  : {}),
              },
              body: JSON.stringify({
                order_id: reference,
                public_key: monicreditConfig.publicKey,
                customer: {
                  first_name: user.name?.split(" ")[0] || "Customer",
                  last_name: user.name?.split(" ").slice(1).join(" ") || "User",
                  email: customer.email,
                  phone: customer.phone || "00000000000",
                },
                items: [
                  {
                    item: `Subscription: ${newPlan.name} - ${billingCycle}`,
                    revenue_head_code:
                      process.env.MONICREDIT_REVENUE_HEAD_CODE || "",
                    unit_cost: amount.toString(),
                  },
                ],
                currency: currency || "NGN",
                paytype: "standard",
                redirect_url: callbackUrl,
                return_url: callbackUrl,
                callback_url: callbackUrl,
                meta_data: {
                  customerId: customer.id,
                  invoiceId: invoice.id,
                  planId: newPlan.id,
                  billingCycle,
                  type: "subscription",
                  userId: user.id,
                },
              }),
            } as any);

            // If we get a non-404/400 response, this might be the right endpoint
            // 401/403 = auth issue (endpoint exists), 404/400 = route not found
            if (testResp.status !== 404 && testResp.status !== 400) {
              console.log(
                `[Upgrade Monicredit] Endpoint ${endpoint} returned status ${testResp.status} - using this endpoint`
              );
              monicreditResp = testResp;
              monicreditUrl = testUrl;
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
                `[Upgrade Monicredit] Endpoint ${endpoint} returned 404/400 (route not found) - trying next endpoint`
              );
              continue;
            } else {
              // Not a "route not found" error, use this response
              monicreditResp = testResp;
              monicreditUrl = testUrl;
              break;
            }
          } catch (err: any) {
            lastError = err;
            console.log(
              `[Upgrade Monicredit] Endpoint ${endpoint} failed:`,
              err.message
            );
            continue;
          }
        }

        if (!monicreditResp) {
          console.error("[Upgrade Monicredit] All endpoints failed:", {
            endpoints: possibleEndpoints,
            lastError: lastError?.message,
          });
          return res.status(400).json({
            error: "Failed to initialize Monicredit payment",
            details:
              "All Monicredit transaction endpoints failed. Please check configuration and ensure Monicredit API is accessible.",
          });
        }

        const monicreditRaw = await monicreditResp.text();
        let monicreditData: any = {};
        try {
          monicreditData = JSON.parse(monicreditRaw);
        } catch (parseErr) {
          console.error("[Upgrade Monicredit] Failed to parse response:", {
            status: monicreditResp.status,
            statusText: monicreditResp.statusText,
            rawResponse: monicreditRaw.substring(0, 500),
          });
          return res.status(400).json({
            error: "Failed to initialize Monicredit payment",
            details: `Invalid response from Monicredit API. Status: ${monicreditResp.status}`,
          });
        }

        // Check for authorization_url in various possible locations
        const authorizationUrlFromResponse =
          monicreditData?.data?.authorization_url ||
          monicreditData?.authorization_url ||
          monicreditData?.data?.authorizationUrl ||
          monicreditData?.authorizationUrl ||
          monicreditData?.data?.redirect_url ||
          monicreditData?.redirect_url;

        if (!monicreditResp.ok || !authorizationUrlFromResponse) {
          console.error("[Upgrade Monicredit] Initialization failed:", {
            status: monicreditResp.status,
            statusText: monicreditResp.statusText,
            response: monicreditData,
            url: monicreditUrl,
          });
          return res.status(400).json({
            error:
              monicreditData?.message ||
              monicreditData?.error ||
              "Failed to initialize Monicredit payment",
            details:
              monicreditData?.errors ||
              monicreditData?.details ||
              monicreditData?.data?.message ||
              `Status: ${monicreditResp.status}. Check Monicredit configuration.`,
          });
        }

        // Ensure authorization URL is absolute (add protocol if missing)
        let finalAuthUrl = authorizationUrlFromResponse;
        if (
          finalAuthUrl &&
          !finalAuthUrl.startsWith("http://") &&
          !finalAuthUrl.startsWith("https://")
        ) {
          // URL is relative or missing protocol, make it absolute
          finalAuthUrl = `https://${finalAuthUrl}`;
          console.log(
            "[Upgrade] Monicredit authorization URL missing protocol, added https://",
            finalAuthUrl
          );
        }

        console.log(
          "[Upgrade] Monicredit initialized successfully:",
          reference,
          "Authorization URL:",
          finalAuthUrl
        );
        authorizationUrl = finalAuthUrl;
      }

      if (!authorizationUrl) {
        return res.status(400).json({
          error: "Failed to initialize payment",
          details: "No authorization URL received from payment gateway",
        });
      }

      // Create payment record
      await prisma.payments.create({
        data: {
          id: require("crypto").randomUUID(),
          customerId: customer.id,
          invoiceId: invoice.id,
          amount,
          currency,
          status: "pending",
          type: "subscription",
          provider: provider,
          providerReference: reference,
          metadata: {
            planId: newPlan.id,
            invoiceId: invoice.id,
            billingCycle,
            type: "upgrade",
            provider: provider,
            customerId: customer.id,
            userId: user.id,
          } as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      res.json({
        authorizationUrl,
        reference,
        provider,
        publicKey:
          provider === "paystack"
            ? paystackPublicKey
            : monicreditConfig.publicKey,
        invoiceId: invoice.id,
      });
    } catch (error: any) {
      console.error("[Upgrade] Initialize payment error:", error);
      res.status(500).json({ error: "Failed to initialize upgrade payment" });
    }
  }
);

// Verify upgrade payment and complete upgrade (POST version - legacy, redirects to GET)
router.post(
  "/upgrade/verify",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { reference } = req.body;
      if (!reference) {
        return res.status(400).json({ error: "Payment reference is required" });
      }

      console.log("[Upgrade] Verify payment:", {
        reference,
        userId,
      });

      // Get user and customer
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: { customers: { include: { plans: true } } },
      });

      if (!user || !user.customerId || !user.customers) {
        console.error("[Upgrade] Customer not found:", {
          userId,
          hasUser: !!user,
          hasCustomerId: !!user?.customerId,
        });
        return res.status(403).json({ error: "Customer not found" });
      }

      const customer = user.customers;

      // Check payment record to determine which provider was used
      const payment = await prisma.payments.findFirst({
        where: {
          providerReference: reference,
          customerId: customer.id,
          type: "subscription",
        },
      });

      if (!payment) {
        console.error("[Upgrade] Payment record not found for reference:", {
          reference,
          customerId: customer.id,
          searchedType: "subscription",
        });
        return res.status(404).json({
          error: "Payment not found",
          details: `No payment record found with reference ${reference} for this customer`,
        });
      }

      console.log("[Upgrade] Payment record found:", {
        id: payment.id,
        status: payment.status,
        provider: payment.provider,
        amount: payment.amount,
        currency: payment.currency,
        hasMetadata: !!payment.metadata,
        metadata: payment.metadata,
        providerReference: payment.providerReference,
      });

      const provider = payment.provider || "paystack"; // Default to Paystack for backward compatibility
      console.log("[Upgrade] Payment provider:", provider);

      // Check if payment is already completed AND upgrade has been processed (idempotency check)
      // IMPORTANT: Only skip verification if BOTH payment is completed AND customer plan has been updated
      // This prevents premature email sending when webhook updates payment status before user completes payment
      if (payment.status === "completed" || payment.status === "success") {
        // Verify that the upgrade was actually completed by checking if customer plan was updated
        const customer = await prisma.customers.findUnique({
          where: { id: customerId },
          include: { plans: true },
        });

        let paymentMetadata: any = {};
        if (payment.metadata) {
          if (typeof payment.metadata === "string") {
            try {
              paymentMetadata = JSON.parse(payment.metadata);
            } catch (e) {
              console.warn(
                "[Upgrade] Failed to parse completed payment metadata:",
                e
              );
            }
          } else {
            paymentMetadata = payment.metadata as any;
          }
        }

        const planId = paymentMetadata?.planId;

        // If customer plan matches the upgrade plan, upgrade was already completed
        if (planId && customer?.planId === planId) {
          console.log(
            "[Upgrade] Payment and upgrade already completed, returning success without re-verification"
          );
          const plan = await prisma.plans.findUnique({ where: { id: planId } });
          return res.json({
            success: true,
            message: "Payment already processed",
            verificationSource: "database",
            plan: plan?.name,
          });
        }

        // Payment status is "success" but upgrade not completed yet - verify with provider
        console.log(
          "[Upgrade] Payment status is 'success' but upgrade not completed. Verifying with provider to ensure payment is actually completed..."
        );
      }

      // Verify based on provider
      if (provider === "monicredit") {
        // Monicredit verification - use the same comprehensive logic as tenant payments
        // For demo/sandbox environments, trust redirect mode
        const trustRedirectEnv =
          process.env.MONICREDIT_TRUST_REDIRECT === "true";

        // Extract Monicredit transaction ID from metadata - handle both object and string formats
        let paymentMetadata: any = {};
        if (payment.metadata) {
          if (typeof payment.metadata === "string") {
            try {
              paymentMetadata = JSON.parse(payment.metadata);
            } catch (e) {
              console.warn(
                "[Upgrade Monicredit] Failed to parse payment metadata:",
                e
              );
              paymentMetadata = {};
            }
          } else {
            paymentMetadata = payment.metadata as any;
          }
        }

        // Get Monicredit system-level settings (subscriptions use system settings)
        const monicreditSystemSettings =
          await prisma.system_settings.findUnique({
            where: { key: "payments.monicredit" },
          });
        const monicreditConf = (monicreditSystemSettings?.value as any) || {};

        if (
          !monicreditSystemSettings ||
          !monicreditConf?.isEnabled ||
          !monicreditConf?.publicKey ||
          !monicreditConf?.privateKey
        ) {
          // If no system settings but trust redirect is enabled and we have valid transId
          const earlyMonicreditTransactionId =
            paymentMetadata?.monicreditTransactionId;
          const earlyHasValidTransactionId =
            !!earlyMonicreditTransactionId || reference.startsWith("ACX");

          if (trustRedirectEnv && earlyHasValidTransactionId) {
            console.log(
              "[Upgrade Monicredit] No system settings, but trust redirect enabled with valid transId"
            );
            // Continue with trust redirect logic below
          } else {
            console.error(
              "[Upgrade Monicredit] Monicredit system configuration not found"
            );
            return res.status(400).json({
              error: "Monicredit verification not supported",
              details:
                "Enable MONICREDIT_TRUST_REDIRECT=true for demo environments, or configure Monicredit in Platform Settings → Integrations",
            });
          }
        }

        // Check for trust redirect mode FIRST before attempting API verification
        // This handles demo/sandbox environments where API doesn't work
        const monicreditTransactionId =
          paymentMetadata?.monicreditTransactionId;
        const isMonicreditTransactionId = reference.startsWith("ACX");
        const hasValidTransactionId =
          !!monicreditTransactionId || isMonicreditTransactionId;

        // Enable trust redirect if:
        // 1. Environment variable is set, OR
        // 2. We have a valid transaction ID and payment is pending (user redirected back after payment)
        const trustRedirect =
          trustRedirectEnv ||
          (hasValidTransactionId && payment.status === "pending");

        console.log("[Upgrade Monicredit] Verification details:", {
          reference,
          monicreditTransactionId,
          trustRedirect,
          trustRedirectEnv,
          hasValidTransactionId,
          isMonicreditTransactionId,
          paymentStatus: payment.status,
          willUseTrustRedirect: trustRedirect && hasValidTransactionId,
        });

        // Helper function to complete upgrade after successful verification
        const completeUpgrade = async (verificationSource: string) => {
          const planId = paymentMetadata?.planId;
          const invoiceId = paymentMetadata?.invoiceId;
          const billingCycle =
            paymentMetadata?.billingCycle || customer.billingCycle || "monthly";

          if (!planId) {
            console.error("[Upgrade Monicredit] Missing planId in metadata:", {
              paymentMetadata,
            });
            throw new Error("Plan ID not found in payment metadata");
          }

          // Get the new plan
          const newPlan = await prisma.plans.findUnique({
            where: { id: planId },
          });
          if (!newPlan) {
            throw new Error("Plan not found");
          }

          // Calculate new MRR
          const newMRR =
            billingCycle === "annual"
              ? newPlan.annualPrice / 12
              : newPlan.monthlyPrice;

          // Update customer with new plan
          const updateData: any = {
            planId: newPlan.id,
            planCategory: newPlan.category,
            userLimit: newPlan.userLimit,
            storageLimit: newPlan.storageLimit,
            storage_limit: BigInt((newPlan.storageLimit || 0) * 1024 * 1024),
            mrr: newMRR,
            status: "active",
            billingCycle,
            subscriptionStartDate: customer.subscriptionStartDate || new Date(),
            trialStartsAt: null,
            trialEndsAt: null,
            gracePeriodEndsAt: null,
            suspendedAt: null,
            suspensionReason: null,
            updatedAt: new Date(),
          };

          if (newPlan.category === "property_management") {
            updateData.propertyLimit = newPlan.propertyLimit;
          } else if (newPlan.category === "development") {
            updateData.projectLimit = newPlan.projectLimit;
          }

          const updatedCustomer = await prisma.customers.update({
            where: { id: customer.id },
            data: updateData,
            include: { plans: true },
          });

          // Update invoice
          if (invoiceId) {
            await prisma.invoices.update({
              where: { id: invoiceId },
              data: {
                status: "paid",
                paidAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          // Update payment
          await prisma.payments.updateMany({
            where: { providerReference: reference, customerId: customer.id },
            data: {
              status: "completed",
              paidAt: new Date(),
              metadata: {
                ...paymentMetadata,
                verificationSource,
                verifiedAt: new Date().toISOString(),
              } as any,
              updatedAt: new Date(),
            },
          });

          // Emit events
          emitToAdmins("subscription:plan-upgraded", {
            customerId: updatedCustomer.id,
            customerName: updatedCustomer.company,
            oldPlan: customer.plans?.name,
            newPlan: newPlan.name,
            amount: payment.amount,
            currency: payment.currency,
          });

          emitToCustomer(updatedCustomer.id, "subscription:upgraded", {
            plan: newPlan.name,
            amount: payment.amount,
            currency: payment.currency,
          });

          return {
            success: true,
            message: "Subscription upgraded successfully",
            verificationSource,
            plan: newPlan.name,
          };
        };

        // If trust redirect is enabled and we have a transaction ID, mark as success
        if (trustRedirect && hasValidTransactionId) {
          console.log(
            "[Upgrade Monicredit] Using trust redirect mode - marking as success"
          );
          try {
            const result = await completeUpgrade("trusted_redirect");
            return res.json(result);
          } catch (error: any) {
            console.error(
              "[Upgrade Monicredit] Trust redirect completion failed:",
              error
            );
            return res.status(400).json({
              error: error.message || "Failed to complete upgrade",
            });
          }
        }

        // If no system settings and trust redirect not enabled, return error
        if (!monicreditSystemSettings || !monicreditConf?.isEnabled) {
          return res.status(400).json({
            error: "Monicredit verification not supported",
            details:
              "Enable MONICREDIT_TRUST_REDIRECT=true for demo environments, or configure Monicredit in Platform Settings → Integrations",
          });
        }

        // Now attempt actual Monicredit API verification (same as tenant payments)
        const monicreditBaseUrl =
          process.env.MONICREDIT_BASE_URL ||
          "https://demo.backend.monicredit.com";
        const monicreditApiBase = `${monicreditBaseUrl}/api/v1`;

        // Determine transaction ID to use for verification
        let transactionIdForVerification: string;
        if (isMonicreditTransactionId) {
          transactionIdForVerification = reference;
        } else {
          transactionIdForVerification = monicreditTransactionId || reference;
        }

        const verifyUrl = `${monicreditApiBase}/payment/transactions/verify-transaction/${transactionIdForVerification}`;

        console.log("[Upgrade Monicredit] Verifying with API:", {
          ourReference: reference,
          transactionIdForVerification,
          verifyUrl,
          isMonicreditTransactionId,
          hasTransactionIdInMetadata: !!monicreditTransactionId,
          paymentMetadata: {
            planId: paymentMetadata?.planId,
            invoiceId: paymentMetadata?.invoiceId,
            monicreditTransactionId: paymentMetadata?.monicreditTransactionId,
          },
        });

        // Create Basic Auth header: base64(publicKey:privateKey)
        const credentials = `${monicreditConf.publicKey}:${monicreditConf.privateKey}`;
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
            console.error(
              "[Upgrade Monicredit] Failed to parse API response:",
              err
            );
            // Fallback to trust redirect if API response is invalid
            if (trustRedirect && hasValidTransactionId) {
              console.log(
                "[Upgrade Monicredit] Invalid API response, using trust redirect"
              );
              const result = await completeUpgrade("trusted_redirect_fallback");
              return res.json(result);
            }
            return res.status(400).json({
              error: "Monicredit verification failed",
              details: "Invalid response from payment gateway",
            });
          }

          if (!verifyResp.ok || !verifyJson?.status) {
            console.error("[Upgrade Monicredit] API verification failed:", {
              status: verifyResp.status,
              statusText: verifyResp.statusText,
              response: verifyJson,
              verifyUrl,
              transactionIdForVerification,
              ourReference: reference,
            });

            // Check if error response contains transaction_id
            const errorTransactionId =
              verifyJson?.data?.transaction_id ||
              verifyJson?.transaction_id ||
              verifyJson?.data?.id;

            // Try alternative approaches before giving up
            // 1. Try querying by order_id if we used transaction_id
            if (!errorTransactionId && !isMonicreditTransactionId) {
              console.log(
                "[Upgrade Monicredit] Trying to query transaction by order_id:",
                reference
              );
              // Try alternative endpoint: get transaction info by order_id
              const orderQueryUrl = `${monicreditApiBase}/payment/transactions/init-transaction-info/${reference}`;
              try {
                const orderResp = await fetch(orderQueryUrl, {
                  method: "GET",
                  headers: {
                    Accept: "application/json",
                    Authorization: `Basic ${base64Credentials}`,
                  },
                } as any);

                if (orderResp.ok) {
                  const orderJson = JSON.parse(await orderResp.text());
                  const foundTransactionId =
                    orderJson?.data?.transaction_id ||
                    orderJson?.transaction_id ||
                    orderJson?.data?.id;

                  if (foundTransactionId) {
                    console.log(
                      "[Upgrade Monicredit] Found transaction_id via order_id query:",
                      foundTransactionId
                    );
                    // Retry verification with found transaction_id
                    const retryUrl = `${monicreditApiBase}/payment/transactions/verify-transaction/${foundTransactionId}`;
                    const retryResp = await fetch(retryUrl, {
                      method: "GET",
                      headers: {
                        Accept: "application/json",
                        Authorization: `Basic ${base64Credentials}`,
                      },
                    } as any);

                    if (retryResp.ok) {
                      const retryJson = JSON.parse(await retryResp.text());
                      if (retryJson?.status) {
                        const verifiedData = retryJson.data || {};
                        // Store transaction_id in metadata
                        await prisma.payments.updateMany({
                          where: {
                            providerReference: reference,
                            customerId: customer.id,
                          },
                          data: {
                            metadata: {
                              ...paymentMetadata,
                              monicreditTransactionId: foundTransactionId,
                              lastVerifiedAt: new Date().toISOString(),
                            } as any,
                          },
                        });
                        // Check status and complete upgrade
                        const monicreditStatusRaw =
                          verifiedData?.status ??
                          verifiedData?.payment_status ??
                          verifiedData?.transaction_status;
                        const monicreditStatus = monicreditStatusRaw
                          ? String(monicreditStatusRaw).toUpperCase()
                          : null;

                        if (
                          monicreditStatus === "APPROVED" ||
                          monicreditStatus === "SUCCESS" ||
                          monicreditStatus === "PAID" ||
                          monicreditStatus === "COMPLETED"
                        ) {
                          const result = await completeUpgrade(
                            "monicredit_api_retry"
                          );
                          return res.json(result);
                        } else {
                          // Status not successful, fallback to trust redirect
                          if (trustRedirect && hasValidTransactionId) {
                            console.log(
                              "[Upgrade Monicredit] Retry found transaction but status unclear, using trust redirect"
                            );
                            const result = await completeUpgrade(
                              "trusted_redirect_fallback"
                            );
                            return res.json(result);
                          }
                        }
                      }
                    }
                  }
                }
              } catch (orderQueryErr) {
                console.error(
                  "[Upgrade Monicredit] Order query error:",
                  orderQueryErr
                );
              }
            }

            // 2. Try error response transaction_id if available
            if (
              errorTransactionId &&
              errorTransactionId !== transactionIdForVerification
            ) {
              console.log(
                "[Upgrade Monicredit] Found transaction_id in error response, retrying:",
                errorTransactionId
              );
              const retryUrl = `${monicreditApiBase}/payment/transactions/verify-transaction/${errorTransactionId}`;
              try {
                const retryResp = await fetch(retryUrl, {
                  method: "GET",
                  headers: {
                    Accept: "application/json",
                    Authorization: `Basic ${base64Credentials}`,
                  },
                } as any);

                if (retryResp.ok) {
                  const retryJson = JSON.parse(await retryResp.text());
                  if (retryJson?.status) {
                    const verifiedData = retryJson.data || {};
                    // Store transaction_id in metadata
                    await prisma.payments.updateMany({
                      where: {
                        providerReference: reference,
                        customerId: customer.id,
                      },
                      data: {
                        metadata: {
                          ...paymentMetadata,
                          monicreditTransactionId: errorTransactionId,
                          lastVerifiedAt: new Date().toISOString(),
                        } as any,
                      },
                    });
                    // Check status and complete upgrade
                    const monicreditStatusRaw =
                      verifiedData?.status ??
                      verifiedData?.payment_status ??
                      verifiedData?.transaction_status;
                    const monicreditStatus = monicreditStatusRaw
                      ? String(monicreditStatusRaw).toUpperCase()
                      : null;

                    if (
                      monicreditStatus === "APPROVED" ||
                      monicreditStatus === "SUCCESS" ||
                      monicreditStatus === "PAID" ||
                      monicreditStatus === "COMPLETED"
                    ) {
                      const result = await completeUpgrade(
                        "monicredit_api_retry"
                      );
                      return res.json(result);
                    }
                  }
                }
              } catch (retryErr) {
                console.error(
                  "[Upgrade Monicredit] Retry with error transaction_id failed:",
                  retryErr
                );
              }
            }

            // All API attempts failed - fallback to trust redirect if enabled
            if (trustRedirect && hasValidTransactionId) {
              console.log(
                "[Upgrade Monicredit] All API attempts failed, using trust redirect fallback"
              );
              const result = await completeUpgrade("trusted_redirect_fallback");
              return res.json(result);
            }

            // No fallback available - return error with details
            // If we have a valid transaction ID, suggest using trust redirect
            const suggestion = hasValidTransactionId
              ? "Payment appears to have been completed (transaction ID found). " +
                "Enable MONICREDIT_TRUST_REDIRECT=true to complete the upgrade, " +
                "or wait for webhook confirmation."
              : "Enable MONICREDIT_TRUST_REDIRECT=true for demo environments, " +
                "or ensure Monicredit webhooks are configured.";

            return res.status(400).json({
              error: verifyJson?.message || "Payment verification failed",
              details:
                verifyJson?.message ||
                `Could not verify payment with Monicredit API. ${suggestion}`,
              debug: {
                httpStatus: verifyResp.status,
                monicreditResponse: verifyJson,
                triedTransactionId: transactionIdForVerification,
                hasValidTransactionId,
                trustRedirectEnabled: trustRedirect,
                paymentStatus: payment.status,
              },
            });
          }

          // API verification successful - check transaction status
          const verifiedData = verifyJson.data || {};
          const monicreditStatusRaw =
            verifiedData?.status ??
            verifiedData?.payment_status ??
            verifiedData?.transaction_status;
          const monicreditStatus = monicreditStatusRaw
            ? String(monicreditStatusRaw).toUpperCase()
            : null;

          console.log("[Upgrade Monicredit] API verification response:", {
            status: monicreditStatus,
            verifiedData: Object.keys(verifiedData),
          });

          if (
            monicreditStatus === "APPROVED" ||
            monicreditStatus === "SUCCESS" ||
            monicreditStatus === "PAID" ||
            monicreditStatus === "COMPLETED"
          ) {
            // Payment successful - complete upgrade
            const result = await completeUpgrade("monicredit_api");
            return res.json(result);
          } else if (
            monicreditStatus === "FAILED" ||
            monicreditStatus === "DECLINED" ||
            monicreditStatus === "CANCELLED"
          ) {
            // Payment failed
            await prisma.payments.updateMany({
              where: { providerReference: reference, customerId: customer.id },
              data: {
                status: "failed",
                updatedAt: new Date(),
              },
            });
            return res.status(400).json({
              error: "Payment was not successful",
              details: `Payment status: ${monicreditStatus}`,
            });
          } else {
            // Status unclear - fallback to trust redirect if enabled
            if (trustRedirect && hasValidTransactionId) {
              console.log(
                "[Upgrade Monicredit] Unclear status, using trust redirect"
              );
              const result = await completeUpgrade("trusted_redirect_fallback");
              return res.json(result);
            }
            return res.status(400).json({
              error: "Payment status unclear",
              details: `Payment verification returned status: ${
                monicreditStatus || "unknown"
              }`,
            });
          }
        } catch (apiError: any) {
          console.error(
            "[Upgrade Monicredit] API verification error:",
            apiError
          );
          // Fallback to trust redirect if API call fails
          if (trustRedirect && hasValidTransactionId) {
            console.log(
              "[Upgrade Monicredit] API error, using trust redirect fallback"
            );
            try {
              const result = await completeUpgrade("trusted_redirect_fallback");
              return res.json(result);
            } catch (completeError: any) {
              return res.status(400).json({
                error: "Failed to complete upgrade",
                details: completeError.message,
              });
            }
          }
          return res.status(500).json({
            error: "Payment verification failed",
            details:
              apiError.message || "Network error while verifying payment",
          });
        }
      }

      // Paystack verification (existing logic)
      // Resolve Paystack secret key (customer-level → system-level → env)
      console.log(
        "[Upgrade] Resolving Paystack configuration for verification..."
      );
      let paystackSecretKey: string | undefined;

      try {
        // For subscription payments, use system-level settings
        const systemSettings = await prisma.system_settings.findUnique({
          where: { key: "payments.paystack" },
        });
        const systemConf = (systemSettings?.value as any) || {};

        // Prioritize system_settings if enabled, otherwise fall back to env for backward compatibility
        if (systemSettings && systemConf?.isEnabled && systemConf?.secretKey) {
          paystackSecretKey = systemConf.secretKey;
          console.log(
            "[Upgrade] Using Paystack key from system_settings for verification"
          );
        } else {
          // Fallback to env for in-flight payments that were initiated before Paystack was disabled
          paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
          console.log(
            "[Upgrade] Using Paystack key from env for verification (backward compatibility)"
          );
        }

        console.log("[Upgrade] Paystack key resolved for verification:", {
          hasSecretKey: !!paystackSecretKey,
          source: systemConf?.isEnabled ? "system_settings" : "env_fallback",
        });
      } catch (settingsErr) {
        console.warn(
          "[Upgrade] Failed to read payment settings, falling back to env:",
          (settingsErr as any)?.message
        );
        paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      }

      if (!paystackSecretKey) {
        console.error("[Upgrade] Paystack secret key not configured");
        return res
          .status(400)
          .json({ error: "Payment gateway not configured" });
      }

      // Verify payment with Paystack
      console.log("[Upgrade] Verifying with Paystack:", {
        reference,
        hasSecretKey: !!paystackSecretKey,
      });

      let verifyResponse: globalThis.Response;
      let verifyData: any;

      try {
        verifyResponse = await fetch(
          `https://api.paystack.co/transaction/verify/${reference}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
              "Content-Type": "application/json",
            },
          }
        );

        verifyData = (await verifyResponse.json()) as any;
      } catch (fetchError: any) {
        console.error("[Upgrade] Paystack API request failed:", fetchError);
        return res.status(500).json({
          error: "Failed to verify payment",
          details: `Network error while contacting payment gateway: ${fetchError.message}`,
        });
      }

      console.log("[Upgrade] Paystack verification response:", {
        status: verifyResponse.status,
        paystackStatus: verifyData?.status,
        hasData: !!verifyData?.data,
        message: verifyData?.message,
      });

      if (!verifyResponse.ok || !verifyData?.status) {
        console.error("[Upgrade] Paystack verification failed:", {
          httpStatus: verifyResponse.status,
          httpStatusText: verifyResponse.statusText,
          paystackStatus: verifyData?.status,
          verifyData,
          reference,
        });

        // Handle specific Paystack error cases
        if (verifyResponse.status === 404) {
          return res.status(400).json({
            error: "Payment reference not found",
            details:
              "The payment reference does not exist in Paystack. The payment may have been cancelled or the reference is invalid.",
          });
        }

        if (verifyResponse.status === 401 || verifyResponse.status === 403) {
          return res.status(500).json({
            error: "Payment gateway authentication failed",
            details:
              "Unable to authenticate with payment gateway. Please contact support.",
          });
        }

        return res.status(400).json({
          error: verifyData?.message || "Payment verification failed",
          details:
            verifyData?.message ||
            `Paystack API returned status ${verifyResponse.status}. ${
              verifyData?.message || ""
            }`,
        });
      }

      const transaction = verifyData.data;

      if (!transaction) {
        console.error(
          "[Upgrade] No transaction data in Paystack response:",
          verifyData
        );
        return res.status(400).json({
          error: "Payment verification failed",
          details: "No transaction data received from payment gateway",
        });
      }

      if (transaction.status !== "success") {
        console.error("[Upgrade] Payment not successful:", {
          status: transaction.status,
          reference,
          gateway: transaction.gateway_response,
          transactionData: {
            amount: transaction.amount,
            currency: transaction.currency,
            customer: transaction.customer,
          },
        });

        // Provide helpful error messages based on status
        let errorMessage = "Payment was not successful";
        let errorDetails =
          transaction.gateway_response ||
          `Payment status: ${transaction.status}`;

        if (transaction.status === "pending") {
          errorMessage = "Payment is still pending";
          errorDetails =
            "The payment has not been completed yet. Please complete the payment process or try again later.";
        } else if (transaction.status === "failed") {
          errorMessage = "Payment failed";
          errorDetails =
            transaction.gateway_response ||
            "The payment could not be processed. Please try again or use a different payment method.";
        } else if (transaction.status === "reversed") {
          errorMessage = "Payment was reversed";
          errorDetails =
            "The payment has been reversed. Please contact support if you believe this is an error.";
        }

        return res.status(400).json({
          error: errorMessage,
          details: errorDetails,
          paymentStatus: transaction.status,
        });
      }

      console.log("[Upgrade] Payment verified successfully");

      // Get metadata - prioritize payment record metadata over transaction metadata
      // Payment record metadata is more reliable as we control it
      let paymentMetadata: any = {};
      if (payment.metadata) {
        // Handle both object and string formats (for backward compatibility)
        if (typeof payment.metadata === "string") {
          try {
            paymentMetadata = JSON.parse(payment.metadata);
          } catch (e) {
            console.warn(
              "[Upgrade] Failed to parse payment metadata as JSON:",
              e
            );
            paymentMetadata = {};
          }
        } else {
          paymentMetadata = payment.metadata as any;
        }
      }

      const transactionMetadata = transaction.metadata || {};

      // Merge: payment record metadata takes precedence
      const metadata = {
        ...transactionMetadata,
        ...paymentMetadata,
      };

      const planId = metadata.planId;
      const invoiceId = metadata.invoiceId;
      const verifiedBillingCycle =
        metadata.billingCycle || customer.billingCycle || "monthly";

      console.log("[Upgrade] Metadata resolved:", {
        planId,
        invoiceId,
        billingCycle: verifiedBillingCycle,
        hasPaymentMetadata: !!paymentMetadata.planId,
        hasTransactionMetadata: !!transactionMetadata.planId,
      });

      if (!planId) {
        console.error("[Upgrade] Missing planId in metadata:", {
          paymentMetadata,
          transactionMetadata,
        });
        return res.status(400).json({
          error: "Invalid payment metadata",
          details:
            "Plan ID not found in payment metadata. Please contact support.",
        });
      }

      // Get the new plan
      const newPlan = await prisma.plans.findUnique({
        where: { id: planId },
      });

      if (!newPlan) {
        return res.status(404).json({ error: "Plan not found" });
      }

      // Calculate new MRR based on verified billing cycle
      const billingCycle = verifiedBillingCycle;
      const newMRR =
        billingCycle === "annual"
          ? newPlan.annualPrice / 12
          : newPlan.monthlyPrice;

      // Update customer with new plan
      const updateData: any = {
        planId: newPlan.id,
        planCategory: newPlan.category,
        userLimit: newPlan.userLimit,
        storageLimit: newPlan.storageLimit,
        // Also update storage_limit in bytes (storageLimit is in MB)
        storage_limit: BigInt((newPlan.storageLimit || 0) * 1024 * 1024),
        mrr: newMRR,
        status: "active",
        billingCycle,
        subscriptionStartDate: customer.subscriptionStartDate || new Date(),
        // Clear trial-related fields when upgrading to paid plan
        trialStartsAt: null,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        suspendedAt: null,
        suspensionReason: null,
        updatedAt: new Date(),
      };

      // Set limits based on plan category
      if (newPlan.category === "property_management") {
        updateData.propertyLimit = newPlan.propertyLimit;
      } else if (newPlan.category === "development") {
        updateData.projectLimit = newPlan.projectLimit;
      }

      const updatedCustomer = await prisma.customers.update({
        where: { id: customer.id },
        data: updateData,
        include: { plans: true },
      });

      console.log("[Upgrade] Customer updated with new plan");

      // Update invoice status
      if (invoiceId) {
        await prisma.invoices.update({
          where: { id: invoiceId },
          data: {
            status: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Update payment record
      await prisma.payments.updateMany({
        where: {
          providerReference: reference,
          customerId: customer.id,
        },
        data: {
          status: "completed",
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Emit real-time event to admins
      emitToAdmins("subscription:plan-upgraded", {
        customerId: updatedCustomer.id,
        customerName: updatedCustomer.company,
        oldPlan: customer.plans?.name,
        newPlan: newPlan.name,
        amount: transaction.amount / 100,
        currency: transaction.currency,
      });

      // Emit to customer
      emitToCustomer(updatedCustomer.id, "subscription:upgraded", {
        plan: newPlan.name,
        limits: {
          projects: updateData.projectLimit,
          properties: updateData.propertyLimit,
          users: updateData.userLimit,
          storage: updateData.storageLimit,
        },
      });

      // Capture MRR snapshot
      await captureSnapshotOnChange(updatedCustomer.id);

      // -----------------------------------------------------------------------
      // Send upgrade confirmation email (for active → higher plan upgrades)
      // Mirrors logic in /api/subscription/upgrade so behaviour is consistent
      // -----------------------------------------------------------------------
      let emailSent = false;
      let emailErrorDetails: any = null;

      try {
        // Lazy-require to avoid circular deps at module load
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { sendPlanUpgradeEmail } = require("../lib/email");

        // Old plan name comes from the customer snapshot we loaded earlier
        const oldPlanName = customer.plans?.name || "Free Plan";

        const dashboardUrl = `${
          process.env.FRONTEND_URL || "http://localhost:5173"
        }/dashboard`;
        const effectiveDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Build features object from the NEW plan
        const newFeatures: any = {
          users: newPlan.userLimit,
          storage: newPlan.storageLimit,
        };

        if (newPlan.category === "development" && newPlan.projectLimit) {
          newFeatures.projects = newPlan.projectLimit;
        } else if (newPlan.category === "property_management") {
          if (newPlan.propertyLimit)
            newFeatures.properties = newPlan.propertyLimit;
          if ((newPlan as any).unitLimit)
            newFeatures.units = (newPlan as any).unitLimit;
        }

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(
          "[Upgrade] 📧 SENDING UPGRADE CONFIRMATION EMAIL (verify flow)"
        );
        console.log("[Upgrade] Customer:", customer.email);
        console.log("[Upgrade] Plan:", `${oldPlanName} → ${newPlan.name}`);
        console.log(
          "[Upgrade] Price:",
          billingCycle === "annual" ? newPlan.annualPrice : newPlan.monthlyPrice
        );
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        emailSent = await sendPlanUpgradeEmail({
          customerName: customer.company || customer.owner || "Customer",
          customerEmail: customer.email,
          companyName: customer.company || "Your Company",
          oldPlanName,
          newPlanName: newPlan.name,
          newPlanPrice:
            billingCycle === "annual"
              ? newPlan.annualPrice
              : newPlan.monthlyPrice,
          currency: newPlan.currency || "NGN",
          billingCycle,
          effectiveDate,
          newFeatures,
          dashboardUrl,
        });

        console.log(
          "[Upgrade] 📧 Email function returned:",
          emailSent ? "✅ SUCCESS" : "❌ FAILED"
        );
      } catch (emailError: any) {
        console.error(
          "[Upgrade] ❌ EXCEPTION while sending upgrade confirmation email (verify flow):",
          emailError
        );
        emailErrorDetails = {
          message: emailError?.message,
          code: emailError?.code,
          response: emailError?.response,
          stack: emailError?.stack,
        };
      }

      if (!emailSent) {
        console.error(
          "[Upgrade] ⚠️ VALIDATION FAILED: Upgrade email was NOT sent (verify flow)"
        );
        console.error("[Upgrade] Email error:", emailErrorDetails);

        // IMPORTANT: At this point, payment and database updates have succeeded.
        // We still return 500 so the caller knows email delivery failed,
        // matching the behaviour of /api/subscription/upgrade.
        return res.status(500).json({
          success: false,
          error: "Failed to send upgrade confirmation email",
          details: emailErrorDetails?.message || "Unknown email error",
          data: {
            customerId: updatedCustomer.id,
            customerEmail: customer.email,
            planName: newPlan.name,
            note: "Upgrade was processed but email delivery failed. Please notify the customer manually.",
          },
        });
      }

      console.log(
        "[Upgrade] ✅ Upgrade completed successfully (verify flow, email sent)"
      );

      res.json({
        success: true,
        message: "Plan upgraded successfully",
        customer: {
          id: updatedCustomer.id,
          plan: newPlan.name,
          limits: {
            projects: updateData.projectLimit,
            properties: updateData.propertyLimit,
            users: updateData.userLimit,
            storage: updateData.storageLimit,
          },
        },
      });
    } catch (error: any) {
      console.error("[Upgrade] Verify payment error:", error);
      res.status(500).json({ error: "Failed to verify upgrade payment" });
    }
  }
);

// Verify upgrade payment (GET version - matches tenant payment pattern)
// This is the recommended endpoint for frontend verification after redirect
router.get(
  "/upgrade/verify/:reference",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { reference } = req.params;
      const userId = req.user?.id;
      const customerId = req.user?.customerId;

      console.log("[Upgrade GET] Verify payment:", {
        reference,
        userId,
        customerId,
      });

      if (!userId || !customerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Find payment by reference (same as tenant pattern)
      let payment = await prisma.payments.findFirst({
        where: {
          customerId,
          providerReference: reference,
          type: "subscription",
        },
      });

      // If not found, try searching by transaction_id in metadata (Monicredit)
      if (!payment) {
        payment = await prisma.payments.findFirst({
          where: {
            customerId,
            type: "subscription",
            OR: [
              { providerReference: reference },
              {
                provider: "monicredit",
                metadata: {
                  path: ["monicreditTransactionId"],
                  equals: reference,
                },
              },
            ],
          },
        });
      }

      if (!payment) {
        console.error("[Upgrade GET] Payment not found:", {
          reference,
          customerId,
        });
        return res.status(404).json({
          success: false,
          error: "Payment not found",
          details: `No subscription payment found with reference ${reference}`,
        });
      }

      const provider = payment.provider || "paystack";

      console.log("[Upgrade GET] Payment found:", {
        id: payment.id,
        status: payment.status,
        provider,
        amount: payment.amount,
      });

      // Parse payment metadata early - needed for idempotency check
      let paymentMetadata: any = {};
      if (payment.metadata) {
        if (typeof payment.metadata === "string") {
          try {
            paymentMetadata = JSON.parse(payment.metadata);
          } catch (e) {
            paymentMetadata = {};
          }
        } else {
          paymentMetadata = payment.metadata as any;
        }
      }

      // Check if payment is already completed AND upgrade is done (idempotency)
      // IMPORTANT: Only return early if BOTH payment and upgrade are completed
      // This prevents issues where webhook updates payment status before user completes payment
      if (payment.status === "completed" || payment.status === "success") {
        const planId = paymentMetadata?.planId;
        const customer = await prisma.customers.findUnique({
          where: { id: customerId },
          include: { plans: true },
        });

        // If customer's plan matches the upgrade plan, upgrade was already completed
        if (planId && customer?.planId === planId) {
          console.log("[Upgrade GET] Payment and upgrade already completed, returning success");
          return res.json({
            success: true,
            status: "success",
            reference,
            provider,
            verified: true,
            verificationSource: "database",
            message: "Payment already processed",
            plan: customer.plans?.name,
            customer: {
              id: customer.id,
              plan: customer.plans?.name,
              limits: {
                projects: customer.projectLimit,
                properties: customer.propertyLimit,
                users: customer.userLimit,
                storage: customer.storageLimit,
              },
            },
          });
        }

        // Payment status is "success" but upgrade not completed
        // This can happen if webhook fired before user returned from payment page
        console.log("[Upgrade GET] Payment status is 'success' but upgrade not completed. Continuing to complete upgrade...");
      }

      // For Monicredit: Use trust redirect mode (same as tenant payments)
      // Since we use redirect flow, when user returns from Monicredit, they've completed the payment flow
      if (provider === "monicredit") {
        const trustRedirectEnv = process.env.MONICREDIT_TRUST_REDIRECT === "true";
        const hasValidTransactionId =
          reference.startsWith("ACX") ||
          !!paymentMetadata?.monicreditTransactionId;

        // For redirect flow, trust that user returning from Monicredit means payment was attempted
        // This is consistent with tenant payment flow which also trusts redirects
        // Only skip if explicitly disabled via MONICREDIT_TRUST_REDIRECT=false
        const shouldTrustRedirect =
          process.env.MONICREDIT_TRUST_REDIRECT !== "false" || // Default to true unless explicitly false
          trustRedirectEnv ||
          hasValidTransactionId;

        console.log("[Upgrade GET] Monicredit verification:", {
          trustRedirectEnv,
          hasValidTransactionId,
          shouldTrustRedirect,
          paymentStatus: payment.status,
          reference,
        });

        // If payment is pending/success and we should trust redirect, complete the upgrade
        // Also handle case where webhook updated status to "success" before user returned
        if (
          (payment.status === "pending" || payment.status === "success") &&
          shouldTrustRedirect
        ) {
          console.log("[Upgrade GET] Using trust redirect mode for Monicredit");

          const planId = paymentMetadata?.planId;
          const invoiceId = paymentMetadata?.invoiceId;
          const billingCycle = paymentMetadata?.billingCycle || "monthly";

          if (!planId) {
            return res.status(400).json({
              success: false,
              error: "Invalid payment metadata",
              details: "Plan ID not found",
            });
          }

          // Get customer and plan
          const customer = await prisma.customers.findUnique({
            where: { id: customerId },
            include: { plans: true },
          });

          const newPlan = await prisma.plans.findUnique({
            where: { id: planId },
          });

          if (!customer || !newPlan) {
            return res.status(404).json({
              success: false,
              error: "Customer or plan not found",
            });
          }

          // Calculate new MRR
          const newMRR =
            billingCycle === "annual"
              ? newPlan.annualPrice / 12
              : newPlan.monthlyPrice;

          // Update customer with new plan
          const updateData: any = {
            planId: newPlan.id,
            planCategory: newPlan.category,
            userLimit: newPlan.userLimit,
            storageLimit: newPlan.storageLimit,
            storage_limit: BigInt((newPlan.storageLimit || 0) * 1024 * 1024),
            mrr: newMRR,
            status: "active",
            billingCycle,
            subscriptionStartDate: customer.subscriptionStartDate || new Date(),
            trialStartsAt: null,
            trialEndsAt: null,
            gracePeriodEndsAt: null,
            suspendedAt: null,
            suspensionReason: null,
            updatedAt: new Date(),
          };

          if (newPlan.category === "property_management") {
            updateData.propertyLimit = newPlan.propertyLimit;
          } else if (newPlan.category === "development") {
            updateData.projectLimit = newPlan.projectLimit;
          }

          await prisma.customers.update({
            where: { id: customerId },
            data: updateData,
          });

          // Update invoice
          if (invoiceId) {
            await prisma.invoices.update({
              where: { id: invoiceId },
              data: {
                status: "paid",
                paidAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          // Update payment
          await prisma.payments.update({
            where: { id: payment.id },
            data: {
              status: "success",
              paidAt: new Date(),
              metadata: {
                ...paymentMetadata,
                trustedRedirect: true,
                verifiedAt: new Date().toISOString(),
              } as any,
              updatedAt: new Date(),
            },
          });

          // Emit events
          emitToAdmins("subscription:plan-upgraded", {
            customerId,
            newPlan: newPlan.name,
            amount: payment.amount,
          });

          emitToCustomer(customerId, "subscription:upgraded", {
            plan: newPlan.name,
          });

          // Send upgrade confirmation email
          try {
            const { sendPlanUpgradeEmail } = require("../lib/email");
            const oldPlanName = customer.plans?.name || "Free Plan";
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const dashboardUrl = `${frontendUrl}/developer/settings?tab=billing`;
            const effectiveDate = new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            const newFeatures: any = {
              users: newPlan.userLimit,
              storage: newPlan.storageLimit,
            };
            if (newPlan.category === "development" && newPlan.projectLimit) {
              newFeatures.projects = newPlan.projectLimit;
            } else if (newPlan.category === "property_management") {
              if (newPlan.propertyLimit) newFeatures.properties = newPlan.propertyLimit;
              if (newPlan.unitLimit) newFeatures.units = newPlan.unitLimit;
            }

            console.log("[Upgrade GET] Sending upgrade confirmation email (Monicredit)");
            await sendPlanUpgradeEmail({
              customerName: customer.company || customer.owner || "Customer",
              customerEmail: customer.email,
              companyName: customer.company || "Your Company",
              oldPlanName,
              newPlanName: newPlan.name,
              newPlanPrice: billingCycle === "annual" ? newPlan.annualPrice : newPlan.monthlyPrice,
              currency: newPlan.currency,
              billingCycle,
              effectiveDate,
              newFeatures,
              dashboardUrl,
            });
            console.log("[Upgrade GET] ✅ Email sent successfully (Monicredit)");
          } catch (emailError: any) {
            console.error("[Upgrade GET] ⚠️ Failed to send email (Monicredit):", emailError?.message);
            // Don't fail the request if email fails - upgrade was successful
          }

          console.log(
            "[Upgrade GET] Subscription upgraded successfully via trust redirect"
          );

          return res.json({
            success: true,
            status: "success",
            reference,
            provider,
            verified: true,
            verificationSource: "trusted_redirect",
            message: "Subscription upgraded successfully",
            plan: newPlan.name,
            customer: {
              id: customerId,
              plan: newPlan.name,
              limits: {
                projects: updateData.projectLimit,
                properties: updateData.propertyLimit,
                users: updateData.userLimit,
                storage: updateData.storageLimit,
              },
            },
          });
        }

        // If already failed
        if (payment.status === "failed") {
          return res.json({
            success: false,
            status: "failed",
            reference,
            provider,
            verified: true,
            verificationSource: "database",
            message: "Payment failed",
          });
        }

        // Still pending - return pending status
        return res.json({
          success: false,
          status: "pending",
          reference,
          provider,
          verified: false,
          message: "Payment is still pending. Please wait or try again.",
        });
      }

      // For Paystack: Verify with API
      let paystackSecretKey: string | undefined;
      try {
        const systemSettings = await prisma.system_settings.findUnique({
          where: { key: "payments.paystack" },
        });
        const systemConf = (systemSettings?.value as any) || {};
        paystackSecretKey =
          systemConf?.secretKey || process.env.PAYSTACK_SECRET_KEY;
      } catch {
        paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      }

      if (!paystackSecretKey) {
        return res.status(400).json({
          success: false,
          error: "Payment gateway not configured",
        });
      }

      // Verify with Paystack
      const verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
          },
        }
      );

      const verifyData = (await verifyResponse.json()) as any;

      if (!verifyResponse.ok || !verifyData?.status) {
        return res.status(400).json({
          success: false,
          error: verifyData?.message || "Payment verification failed",
        });
      }

      const transaction = verifyData.data;

      if (transaction.status !== "success") {
        return res.json({
          success: false,
          status: transaction.status,
          reference,
          provider,
          verified: true,
          message: `Payment status: ${transaction.status}`,
        });
      }

      // Payment successful - complete upgrade
      const planId = paymentMetadata?.planId || transaction.metadata?.planId;
      const invoiceId =
        paymentMetadata?.invoiceId || transaction.metadata?.invoiceId;
      const billingCycle =
        paymentMetadata?.billingCycle ||
        transaction.metadata?.billingCycle ||
        "monthly";

      if (!planId) {
        return res.status(400).json({
          success: false,
          error: "Invalid payment metadata",
        });
      }

      const customer = await prisma.customers.findUnique({
        where: { id: customerId },
        include: { plans: true },
      });

      const newPlan = await prisma.plans.findUnique({
        where: { id: planId },
      });

      if (!customer || !newPlan) {
        return res.status(404).json({
          success: false,
          error: "Customer or plan not found",
        });
      }

      // Calculate new MRR
      const newMRR =
        billingCycle === "annual"
          ? newPlan.annualPrice / 12
          : newPlan.monthlyPrice;

      // Update customer with new plan
      const updateData: any = {
        planId: newPlan.id,
        planCategory: newPlan.category,
        userLimit: newPlan.userLimit,
        storageLimit: newPlan.storageLimit,
        storage_limit: BigInt((newPlan.storageLimit || 0) * 1024 * 1024),
        mrr: newMRR,
        status: "active",
        billingCycle,
        subscriptionStartDate: customer.subscriptionStartDate || new Date(),
        trialStartsAt: null,
        trialEndsAt: null,
        gracePeriodEndsAt: null,
        suspendedAt: null,
        suspensionReason: null,
        updatedAt: new Date(),
      };

      if (newPlan.category === "property_management") {
        updateData.propertyLimit = newPlan.propertyLimit;
      } else if (newPlan.category === "development") {
        updateData.projectLimit = newPlan.projectLimit;
      }

      await prisma.customers.update({
        where: { id: customerId },
        data: updateData,
      });

      // Update invoice
      if (invoiceId) {
        await prisma.invoices.update({
          where: { id: invoiceId },
          data: {
            status: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      // Update payment
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: "success",
          paidAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Emit events
      emitToAdmins("subscription:plan-upgraded", {
        customerId,
        newPlan: newPlan.name,
        amount: payment.amount,
      });

      emitToCustomer(customerId, "subscription:upgraded", {
        plan: newPlan.name,
      });

      // Send upgrade confirmation email
      try {
        const { sendPlanUpgradeEmail } = require("../lib/email");
        const oldPlanName = customer.plans?.name || "Free Plan";
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const dashboardUrl = `${frontendUrl}/developer/settings?tab=billing`;
        const effectiveDate = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const newFeatures: any = {
          users: newPlan.userLimit,
          storage: newPlan.storageLimit,
        };
        if (newPlan.category === "development" && newPlan.projectLimit) {
          newFeatures.projects = newPlan.projectLimit;
        } else if (newPlan.category === "property_management") {
          if (newPlan.propertyLimit) newFeatures.properties = newPlan.propertyLimit;
          if (newPlan.unitLimit) newFeatures.units = newPlan.unitLimit;
        }

        console.log("[Upgrade GET] Sending upgrade confirmation email (Paystack)");
        await sendPlanUpgradeEmail({
          customerName: customer.company || customer.owner || "Customer",
          customerEmail: customer.email,
          companyName: customer.company || "Your Company",
          oldPlanName,
          newPlanName: newPlan.name,
          newPlanPrice: billingCycle === "annual" ? newPlan.annualPrice : newPlan.monthlyPrice,
          currency: newPlan.currency,
          billingCycle,
          effectiveDate,
          newFeatures,
          dashboardUrl,
        });
        console.log("[Upgrade GET] ✅ Email sent successfully (Paystack)");
      } catch (emailError: any) {
        console.error("[Upgrade GET] ⚠️ Failed to send email (Paystack):", emailError?.message);
        // Don't fail the request if email fails - upgrade was successful
      }

      console.log(
        "[Upgrade GET] Subscription upgraded successfully via Paystack"
      );

      return res.json({
        success: true,
        status: "success",
        reference,
        provider,
        verified: true,
        verificationSource: "paystack_api",
        message: "Subscription upgraded successfully",
        plan: newPlan.name,
        customer: {
          id: customerId,
          plan: newPlan.name,
          limits: {
            projects: updateData.projectLimit,
            properties: updateData.propertyLimit,
            users: updateData.userLimit,
            storage: updateData.storageLimit,
          },
        },
      });
    } catch (error: any) {
      console.error("[Upgrade GET] Error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to verify upgrade payment",
        details: error.message,
      });
    }
  }
);

export default router;
