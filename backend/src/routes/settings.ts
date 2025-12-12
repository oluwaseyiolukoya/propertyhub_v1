import express, { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/db";
import { emitToCustomer } from "../lib/socket";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user settings (including permissions)
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    console.log("🔍 GET /settings called for user:", userId);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch user from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        baseCurrency: true,
        phone: true,
        department: true,
        company: true,
        isActive: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log(
      "✅ Settings retrieved for user:",
      userId,
      "Permissions:",
      user.permissions
    );

    return res.json({
      ...user,
      permissions: user.permissions || {},
    });
  } catch (error: any) {
    console.error("❌ Get settings error:", error);
    return res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update manager permissions (Owner only)
router.put("/manager-permissions", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Only owners can set manager permissions
    if (
      userRole !== "owner" &&
      userRole !== "property_owner" &&
      userRole !== "property owner"
    ) {
      return res
        .status(403)
        .json({ error: "Only property owners can set manager permissions" });
    }

    const {
      managerCanViewUnits,
      managerCanCreateUnits,
      managerCanEditUnits,
      managerCanDeleteUnits,
      managerCanViewProperties,
      managerCanEditProperty,
      managerCanViewTenants,
      managerCanCreateTenants,
      managerCanEditTenants,
      managerCanDeleteTenants,
      managerCanViewFinancials,
    } = req.body;

    console.log("💾 Received permissions update request:", {
      userId,
      userRole,
      body: req.body,
    });

    // Build permissions object
    const permissions = {
      // Units permissions
      managerCanViewUnits:
        managerCanViewUnits !== undefined ? managerCanViewUnits : true,
      managerCanCreateUnits:
        managerCanCreateUnits !== undefined ? managerCanCreateUnits : true,
      managerCanEditUnits:
        managerCanEditUnits !== undefined ? managerCanEditUnits : true,
      managerCanDeleteUnits:
        managerCanDeleteUnits !== undefined ? managerCanDeleteUnits : false,
      // Properties permissions
      managerCanViewProperties:
        managerCanViewProperties !== undefined
          ? managerCanViewProperties
          : true,
      managerCanEditProperty:
        managerCanEditProperty !== undefined ? managerCanEditProperty : false,
      // Tenants permissions
      managerCanViewTenants:
        managerCanViewTenants !== undefined ? managerCanViewTenants : true,
      managerCanCreateTenants:
        managerCanCreateTenants !== undefined ? managerCanCreateTenants : true,
      managerCanEditTenants:
        managerCanEditTenants !== undefined ? managerCanEditTenants : true,
      managerCanDeleteTenants:
        managerCanDeleteTenants !== undefined ? managerCanDeleteTenants : false,
      // Financial permissions
      managerCanViewFinancials:
        managerCanViewFinancials !== undefined
          ? managerCanViewFinancials
          : true,
    };

    console.log("📝 Built permissions object:", permissions);

    // Update user's permissions in database
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        permissions: permissions as any,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
      },
    });

    console.log(
      "✅ Manager permissions updated for user:",
      userId,
      "New permissions:",
      updatedUser.permissions
    );

    // Emit realtime event to all users under this customer (managers will react)
    try {
      const ownerRecord = await prisma.users.findUnique({
        where: { id: userId },
        select: { customerId: true },
      });
      if (ownerRecord?.customerId) {
        emitToCustomer(ownerRecord.customerId, "permissions:updated", {
          customerId: ownerRecord.customerId,
          permissions,
        });
        console.log(
          "📡 Emitted permissions:updated for customer:",
          ownerRecord.customerId
        );
      }
    } catch (e) {
      console.warn(
        "⚠️ Failed to emit permissions update event:",
        (e as any)?.message || e
      );
    }

    return res.json({
      message: "Manager permissions updated successfully",
      permissions: updatedUser.permissions,
    });
  } catch (error: any) {
    console.error("❌ Update manager permissions error:", error);
    return res
      .status(500)
      .json({ error: "Failed to update manager permissions" });
  }
});

