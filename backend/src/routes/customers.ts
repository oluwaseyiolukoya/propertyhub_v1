import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { authMiddleware, adminOnly, AuthRequest } from "../middleware/auth";
import prisma from "../lib/db";
import { emitToAdmins, emitToCustomer } from "../lib/socket";
import { captureSnapshotOnChange } from "../lib/mrr-snapshot";
import { calculateTrialEndDate } from "../lib/trial-config";
import { sendCustomerInvitation } from "../lib/email";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Mock data for development
const mockCustomers = [
  {
    id: "customer-1",
    company: "Metro Properties LLC",
    owner: "John Smith",
    email: "john@metro-properties.com",
    phone: "+1-555-0123",
    status: "active",
    plan: { id: "plan-1", name: "Professional", monthlyPrice: 99 },
    mrr: 99,
    createdAt: new Date("2024-01-15"),
    lastLogin: new Date(),
    _count: { properties: 5, users: 3 },
  },
  {
    id: "customer-2",
    company: "Sunset Realty Group",
    owner: "Sarah Chen",
    email: "sarah@sunsetrealty.com",
    phone: "+1-555-0124",
    status: "active",
    plan: { id: "plan-2", name: "Enterprise", monthlyPrice: 299 },
    mrr: 299,
    createdAt: new Date("2024-02-01"),
    lastLogin: new Date(),
    _count: { properties: 12, users: 8 },
  },
];

// Get all customers
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, plan } = req.query;

    // Try database first
    try {
      // Best practice: prevent caching to avoid UI 304 flicker on admin tables
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      const where: any = {};

      if (search) {
        where.OR = [
          { company: { contains: search as string, mode: "insensitive" } },
          { owner: { contains: search as string, mode: "insensitive" } },
          { email: { contains: search as string, mode: "insensitive" } },
        ];
      }

      if (status) {
        where.status = status;
      }

      if (plan) {
        where.planId = plan;
      }

      const customersRaw = await prisma.customers.findMany({
        where,
        include: {
          plans: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              lastLogin: true,
            },
          },
          _count: {
            select: {
              properties: true,
              users: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const customers = customersRaw.map((c: any) => ({
        ...c,
        plan: c.plans || null,
      }));

      console.log("✅ Customers fetched from database:", customers.length);
      if (customers.length > 0) {
        console.log(
          "✅ First customer data:",
          JSON.stringify(customers[0], null, 2)
        );
      }

      return res.json(customers);
    } catch (dbError) {
      // Database not available, return mock data
      console.log("📝 Using mock customers data");
      return res.json(mockCustomers);
    }
  } catch (error: any) {
    console.error("Get customers error:", error);
    return res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get single customer
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customerRaw = await prisma.customers.findUnique({
      where: { id },
      include: {
        plans: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            lastLogin: true,
          },
        },
        properties: {
          select: {
            id: true,
            name: true,
            propertyType: true,
            totalUnits: true,
            status: true,
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        support_tickets: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        onboarding_applications: {
          select: {
            id: true,
            applicationType: true,
            companyName: true,
            metadata: true,
          },
        },
      },
    });

    if (!customerRaw) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customer = {
      ...customerRaw,
      plan: (customerRaw as any).plans || null,
    };
    return res.json(customer);
  } catch (error: any) {
    console.error("Get customer error:", error);
    return res.status(500).json({ error: "Failed to fetch customer" });
  }
});

// Create customer
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const {
      company,
      owner,
      email,
      phone,
      website,
      taxId,
      industry,
      companySize,
      customerType, // 'property_owner' | 'property_manager' | 'property_developer'
      planId,
      plan: planName, // Accept plan name as well
      billingCycle,
      street,
      city,
      state,
      postalCode,
      country,
      propertyLimit,
      userLimit,
      storageLimit,
      properties, // Accept properties count
      units, // Accept units count
      status,
      sendInvitation,
      temporaryPassword, // Password from frontend
      notes,
    } = req.body;

    // Validate required fields
    if (!company || !owner || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if email already exists
    const existingCustomer = await prisma.customers.findUnique({
      where: { email },
      include: { plans: true },
    });

    if (existingCustomer) {
      return res.status(400).json({
        error: "Email already exists",
        existingCustomer: {
          id: existingCustomer.id,
          company: existingCustomer.company,
          owner: existingCustomer.owner,
          email: existingCustomer.email,
          status: existingCustomer.status,
          plan: (existingCustomer as any).plans?.name,
        },
      });
    }

    // Get plan limits - lookup by planId or planName
    let plan = null as any;
    let finalPlanId = planId;

    if (planName && !planId) {
      // Look up plan by name
      console.log("Looking up plan by name:", planName);
      plan = await prisma.plans.findFirst({
        where: { name: planName },
      });
      if (plan) {
        console.log("Found plan:", plan.id, plan.name);
        finalPlanId = plan.id;
      } else {
        console.log("Plan not found with name:", planName);
        // If plan name provided but not found, return error
        return res.status(400).json({
          error: `Plan "${planName}" not found. Please select a valid subscription plan.`,
        });
      }
    } else if (planId) {
      plan = await prisma.plans.findUnique({ where: { id: planId } });
      if (!plan) {
        return res.status(400).json({
          error: `Plan with ID "${planId}" not found.`,
        });
      }
    } else {
      // Neither planName nor planId provided
      console.log("No plan specified, using null planId");
    }

    console.log("Final planId:", finalPlanId);

    // Calculate MRR based on plan and billing cycle
    let calculatedMRR = 0;
    if (plan && (status === "active" || status === "trial")) {
      if ((billingCycle || "monthly") === "monthly") {
        calculatedMRR = plan.monthlyPrice;
      } else if (billingCycle === "annual") {
        calculatedMRR = plan.annualPrice / 12; // Convert annual to monthly
      }
    }
    console.log("Calculated MRR:", calculatedMRR);

    // Determine plan category and limits based on plan
    const planCategory = plan?.category || "property_management";
    const finalPropertyLimit =
      plan?.category === "property_management"
        ? propertyLimit || plan?.propertyLimit || 5
        : 0; // Set to 0 for developers (they use projectLimit instead)
    const finalProjectLimit =
      plan?.category === "development"
        ? propertyLimit || plan?.projectLimit || 3 // propertyLimit field is reused for projectLimit
        : 0; // Set to 0 for property owners/managers

    console.log("Plan category:", planCategory);
    console.log("Property limit:", finalPropertyLimit);
    console.log("Project limit:", finalProjectLimit);

    // Create customer
    const customer = await prisma.customers.create({
      data: {
        id: randomUUID(),
        company,
        owner,
        email,
        phone,
        website,
        taxId,
        industry,
        companySize,
        planId: finalPlanId, // Use finalPlanId which could be from planName lookup
        planCategory: planCategory, // Set plan category
        billingCycle: billingCycle || "monthly",
        mrr: calculatedMRR, // Set calculated MRR
        street,
        city,
        state,
        postalCode: postalCode || (req.body as any).zipCode || null,
        country: country || "Nigeria",
        propertyLimit: finalPropertyLimit,
        projectLimit: finalProjectLimit,
        userLimit: userLimit || plan?.userLimit || 3,
        storageLimit: storageLimit || plan?.storageLimit || 1000,
        propertiesCount: properties || 0, // Add properties count
        projectsCount: plan?.category === "development" ? properties || 0 : 0, // Use properties field for projects count if developer
        unitsCount: units || 0, // Add units count
        notes: notes || null, // Add notes field
        status: status || "trial",
        subscriptionStartDate: status === "active" ? new Date() : null,
        trialEndsAt: status === "trial" ? await calculateTrialEndDate() : null, // Get trial duration from Trial plan
        updatedAt: new Date(),
      },
      include: {
        plans: true,
      },
    });

    // Determine user role based on customer type
    let userRole = "owner"; // Default to owner
    if (customerType === "property_developer") {
      userRole = "developer";
    } else if (customerType === "property_manager") {
      userRole = "manager";
    } else if (customerType === "property_owner") {
      userRole = "owner";
    }

    console.log(
      "Creating user with role:",
      userRole,
      "for customer type:",
      customerType
    );

    // Create owner user
    // Use password from frontend if provided, otherwise generate one
    const tempPassword =
      temporaryPassword || Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    console.log("🔐 Using password for customer creation:", {
      providedByFrontend: !!temporaryPassword,
      passwordLength: tempPassword.length,
      email: email,
    });

    const ownerUser = await prisma.users.create({
      data: {
        id: randomUUID(),
        customerId: customer.id,
        name: owner,
        email,
        password: hashedPassword, // Always store password (required for login)
        phone,
        role: userRole,
        status: sendInvitation ? "pending" : "active",
        invitedAt: sendInvitation ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    // Generate initial invoice
    let invoice = null;
    if (plan && status === "trial") {
      // Create invoice for trial period (due when trial ends)
      const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      invoice = await prisma.invoices.create({
        data: {
          id: randomUUID(),
          customerId: customer.id,
          invoiceNumber: `INV-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`,
          dueDate: trialEndDate,
          amount:
            billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice,
          currency: plan.currency,
          status: "pending",
          billingPeriod: billingCycle === "annual" ? "Annual" : "Monthly",
          description: `${plan.name} Plan - ${
            billingCycle === "annual" ? "Annual" : "Monthly"
          } Subscription (Trial period invoice - Payment due at end of trial)`,
          items: [
            {
              description: `${plan.name} Plan - ${
                billingCycle === "annual" ? "Annual" : "Monthly"
              } Subscription`,
              quantity: 1,
              unitPrice:
                billingCycle === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice,
              amount:
                billingCycle === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice,
            },
          ],
          updatedAt: new Date(),
        },
      });
    } else if (plan && status === "active") {
      // Create invoice for active subscription (due immediately)
      invoice = await prisma.invoices.create({
        data: {
          id: randomUUID(),
          customerId: customer.id,
          invoiceNumber: `INV-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)
            .toUpperCase()}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          amount:
            billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice,
          currency: plan.currency,
          status: "pending",
          billingPeriod: billingCycle === "annual" ? "Annual" : "Monthly",
          description: `${plan.name} Plan - ${
            billingCycle === "annual" ? "Annual" : "Monthly"
          } Subscription (Initial subscription invoice)`,
          items: [
            {
              description: `${plan.name} Plan - ${
                billingCycle === "annual" ? "Annual" : "Monthly"
              } Subscription`,
              quantity: 1,
              unitPrice:
                billingCycle === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice,
              amount:
                billingCycle === "annual"
                  ? plan.annualPrice
                  : plan.monthlyPrice,
            },
          ],
          updatedAt: new Date(),
        },
      });
    }

    // Log activity using the new owner's ID (don't fail customer creation if logging fails)
    try {
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          customerId: customer.id,
          userId: ownerUser.id, // Use the newly created owner's ID instead of admin's ID
          action: "CUSTOMER_CREATED",
          entity: "Customer",
          entityId: customer.id,
          description: `Customer ${company} created by ${
            req.user?.email || "system"
          }`,
        },
      });
    } catch (logError: any) {
      console.error("Failed to log activity:", logError);
      // Continue anyway - don't fail customer creation
    }

    // Send invitation email if requested
    if (sendInvitation) {
      try {
        // Validate email configuration before attempting to send
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          console.error(
            "❌ Email configuration missing: SMTP_USER or SMTP_PASS not set"
          );
          console.error(
            "⚠️ Customer created but invitation email NOT sent. Please configure SMTP settings."
          );
        } else {
          console.log("📧 Attempting to send invitation email to:", email);
          console.log(
            "🔐 Password being sent in email:",
            tempPassword.substring(0, 4) + "****"
          );
          console.log("📋 Customer type:", customerType || "property_owner");
          console.log(
            "📧 SMTP Host:",
            process.env.SMTP_HOST || "mail.privateemail.com"
          );
          console.log("📧 SMTP Port:", process.env.SMTP_PORT || "465");

          const emailSent = await sendCustomerInvitation({
            customerName: owner,
            customerEmail: email,
            companyName: company,
            tempPassword: tempPassword,
            planName: plan?.name,
            customerType: customerType || "property_owner",
          });

          if (emailSent) {
            console.log(
              "✅ Customer invitation email sent successfully to:",
              email
            );
          } else {
            console.error("❌ Email function returned false for:", email);
          }
        }
      } catch (emailError: any) {
        console.error(
          "❌ Failed to send customer invitation email to:",
          email,
          "Error:",
          emailError?.message || emailError
        );
        console.error("📧 Email error details:", {
          code: emailError?.code,
          command: emailError?.command,
          response: emailError?.response,
          responseCode: emailError?.responseCode,
          stack: emailError?.stack,
        });
        // Don't fail customer creation if email fails
      }
    }

    // Emit real-time event to all admins
    emitToAdmins("customer:created", {
      customer: {
        ...customer,
        _count: { properties: 0, users: 1 },
      },
    });

    // Return customer data in the format expected by frontend
    // Frontend expects response.data to be the Customer object directly
    return res.status(201).json({
      ...customer,
      owner: ownerUser,
      invoice,
      tempPassword: !sendInvitation ? tempPassword : undefined,
    });
  } catch (error: any) {
    console.error("Create customer error:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    return res.status(500).json({
      error: "Failed to create customer",
      details: error?.message || "Unknown error",
      code: error?.code || "UNKNOWN_ERROR"
    });
  }
});

// Update customer
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      company,
      owner,
      email,
      phone,
      website,
      taxId,
      industry,
      companySize,
      planId,
      plan: planName, // Accept plan name as well
      billingCycle,
      status,
      street,
      city,
      state,
      postalCode,
      country,
      propertyLimit,
      userLimit,
      storageLimit,
      properties, // Accept properties count
      units, // Accept units count
      notes, // Accept notes
      trialStartsAt, // Accept trial start date
      trialEndsAt, // Accept trial end date
    } = req.body;

    // Get existing customer first
    const existingCustomer = await prisma.customers.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get plan limits - lookup by planId or planName
    let finalPlanId = planId || existingCustomer.planId; // Use existing plan if not provided
    let plan = null;

    if (planName && !planId) {
      // Look up plan by name
      plan = await prisma.plans.findFirst({
        where: { name: planName },
      });
      if (plan) {
        finalPlanId = plan.id;
      }
    } else if (finalPlanId) {
      // Fetch plan for MRR calculation (either new plan or existing plan)
      plan = await prisma.plans.findUnique({
        where: { id: finalPlanId },
      });
    }

    // Calculate MRR based on plan and billing cycle
    let calculatedMRR = existingCustomer.mrr || 0; // Default to existing MRR
    const finalStatus = status || existingCustomer.status;
    const finalBillingCycle =
      billingCycle || existingCustomer.billingCycle || "monthly";

    if (plan && (finalStatus === "active" || finalStatus === "trial")) {
      if (finalBillingCycle === "monthly") {
        calculatedMRR = plan.monthlyPrice;
      } else if (finalBillingCycle === "annual") {
        calculatedMRR = plan.annualPrice / 12; // Convert annual to monthly
      }
    }

    // Determine plan category and limits based on plan (similar to create route)
    const planCategory = plan?.category || existingCustomer.planCategory || "property_management";
    const finalPropertyLimit =
      plan?.category === "property_management"
        ? propertyLimit !== undefined ? propertyLimit : (existingCustomer.propertyLimit || plan?.propertyLimit || 5)
        : 0; // Set to 0 for developers (they use projectLimit instead)
    const finalProjectLimit =
      plan?.category === "development"
        ? propertyLimit !== undefined ? propertyLimit : (existingCustomer.projectLimit || plan?.projectLimit || 3)
        : 0; // Set to 0 for property owners/managers

    // Handle subscription date changes based on status
    let subscriptionStartDate = existingCustomer.subscriptionStartDate;
    let finalTrialStartsAt = existingCustomer.trialStartsAt;
    let finalTrialEndsAt = existingCustomer.trialEndsAt;

    // If status is changing to 'active' and subscriptionStartDate is not set
    if (status === "active" && existingCustomer.status !== "active") {
      subscriptionStartDate = new Date(); // Set start date when activating
      finalTrialStartsAt = null; // Clear trial start date
      finalTrialEndsAt = null; // Clear trial end date
    }

    // If already active but subscriptionStartDate is null, set it now
    if (status === "active" && !subscriptionStartDate) {
      subscriptionStartDate = new Date(); // Fix missing subscription start date
    }

    // If status is 'trial', use provided dates or calculate defaults
    if (status === "trial") {
      // If admin explicitly provided trial dates, use them
      if (trialStartsAt) {
        finalTrialStartsAt = new Date(trialStartsAt);
      } else if (existingCustomer.status !== "trial") {
        // Status changing to trial without explicit start date
        finalTrialStartsAt = new Date();
      }

      if (trialEndsAt) {
        finalTrialEndsAt = new Date(trialEndsAt);
      } else if (existingCustomer.status !== "trial") {
        // Status changing to trial without explicit end date
        finalTrialEndsAt = await calculateTrialEndDate();
      }

      subscriptionStartDate = null; // Clear subscription start when in trial
    }

    const customer = await prisma.customers.update({
      where: { id },
      data: {
        company,
        owner,
        email,
        phone,
        website,
        taxId,
        industry,
        companySize,
        planId: finalPlanId,
        planCategory: planCategory, // Update plan category
        billingCycle,
        mrr: calculatedMRR, // Set calculated MRR
        status,
        subscriptionStartDate, // Update subscription date based on status
        trialStartsAt: finalTrialStartsAt, // Update trial start date
        trialEndsAt: finalTrialEndsAt, // Update trial end date based on status
        street,
        city,
        state,
        postalCode: postalCode || (req.body as any).zipCode || null,
        country,
        propertyLimit: finalPropertyLimit,
        projectLimit: finalProjectLimit, // Update project limit
        userLimit,
        storageLimit,
        propertiesCount: properties !== undefined ? properties : existingCustomer.propertiesCount, // Update properties count
        projectsCount: plan?.category === "development" && properties !== undefined ? properties : (existingCustomer.projectsCount || 0), // Update projects count
        unitsCount: units !== undefined ? units : existingCustomer.unitsCount, // Update units count
        notes: notes !== undefined ? notes : existingCustomer.notes, // Update notes field
      },
      include: {
        plans: true,
      },
    });

    // Also keep owner's user record in sync if name/email/phone changed
    try {
      if (owner || email || phone) {
        await prisma.users.updateMany({
          where: { customerId: id, role: "owner" },
          data: {
            ...(owner && { name: owner }),
            ...(email && { email }),
            ...(phone && { phone }),
          },
        });
      }
    } catch (syncError) {
      console.warn(
        "⚠️ Failed to sync owner user with customer changes:",
        syncError
      );
    }

    // Sync user activation status with customer status
    try {
      const userUpdateData: any = {};

      // If customer is active, ensure all users are active
      if (finalStatus === "active") {
        userUpdateData.isActive = true;
        userUpdateData.status = "active";
      }
      // If customer is suspended/cancelled, deactivate users
      else if (finalStatus === "suspended" || finalStatus === "cancelled") {
        userUpdateData.isActive = false;
        userUpdateData.status = finalStatus;
      }

      // Only update if there are changes
      if (Object.keys(userUpdateData).length > 0) {
        await prisma.users.updateMany({
          where: { customerId: id },
          data: {
            ...userUpdateData,
            updatedAt: new Date(),
          },
        });
        console.log(
          `✅ Synced user activation status with customer status: ${finalStatus}`
        );
      }
    } catch (syncError) {
      console.warn("⚠️ Failed to sync user activation status:", syncError);
    }

    // Log activity (don't fail customer update if logging fails)
    try {
      // Get customer's owner user for activity log
      const ownerUser = await prisma.users.findFirst({
        where: {
          customerId: customer.id,
          role: "owner",
        },
      });

      if (ownerUser) {
        await prisma.activity_logs.create({
          data: {
            customerId: customer.id,
            userId: ownerUser.id, // Use customer's owner ID
            action: "CUSTOMER_UPDATED",
            entity: "Customer",
            entityId: customer.id,
            description: `Customer ${company} updated by ${
              req.user?.email || "admin"
            }`,
          },
        });
      }
    } catch (logError: any) {
      console.error("Failed to log activity:", logError);
      // Continue anyway - don't fail customer update
    }

    // Emit real-time event to admins
    emitToAdmins("customer:updated", { customer });

    // Emit to customer's users (so owner sees changes immediately)
    emitToCustomer(customer.id, "account:updated", { customer });

    // Capture MRR snapshot if MRR, status, or plan changed
    if (
      existingCustomer.mrr !== customer.mrr ||
      existingCustomer.status !== customer.status ||
      existingCustomer.planId !== customer.planId
    ) {
      try {
        await captureSnapshotOnChange(customer.id);
      } catch (snapshotError) {
        console.error("Failed to capture MRR snapshot:", snapshotError);
        // Don't fail the request if snapshot fails
      }
    }

    return res.json(customer);
  } catch (error: any) {
    console.error("Update customer error:", error);
    return res.status(500).json({ error: "Failed to update customer" });
  }
});

// Reactivate customer account
router.post("/:id/reactivate", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { planId, notes } = req.body;

    // Get existing customer
    const existingCustomer = await prisma.customers.findUnique({
      where: { id },
      include: { plans: true },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get plan for MRR calculation
    const finalPlanId = planId || existingCustomer.planId;
    const plan = await prisma.plans.findUnique({
      where: { id: finalPlanId },
    });

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Calculate MRR based on billing cycle
    const billingCycle = existingCustomer.billingCycle || "monthly";
    const calculatedMRR =
      billingCycle === "monthly" ? plan.monthlyPrice : plan.annualPrice / 12;

    // Reactivate customer
    const updatedCustomer = await prisma.customers.update({
      where: { id },
      data: {
        status: "active",
        mrr: calculatedMRR,
        planId: finalPlanId,
        subscriptionStartDate: new Date(), // Reset subscription start date
        trialStartsAt: null, // Clear trial dates
        trialEndsAt: null,
        notes: notes
          ? `${
              existingCustomer.notes || ""
            }\n\nAccount reactivated on ${new Date().toISOString()}. ${notes}`
          : `${
              existingCustomer.notes || ""
            }\n\nAccount reactivated on ${new Date().toISOString()}.`,
        updatedAt: new Date(),
      },
      include: {
        plans: true,
        _count: {
          select: {
            properties: true,
            users: true,
          },
        },
      },
    });

    // Reactivate all users associated with this customer
    await prisma.users.updateMany({
      where: { customerId: id },
      data: {
        isActive: true,
        status: "active",
        updatedAt: new Date(),
      },
    });

    // Log activity
    try {
      await prisma.activity_logs.create({
        data: {
          id: randomUUID(),
          userId: req.user!.id,
          action: "customer_reactivated",
          entityType: "customer",
          entityId: id,
          details: {
            customerName: updatedCustomer.company,
            plan: plan.name,
            mrr: calculatedMRR,
            notes: notes || "Account reactivated by admin",
          },
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.headers["user-agent"] || null,
          createdAt: new Date(),
        },
      });
    } catch (logError: any) {
      console.error("Failed to log activity:", logError);
    }

    // Emit real-time events
    emitToAdmins("customer:reactivated", {
      customerId: updatedCustomer.id,
      customerName: updatedCustomer.company,
      plan: plan.name,
      mrr: calculatedMRR,
    });

    emitToCustomer(updatedCustomer.id, "account:reactivated", {
      message: "Your account has been reactivated. You now have full access.",
      plan: plan.name,
    });

    // Capture MRR snapshot
    try {
      await captureSnapshotOnChange(updatedCustomer.id);
    } catch (snapshotError) {
      console.error("Failed to capture MRR snapshot:", snapshotError);
    }

    return res.json({
      message: "Customer account reactivated successfully",
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error("Reactivate customer error:", error);
    return res.status(500).json({ error: "Failed to reactivate customer" });
  }
});

// Delete customer
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customers.findUnique({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get owner user BEFORE deleting (for activity log)
    const ownerUser = await prisma.users.findFirst({
      where: {
        customerId: id,
        role: "owner",
      },
    });

    // Log activity BEFORE deleting (so user references still exist)
    try {
      if (ownerUser) {
        await prisma.activity_logs.create({
          data: {
            customerId: id,
            userId: ownerUser.id, // Use customer's owner ID
            action: "CUSTOMER_DELETED",
            entity: "Customer",
            entityId: id,
            description: `Customer ${customer.company} deleted by ${
              req.user?.email || "admin"
            }`,
          },
        });
      }
    } catch (logError) {
      // If activity log fails, continue with deletion anyway
      console.error("Failed to create activity log:", logError);
    }

    // Now delete the customer (cascade will delete all related records)
    await prisma.customers.delete({ where: { id } });

    // Emit real-time event to admins
    emitToAdmins("customer:deleted", { customerId: id });

    return res.json({ message: "Customer deleted successfully" });
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return res.status(500).json({ error: "Failed to delete customer" });
  }
});

// Customer actions
router.post("/:id/action", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const customer = await prisma.customers.findUnique({ where: { id } });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    let result: any = {};

    switch (action) {
      case "suspend":
        result = await prisma.customer.update({
          where: { id },
          data: { status: "suspended" },
        });
        break;

      case "activate":
        result = await prisma.customer.update({
          where: { id },
          data: { status: "active" },
        });
        break;

      case "cancel":
        result = await prisma.customer.update({
          where: { id },
          data: { status: "cancelled" },
        });
        break;

      case "reset-password":
        // Find primary user (owner or developer)
        const primaryUser = await prisma.users.findFirst({
          where: {
            customerId: id,
            role: { in: ["owner", "developer"] },
          },
        });

        if (primaryUser) {
          // Generate new temporary password
          const newPassword =
            Math.random().toString(36).slice(-10) +
            Math.random().toString(36).slice(-2).toUpperCase();
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          // Update user password
          await prisma.users.update({
            where: { id: primaryUser.id },
            data: {
              password: hashedPassword,
              status: "active", // Set to active so they can log in
              updatedAt: new Date(),
            },
          });

          result = {
            message: "New password generated successfully",
            tempPassword: newPassword,
            email: primaryUser.email,
            name: primaryUser.name,
          };
        } else {
          return res
            .status(404)
            .json({ error: "Primary user not found for this customer" });
        }
        break;

      case "resend-invitation":
        // Find pending owner user
        const pendingOwner = await prisma.user.findFirst({
          where: { customerId: id, role: "owner", status: "pending" },
        });

        if (pendingOwner) {
          // TODO: Resend invitation email
          result = { message: "Invitation email resent" };
        }
        break;

      default:
        return res.status(400).json({ error: "Invalid action" });
    }

    // Log activity
    try {
      // Get customer's owner user for activity log
      const ownerUser = await prisma.user.findFirst({
        where: {
          customerId: id,
          role: "owner",
        },
      });

      if (ownerUser) {
        await prisma.activity_logs.create({
          data: {
            customerId: id,
            userId: ownerUser.id, // Use customer's owner ID
            action: action,
            entity: "customer",
            entityId: id,
            description: `Customer ${customer.company} ${action} by ${
              req.user?.email || "admin"
            }`,
          },
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
      // Continue anyway
    }

    return res.json(result);
  } catch (error: any) {
    console.error("Customer action error:", error);
    return res.status(500).json({ error: "Failed to perform action" });
  }
});

export default router;