// Update user profile settings
router.put("/profile", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name, phone, baseCurrency, department, company, bio } = req.body;

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (baseCurrency !== undefined) updateData.baseCurrency = baseCurrency;
    if (department !== undefined) updateData.department = department;
    if (company !== undefined) updateData.company = company;
    if (bio !== undefined) updateData.bio = bio;

    // Update user in database
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        baseCurrency: true,
        department: true,
        company: true,
        bio: true,
        permissions: true,
        isActive: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log("✅ Profile updated for user:", userId);

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("❌ Update profile error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

// Update customer/organization settings
router.put("/organization", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      company,
      phone,
      website,
      taxId,
      industry,
      companySize,
      street,
      city,
      state,
      postalCode,
      licenseNumber,
      organizationType,
    } = req.body;

    // Build update data
    const updateData: any = {};

    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;
    if (taxId !== undefined) updateData.taxId = taxId;
    if (industry !== undefined) updateData.industry = industry;
    if (companySize !== undefined) updateData.companySize = companySize;
    if (street !== undefined) updateData.street = street;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;

    // Store organization type in metadata if needed (for future use)
    if (organizationType !== undefined) {
      // Can be stored in a metadata field or separate table in the future
      console.log("Organization type:", organizationType);
    }

    // Update customer in database
    const updatedCustomer = await prisma.customers.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        company: true,
        email: true,
        phone: true,
        website: true,
        taxId: true,
        industry: true,
        companySize: true,
        street: true,
        city: true,
        state: true,
        postalCode: true,
        licenseNumber: true,
      },
    });

    console.log("✅ Organization updated for customer:", customerId);

    return res.json({
      message: "Organization details updated successfully",
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error("❌ Update organization error:", error);
    return res
      .status(500)
      .json({ error: "Failed to update organization details" });
  }
});

// Payment gateway settings (Owner-level)
// Get current customer's payment gateway config (paystack or monicredit)
router.get("/payment-gateway", async (req: AuthRequest, res: Response) => {
  try {
    // Guard: ensure real DB with payment_settings table
    const hasPaymentSettings = (prisma as any)?.payment_settings?.findFirst;
    if (!hasPaymentSettings) {
      return res.status(503).json({
        error:
          "Database not configured for payment settings. Set DATABASE_URL and run Prisma migrations.",
        action:
          "Create backend/.env with DATABASE_URL, then: cd backend && npx prisma generate && npx prisma migrate dev",
      });
    }

    const userId = req.user?.id;
    const role = (req.user?.role || "").toLowerCase();
    const customerId = req.user?.customerId;
    const provider = (req.query.provider as string) || "paystack"; // Default to paystack for backward compatibility

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
      ![
        "owner",
        "property_owner",
        "property owner",
        "admin",
        "super_admin",
      ].includes(role)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!["paystack", "monicredit"].includes(provider.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "Invalid provider. Supported: paystack, monicredit" });
    }

    const settings = await prisma.payment_settings.findFirst({
      where: { customerId, provider: provider.toLowerCase() },
    });

    // Never return secret/private key to clients; indicate if it's configured
    if (settings) {
      const { secretKey, ...safe } = settings as any;
      // For Paystack, use secretKey; for Monicredit, use privateKey (stored in secretKey field)
      const response: any = {
        ...safe,
        secretConfigured:
          provider.toLowerCase() === "paystack" ? !!secretKey : undefined,
        privateKeyConfigured:
          provider.toLowerCase() === "monicredit" ? !!secretKey : undefined,
      };

      // Include verify token and merchantId in metadata for Monicredit (safe to expose)
      if (provider.toLowerCase() === "monicredit" && safe.metadata) {
        const metadata = safe.metadata as any;
        if (metadata.verifyToken) {
          response.verifyToken = metadata.verifyToken;
        }
        if (metadata.merchantId) {
          response.merchantId = metadata.merchantId;
        }
      }

      return res.json(response);
    }
    return res.json(null);
  } catch (error: any) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      console.error(
        "❌ Payment settings table missing or out of date:",
        error?.meta || error
      );
      return res.status(503).json({
        error:
          "Database not migrated for payment settings. Please run prisma migrate.",
        action: "Execute: cd backend && npx prisma migrate dev",
      });
    }
    console.error("❌ Get payment gateway settings error:", error);
    return res.status(500).json({
      error: "Failed to fetch payment gateway settings",
      details: error?.message || String(error),
    });
  }
});

// Public (read-only) payment gateway settings for tenant/manager visibility
// Returns only non-sensitive fields like isEnabled and bankTransferTemplate
router.get(
  "/payment-gateway/public",
  async (req: AuthRequest, res: Response) => {
    try {
      const hasPaymentSettings = (prisma as any)?.payment_settings?.findFirst;
      if (!hasPaymentSettings) {
        return res.status(503).json({
          error:
            "Database not configured for payment settings. Please run Prisma migrations.",
        });
      }

      const userId = req.user?.id;
      const role = (req.user?.role || "").toLowerCase();
      const customerId = req.user?.customerId;
      const provider = (req.query.provider as string) || "paystack"; // Default to paystack for backward compatibility

      if (!userId || !customerId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Allow all customer users (owner, manager, tenant) to read non-sensitive settings
      if (
        ![
          "owner",
          "property_owner",
          "property owner",
          "manager",
          "tenant",
          "admin",
          "super_admin",
        ].includes(role)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!["paystack", "monicredit"].includes(provider.toLowerCase())) {
        return res
          .status(400)
          .json({ error: "Invalid provider. Supported: paystack, monicredit" });
      }

      const settings = await prisma.payment_settings.findFirst({
        where: { customerId, provider: provider.toLowerCase() },
        select: {
          isEnabled: true,
          testMode: true,
          bankTransferTemplate: true, // Only relevant for Paystack
          updatedAt: true,
        },
      });

      return res.json(settings || null);
    } catch (error: any) {
      if (error?.code === "P2021" || error?.code === "P2022") {
        return res.status(503).json({
          error:
            "Database not migrated for payment settings. Please run prisma migrate.",
        });
      }
      console.error("❌ Get public payment settings error:", error);
      return res.status(500).json({
        error: "Failed to fetch payment settings",
        details: error?.message || String(error),
      });
    }
  }
);

// Save/Update payment gateway config (paystack or monicredit)
router.put("/payment-gateway", async (req: AuthRequest, res: Response) => {
  try {
    // Guard: ensure real DB with payment_settings table
    const hasPaymentSettings = (prisma as any)?.payment_settings?.upsert;
    if (!hasPaymentSettings) {
      return res.status(503).json({
        error:
          "Database not configured for payment settings. Set DATABASE_URL and run Prisma migrations.",
        action:
          "Create backend/.env with DATABASE_URL, then: cd backend && npx prisma generate && npx prisma migrate dev",
      });
    }

    const userId = req.user?.id;
    const role = (req.user?.role || "").toLowerCase();
    const customerId = req.user?.customerId;
    const provider = (req.query.provider as string) || "paystack"; // Default to paystack for backward compatibility

    if (!userId || !customerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (
      ![
        "owner",
        "property_owner",
        "property owner",
        "admin",
        "super_admin",
      ].includes(role)
    ) {
      return res
        .status(403)
        .json({ error: "Only owner or admin can configure payment gateway" });
    }

    if (!["paystack", "monicredit"].includes(provider.toLowerCase())) {
      return res
        .status(400)
        .json({ error: "Invalid provider. Supported: paystack, monicredit" });
    }

    const {
      publicKey,
      secretKey,
      privateKey,
      merchantId,
      testMode,
      isEnabled,
      bankTransferTemplate,
    } = req.body || {};

    // For Monicredit, privateKey is used; for Paystack, secretKey is used
    // Both are stored in the secretKey field in the database
    const keyToStore =
      provider.toLowerCase() === "monicredit" ? privateKey : secretKey;
    const keyFieldName =
      provider.toLowerCase() === "monicredit" ? "privateKey" : "secretKey";

    // Check if a record exists for this customer/provider
    const existing = await prisma.payment_settings.findFirst({
      where: { customerId, provider: provider.toLowerCase() },
    });

    // If no existing config and keys are missing, block creation
    if (!existing && (!publicKey || !keyToStore)) {
      return res.status(400).json({
        error: `Public key and ${keyFieldName} are required to create ${
          provider === "paystack" ? "Paystack" : "Monicredit"
        } configuration`,
      });
    }

    // For Monicredit, generate/ensure verify token exists in metadata and store merchantId
    let metadata: any = {};
    if (provider.toLowerCase() === "monicredit") {
      // Get existing settings to preserve metadata
      const existingSettings = await prisma.payment_settings.findFirst({
        where: { customerId, provider: provider.toLowerCase() },
      });

      if (existingSettings?.metadata) {
        metadata = existingSettings.metadata as any;
      }

      // Generate verify token if it doesn't exist
      if (!metadata.verifyToken) {
        const crypto = require("crypto");
        metadata.verifyToken = crypto.randomBytes(32).toString("hex");
      }

      // Store merchantId in metadata if provided
      if (merchantId !== undefined) {
        metadata.merchantId = merchantId;
      }
    }

    // Build partial update payload; do not overwrite keys unless provided
    const updateData: any = { updatedAt: new Date() };
    if (publicKey !== undefined) updateData.publicKey = publicKey;
    if (keyToStore !== undefined) updateData.secretKey = keyToStore; // Store in secretKey field for both
    if (testMode !== undefined) updateData.testMode = !!testMode;
    if (isEnabled !== undefined) updateData.isEnabled = !!isEnabled;
    // bankTransferTemplate is only for Paystack
    if (
      provider.toLowerCase() === "paystack" &&
      bankTransferTemplate !== undefined
    ) {
      updateData.bankTransferTemplate = bankTransferTemplate;
    }
    // metadata for Monicredit (verify token)
    if (
      provider.toLowerCase() === "monicredit" &&
      Object.keys(metadata).length > 0
    ) {
      updateData.metadata = metadata;
    }

    const upserted = await prisma.payment_settings.upsert({
      where: {
        customerId_provider: {
          customerId,
          provider: provider.toLowerCase(),
        },
      },
      create: {
        id: uuidv4(),
        customerId,
        provider: provider.toLowerCase(),
        publicKey: publicKey!,
        secretKey: keyToStore!, // Store privateKey for Monicredit or secretKey for Paystack
        testMode: !!testMode,
        isEnabled: !!isEnabled,
        bankTransferTemplate:
          provider.toLowerCase() === "paystack"
            ? bankTransferTemplate || null
            : null,
        metadata: provider.toLowerCase() === "monicredit" ? metadata : null,
        updatedAt: new Date(),
      },
      update: {
        ...updateData,
      },
    });

    const { secretKey: _, ...safe } = upserted as any;
    return res.json({ message: "Payment gateway updated", settings: safe });
  } catch (error: any) {
    if (error?.code === "P2021" || error?.code === "P2022") {
      console.error(
        "❌ Payment settings table missing or out of date:",
        error?.meta || error
      );
      return res.status(503).json({
        error:
          "Database not migrated for payment settings. Please run prisma migrate.",
        action: "Execute: cd backend && npx prisma migrate dev",
      });
    }
    console.error("❌ Update payment gateway settings error:", error);
    return res.status(500).json({
      error: "Failed to update payment gateway settings",
      details: error?.message || String(error),
    });
  }
});

export default router;
