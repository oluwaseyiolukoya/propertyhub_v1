import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import prisma from "../lib/db";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { emitToCustomer } from "../lib/socket";

const router = express.Router();

interface TwoFactorResult {
  success: boolean;
  status?: number;
  error?: string;
  code?: string;
}

const verifyTwoFactorForUser = (
  user: any,
  providedCode?: string
): TwoFactorResult => {
  console.log("🔐 verifyTwoFactorForUser called:", {
    email: user?.email,
    twoFactorEnabled: user?.twoFactorEnabled,
    hasTwoFactorSecret: !!user?.twoFactorSecret,
    providedCode: providedCode ? "***" : "none",
  });
  if (!user?.twoFactorEnabled) {
    return { success: true };
  }

  if (!user.twoFactorSecret) {
    console.error(
      "🚨 Two-factor is enabled but no secret is stored for user:",
      user.email
    );
    return {
      success: false,
      status: 500,
      error:
        "Two-factor authentication is misconfigured. Please contact support.",
      code: "TWO_FACTOR_MISCONFIGURED",
    };
  }

  if (!providedCode) {
    return {
      success: false,
      status: 401,
      error: "Two-factor authentication code required",
      code: "TWO_FACTOR_CODE_REQUIRED",
    };
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token: providedCode,
    window: 1,
  });

  if (!verified) {
    return {
      success: false,
      status: 401,
      error: "Invalid two-factor authentication code",
      code: "INVALID_TWO_FACTOR_CODE",
    };
  }

  return { success: true };
};

// Helper function to parse User-Agent
const parseUserAgent = (userAgent: string) => {
  const ua = userAgent || "";
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = "Desktop";

  // Detect browser
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    os = "iOS";

  // Detect device type
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone"))
    device = "Mobile";
  else if (ua.includes("iPad") || ua.includes("Tablet")) device = "Tablet";

  return { browser, os, device };
};

// Helper function to create session
const createSession = async (userId: string, token: string, req: Request) => {
  const userAgent = req.headers["user-agent"] || "";
  const { browser, os, device } = parseUserAgent(userAgent);
  const ipAddress = req.ip || req.socket.remoteAddress || "Unknown";

  try {
    await prisma.sessions.create({
      data: {
        userId,
        token,
        device,
        browser,
        os,
        ipAddress,
        userAgent,
        location: "Unknown", // In production, use IP geolocation service
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
    console.log(
      `✅ Session created for user ${userId} from ${device} (${browser} on ${os})`
    );
  } catch (error) {
    console.error("Failed to create session:", error);
    // Don't fail login if session creation fails
  }
};

// Login - DATABASE ONLY (No mock authentication)
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password, userType, twoFactorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Database authentication ONLY
    try {
      // AUTO-DETECTION: When userType is not provided, check all tables automatically
      // All users (including internal admins) are stored in the 'users' table
      // Internal admins have customerId = null
      if (!userType || userType === "admin") {
        console.log("🔍 Admin login attempt:", {
          email,
          userType: userType || "auto-detect",
        });

        // Check Internal Admin Users (customerId = null) in users table
        console.log("🔍 Checking users table for internal admin...");
        const internalUser = await prisma.users.findUnique({
          where: { email },
        });
        console.log(
          "🔍 Internal Admin User found:",
          internalUser ? `Yes (${internalUser.email})` : "No"
        );

        if (internalUser && internalUser.customerId === null) {
          const isValidPassword = await bcrypt.compare(
            password,
            internalUser.password
          );
          console.log("🔍 Internal Admin password valid:", isValidPassword);

          if (!isValidPassword) {
            console.log("❌ Invalid password for Internal Admin User");
            return res.status(401).json({ error: "Invalid credentials" });
          }

          const adminTwoFactorCheck = verifyTwoFactorForUser(
            internalUser,
            twoFactorCode
          );
          if (!adminTwoFactorCheck.success) {
            return res.status(adminTwoFactorCheck.status || 401).json({
              error: adminTwoFactorCheck.error,
              code: adminTwoFactorCheck.code,
            });
          }

          // Block inactive or non-active internal admin users
          if (
            internalUser.isActive === false ||
            (internalUser.status && internalUser.status !== "active")
          ) {
            console.log("❌ Internal Admin account inactive");
            return res.status(403).json({ error: "Account is inactive" });
          }

          // Update last login
          await prisma.users.update({
            where: { id: internalUser.id },
            data: { lastLogin: new Date() },
          });

          // Resolve effective permissions: prefer user's stored permissions; fallback to role's permissions
          let userPermissions: string[] = [];
          if (
            Array.isArray(internalUser.permissions) &&
            (internalUser.permissions as any[]).length > 0
          ) {
            userPermissions = internalUser.permissions as string[];
          } else {
            try {
              const roleRecord = await prisma.roles.findUnique({
                where: { name: internalUser.role },
              });
              if (
                roleRecord &&
                Array.isArray(roleRecord.permissions as any[])
              ) {
                userPermissions = roleRecord.permissions as string[];
              }
            } catch (e) {
              console.warn(
                "⚠️ Could not fetch role permissions for",
                internalUser.role,
                e
              );
            }
          }

          const token = (jwt as any).sign(
            {
              id: internalUser.id,
              email: internalUser.email,
              role: internalUser.role,
            },
            process.env.JWT_SECRET || "secret",
            { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
          );

          // Create session
          await createSession(internalUser.id, token, req);

          console.log(
            "✅ Internal Admin User login successful with permissions:",
            userPermissions.length
          );
          return res.json({
            token,
            user: {
              id: internalUser.id,
              email: internalUser.email,
              name: internalUser.name,
              role: internalUser.role,
              permissions: userPermissions,
              rolePermissions: userPermissions, // Also include as rolePermissions for compatibility
              userType: "admin",
            },
          });
        }

        // Do not fail early - fall through to customer user auth
        // This enables auto-detection when userType is not provided
        if (userType === "admin") {
          console.log("ℹ️ Admin not found; falling back to customer user auth");
        } else if (!userType) {
          console.log(
            "ℹ️ Auto-detection: Admin not found; checking customer users"
          );
        }
      }

      // CUSTOMER USERS (owner, manager, tenant, developer)
      // Role is auto-detected from the database user.role field
      const user = await prisma.users.findUnique({
        where: { email },
        include: { customers: true },
      });

      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const customerTwoFactorCheck = verifyTwoFactorForUser(
        user,
        twoFactorCode
      );
      if (!customerTwoFactorCheck.success) {
        return res.status(customerTwoFactorCheck.status || 401).json({
          error: customerTwoFactorCheck.error,
          code: customerTwoFactorCheck.code,
        });
      }

      // Block inactive customer users
      if (user.isActive === false) {
        console.log("❌ Login blocked - User inactive:", {
          email: user.email,
          isActive: user.isActive,
          status: user.status,
          customerId: user.customerId,
        });
        return res.status(403).json({
          error:
            "Your account has been deactivated. Please contact your administrator.",
          details: {
            isActive: user.isActive,
            status: user.status,
          },
        });
      }

      // Load team member record if applicable (used for status checks & permissions)
      let teamMemberRecord: any = null;
      if (user.customerId) {
        try {
          teamMemberRecord = await prisma.team_members.findFirst({
            where: {
              user_id: user.id,
              customer_id: user.customerId,
            },
            include: {
              role: true,
            },
          });
          console.log(
            "🔍 Team member lookup result:",
            teamMemberRecord
              ? {
                  id: teamMemberRecord.id,
                  status: teamMemberRecord.status,
                  role: teamMemberRecord.role?.name,
                }
              : "Not found"
          );
        } catch (teamErr) {
          console.warn(
            "⚠️ Failed to load team member record during login:",
            teamErr
          );
        }
      }

      // Block login if team member status is inactive/suspended/banned
      if (
        teamMemberRecord &&
        teamMemberRecord.status &&
        ["inactive", "suspended", "banned"].includes(
          teamMemberRecord.status.toLowerCase()
        )
      ) {
        console.log("❌ Login blocked - Team member inactive:", {
          email: user.email,
          status: teamMemberRecord.status,
          customerId: user.customerId,
        });
        return res.status(403).json({
          error:
            "Your team access has been disabled. Please contact your administrator.",
          details: {
            teamMemberStatus: teamMemberRecord.status,
          },
        });
      }

      // Allow 'invited' users to login (they'll be prompted to change password)
      // Only block if status is explicitly 'inactive' or 'suspended'
      if (
        user.status &&
        ["inactive", "suspended", "banned"].includes(user.status.toLowerCase())
      ) {
        console.log("❌ Login blocked - User status not allowed:", {
          email: user.email,
          status: user.status,
          customerId: user.customerId,
        });
        return res.status(403).json({
          error:
            "Your account has been deactivated. Please contact your administrator.",
          details: {
            status: user.status,
          },
        });
      }

      // If user is 'invited', activate them on first successful login
      if (user.status === "invited") {
        console.log("✅ Activating invited user on first login:", user.email);
        await prisma.users.update({
          where: { id: user.id },
          data: {
            status: "active",
            acceptedAt: new Date(),
          },
        });

        // Also update team_members status if this user is a team member
        if (user.customerId) {
          try {
            if (!teamMemberRecord) {
              teamMemberRecord = await prisma.team_members.findFirst({
                where: {
                  user_id: user.id,
                  customer_id: user.customerId,
                },
              });
            }

            if (teamMemberRecord) {
              await prisma.team_members.update({
                where: { id: teamMemberRecord.id },
                data: {
                  status: "active",
                  joined_at: new Date(),
                },
              });
              teamMemberRecord.status = "active";
              console.log(
                "✅ Team member status updated to active:",
                user.email
              );
            }
          } catch (e) {
            console.warn("⚠️ Failed to update team_members status:", e);
          }
        }
      }

      // Update last login
      await prisma.users.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Derive userType from database, not from request
      // Internal admins are handled above; here customerId is not null
      const roleLower = (user.role || "").toLowerCase();
      const derivedUserType =
        roleLower === "owner" || roleLower === "property-owner"
          ? "owner"
          : roleLower === "manager" || roleLower === "property-manager"
          ? "manager"
          : roleLower === "tenant"
          ? "tenant"
          : roleLower === "developer" || roleLower === "property-developer"
          ? "developer"
          : "owner"; // default to owner for customer users

      const token = (jwt as any).sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          customerId: user.customerId,
        },
        process.env.JWT_SECRET || "secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );

      // Create session
      await createSession(user.id, token, req);

      // Determine permissions based on user type
      let permissions = user.permissions || {};
      let teamMemberRole = null;

      // Check if this user is a team member
      if (user.customerId) {
        try {
          if (!teamMemberRecord) {
            teamMemberRecord = await prisma.team_members.findFirst({
              where: {
                user_id: user.id,
                customer_id: user.customerId,
              },
              include: {
                role: true,
              },
            });
          }

          if (teamMemberRecord) {
            // Team member: use role-based permissions
            console.log(
              "✅ User is a team member, applying role-based permissions:",
              user.email
            );
            teamMemberRole = teamMemberRecord.role;

            // Build permissions from role + individual overrides
            permissions = {
              // From role
              ...(teamMemberRecord.role?.permissions || {}),
              // Individual overrides from team_members table
              canApproveInvoices:
                teamMemberRecord.can_approve_invoices ??
                teamMemberRecord.role?.can_approve_invoices,
              approvalLimit:
                teamMemberRecord.approval_limit ??
                teamMemberRecord.role?.approval_limit,
              canCreateInvoices:
                teamMemberRecord.can_create_invoices ??
                teamMemberRecord.role?.can_create_invoices,
              canManageProjects:
                teamMemberRecord.can_manage_projects ??
                teamMemberRecord.role?.can_manage_projects,
              canViewReports:
                teamMemberRecord.can_view_reports ??
                teamMemberRecord.role?.can_view_reports,
            };

            console.log("📋 Team member permissions:", permissions);
          } else if (derivedUserType === "manager") {
            // For managers (not team members), fetch owner's permissions
            const owner = await prisma.users.findFirst({
              where: {
                customerId: user.customerId,
                role: { in: ["owner", "property_owner", "property owner"] },
              },
              select: {
                permissions: true,
              },
            });

            if (owner && owner.permissions) {
              permissions = owner.permissions;
              console.log(
                "✅ Applied owner permissions to manager:",
                user.email
              );
            }
          }
        } catch (e) {
          console.warn(
            "⚠️ Failed to fetch team member/manager permissions:",
            e
          );
        }
      }

      // Determine if user is the actual account owner
      // Owner is: user whose email matches customer.email OR user with no team_members record
      let isOwnerUser = false;
      try {
        if (user.customerId) {
          // Check if user's email matches customer's email (customer.email is typically the owner's email)
          const customer = await prisma.customers.findUnique({
            where: { id: user.customerId },
            select: { email: true },
          });

          if (customer) {
            // If user email matches customer email, they're the owner
            if (customer.email.toLowerCase() === user.email.toLowerCase()) {
              isOwnerUser = true;
              console.log(
                "✅ User is owner (email matches customer email):",
                user.email
              );
            } else {
              // Check if user has a team_members record - if not, they're the original owner
              const membership = await prisma.team_members.findFirst({
                where: { user_id: user.id, customer_id: user.customerId },
              });
              isOwnerUser = !membership; // No team membership = original owner
              if (isOwnerUser) {
                console.log(
                  "✅ User is owner (no team membership):",
                  user.email
                );
              } else {
                console.log(
                  "❌ User is team member (has team membership):",
                  user.email
                );
              }
            }
          } else {
            // Fallback: if no customer found, check team membership
            const membership = await prisma.team_members.findFirst({
              where: { user_id: user.id, customer_id: user.customerId },
            });
            isOwnerUser = !membership;
          }
        } else {
          isOwnerUser = false; // No customerId = not a customer user
        }
      } catch (ownerCheckErr) {
        console.warn(
          "⚠️ Failed to determine owner status on /login:",
          ownerCheckErr
        );
        // Fallback: assume owner if error (safer default)
        isOwnerUser = user.customerId ? true : false;
      }

      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          userType: derivedUserType,
          customerId: user.customerId,
          customer: user.customers,
          permissions: permissions,
          teamMemberRole: teamMemberRole
            ? {
                id: teamMemberRole.id,
                name: teamMemberRole.name,
                description: teamMemberRole.description,
              }
            : null,
          isOwner: isOwnerUser,
          mustChangePassword: user.must_change_password || false,
          isTempPassword: user.is_temp_password || false,
        },
      });
    } catch (dbError: any) {
      // Database error - log and return generic error
      console.error("❌ Database authentication error:", {
        message: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
        stack: dbError?.stack,
      });
      return res.status(500).json({
        error: "Authentication service unavailable. Please try again later.",
        details: dbError?.message || "Unknown error",
        code: dbError?.code || "UNKNOWN_ERROR",
      });
    }
  } catch (error: any) {
    console.error("❌ Login error:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });
    return res.status(500).json({
      error: "Login failed",
      details: error?.message || "Unknown error",
      code: error?.code || "UNKNOWN_ERROR",
    });
  }
});

// Setup password (for new users via invitation)
router.post("/setup-password", async (req: Request, res: Response) => {
  try {
    const { email, password, token } = req.body;

    if (!email || !password || !token) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify invitation token (simplified for now)
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.password) {
      return res.status(400).json({ error: "Password already set" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: "active",
        acceptedAt: new Date(),
      },
    });

    return res.json({ message: "Password set successfully" });
  } catch (error: any) {
    console.error("Setup password error:", error);
    return res.status(500).json({ error: "Failed to setup password" });
  }
});

// Verify token
router.get("/verify", async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret"
    ) as any;

    return res.json({ valid: true, user: decoded });
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

// Validate session - check if user's account is still valid and role hasn't changed
router.get(
  "/validate-session",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      // Prevent any caching for session validation
      res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      const tokenUser = req.user;

      if (!tokenUser) {
        return res.status(401).json({
          valid: false,
          reason: "Not authenticated",
          forceLogout: true,
        });
      }

      // Check Users table (all users including internal admins are stored here)
      const dbUser = await prisma.users.findUnique({
        where: { id: tokenUser.id },
        select: {
          role: true,
          isActive: true,
          status: true,
          customerId: true,
          // User-level KYC fields (for tenants)
          requiresKyc: true,
          kycStatus: true,
        },
      });

      if (!dbUser) {
        return res.status(401).json({
          valid: false,
          reason: "User not found",
          forceLogout: true,
        });
      }

      // Internal admin user (customerId is null)
      if (dbUser.customerId === null) {
        if (!dbUser.isActive) {
          return res.status(403).json({
            valid: false,
            reason: "Your account has been deactivated",
            forceLogout: true,
          });
        }
        // Internal admins: treat as valid if active (no role/permissions compare)
        return res.json({ valid: true });
      }

      // Customer user (owner/manager/tenant)
      if (!dbUser.isActive || dbUser.status !== "active") {
        return res.status(403).json({
          valid: false,
          reason: "Your account has been deactivated",
          forceLogout: true,
        });
      }

      // Check role mismatch for customer users only
      if (dbUser.role !== tokenUser.role) {
        console.log(
          `⚠️ Role mismatch for user ${tokenUser.id}: Token=${tokenUser.role}, DB=${dbUser.role}`
        );
        return res.status(403).json({
          valid: false,
          reason: `Your role has been changed to ${dbUser.role}. Please log in again.`,
          forceLogout: true,
        });
      }

      // Check KYC status for customer users
      const isTenant = dbUser.role?.toLowerCase() === "tenant";

      if (isTenant) {
        // Tenant KYC is at user level
        const needsKyc =
          dbUser.requiresKyc &&
          dbUser.kycStatus !== "verified" &&
          dbUser.kycStatus !== "manually_verified" &&
          dbUser.kycStatus !== "owner_approved";

        if (needsKyc) {
          console.log(
            `🔐 Tenant ${tokenUser.id} requires KYC verification. Status: ${dbUser.kycStatus}`
          );
          return res.json({
            valid: true,
            requiresKyc: true,
            kycStatus: dbUser.kycStatus,
          });
        }
      } else {
        // Non-tenant KYC is at customer level
        const customer = await prisma.customers.findUnique({
          where: { id: dbUser.customerId },
          select: {
            requiresKyc: true,
            kycStatus: true,
          },
        });

        if (customer) {
          const needsKyc =
            customer.requiresKyc &&
            customer.kycStatus !== "verified" &&
            customer.kycStatus !== "manually_verified";

          if (needsKyc) {
            console.log(
              `🔐 Customer ${dbUser.customerId} requires KYC verification. Status: ${customer.kycStatus}`
            );
            return res.json({
              valid: true,
              requiresKyc: true,
              kycStatus: customer.kycStatus,
            });
          }
        }
      }

      return res.json({ valid: true });
    } catch (error: any) {
      console.error("Session validation error:", error);
      console.error("Session validation error stack:", error.stack);
      // Check if response has already been sent
      if (!res.headersSent) {
        return res.status(500).json({
          error: "Failed to validate session",
          message:
            process.env.NODE_ENV === "development"
              ? error.message
              : "An error occurred while validating your session",
        });
      }
    }
  }
);

// Get current user's account/customer info (for owners/managers to see updated limits and plan)
router.get(
  "/account",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch user with customer details (internal admin users and customer users)
      const user = await prisma.users.findUnique({
        where: { id: userId },
        include: {
          customers: {
            include: {
              plans: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Handle internal admin users (customerId = null)
      // Internal admin roles: super_admin, admin, support, finance, operations
      if (!user.customerId) {
        const isInternalAdmin = [
          "super_admin",
          "admin",
          "support",
          "finance",
          "operations",
        ].includes(user.role?.toLowerCase() || "");
        return res.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.isActive ? "active" : "inactive",
            userType: isInternalAdmin ? "admin" : user.role,
          },
          customer: null,
          isOwner: false,
          permissions: user.permissions || {},
        });
      }

      // Return relevant account information for customer users
      const customer = (user as any).customers || null;
      const plan = customer?.plans || null;

      // Derive userType from role (same logic as login)
      const roleLower = (user.role || "").toLowerCase();
      const derivedUserType =
        roleLower === "owner" ||
        roleLower === "property-owner" ||
        roleLower === "property owner"
          ? "owner"
          : roleLower === "manager" ||
            roleLower === "property-manager" ||
            roleLower === "property manager"
          ? "manager"
          : roleLower === "tenant"
          ? "tenant"
          : roleLower === "developer" || roleLower === "property-developer"
          ? "developer"
          : user.customerId
          ? "owner"
          : "admin"; // default to owner for customer users, admin for internal

      // Compute permissions based on user type
      let effectivePermissions: any = user.permissions || {};
      let teamMemberRole = null;
      let isOwnerUser = false;

      // Determine owner status: Owner = user whose email matches customer.email OR no team_members record
      if (user.customerId) {
        try {
          // First, check if user email matches customer email (definitive owner check)
          const customer = await prisma.customers.findUnique({
            where: { id: user.customerId },
            select: { email: true },
          });

          console.log("🔍 [/account] Owner check for:", {
            userEmail: user.email,
            customerEmail: customer?.email,
            customerId: user.customerId,
          });

          if (
            customer &&
            customer.email.toLowerCase() === user.email.toLowerCase()
          ) {
            // User email matches customer email = DEFINITIVE OWNER
            isOwnerUser = true;
            console.log(
              "✅ [/account] User is owner (email matches customer email):",
              user.email
            );
          } else {
            // Check if user has a team_members record
            const teamMember = await prisma.team_members.findFirst({
              where: {
                user_id: user.id,
                customer_id: user.customerId,
              },
              include: {
                role: true,
              },
            });

            console.log("🔍 [/account] Team member check:", {
              userEmail: user.email,
              hasTeamMember: !!teamMember,
              teamMemberId: teamMember?.id,
            });

            if (teamMember) {
              // Has team_members record = NOT owner (team member)
              isOwnerUser = false;
              console.log(
                "❌ [/account] User is team member (NOT OWNER):",
                user.email
              );

              // Team member: use role-based permissions
              teamMemberRole = teamMember.role;
              effectivePermissions = {
                // From role
                ...(teamMember.role?.permissions || {}),
                // Individual overrides from team_members table
                canApproveInvoices:
                  teamMember.can_approve_invoices ??
                  teamMember.role?.can_approve_invoices,
                approvalLimit:
                  teamMember.approval_limit ?? teamMember.role?.approval_limit,
                canCreateInvoices:
                  teamMember.can_create_invoices ??
                  teamMember.role?.can_create_invoices,
                canManageProjects:
                  teamMember.can_manage_projects ??
                  teamMember.role?.can_manage_projects,
                canViewReports:
                  teamMember.can_view_reports ??
                  teamMember.role?.can_view_reports,
              };
            } else {
              // No team_members record = ORIGINAL OWNER (account creator)
              isOwnerUser = true;
              console.log(
                "✅ [/account] User is owner (no team membership):",
                user.email
              );

              // For managers (not team members), fetch owner's permissions if needed
              if (derivedUserType === "manager") {
                const owner = await prisma.users.findFirst({
                  where: {
                    customerId: user.customerId,
                    role: { in: ["owner", "property_owner", "property owner"] },
                  },
                  select: { permissions: true },
                });
                if (owner?.permissions) {
                  effectivePermissions = owner.permissions;
                }
              }
            }
          }
        } catch (e) {
          console.warn(
            "⚠️ Could not compute team member/owner status on /account:",
            e
          );
          // Fallback: assume owner if error (safer default for account access)
          isOwnerUser = user.customerId ? true : false;
        }
      }

      // Get actual usage counts
      let actualPropertiesCount = customer?.propertiesCount || 0;
      let actualUnitsCount = customer?.unitsCount || 0;
      let actualManagersCount = 0;

      // Only count properties/units/managers for non-developer users
      if (user.customerId && derivedUserType !== "developer") {
        try {
          // Get actual counts from database
          const [properties, units, managers] = await Promise.all([
            prisma.properties.count({ where: { customerId: user.customerId } }),
            prisma.units.count({
              where: {
                properties: { customerId: user.customerId },
              },
            }),
            prisma.users.count({
              where: {
                customerId: user.customerId,
                role: {
                  in: ["manager", "property_manager", "property-manager"],
                },
                isActive: true,
              },
            }),
          ]);

          actualPropertiesCount = properties;
          actualUnitsCount = units;
          actualManagersCount = managers;
        } catch (error) {
          console.warn(
            "⚠️ Error counting properties/units/managers for customer:",
            error
          );
          // Continue with default values if counting fails
        }
      }

      console.log("📤 [/account] Sending response:", {
        userEmail: user.email,
        isOwner: isOwnerUser,
        teamMemberRole: teamMemberRole?.name,
      });

      // For tenants, KYC is at user level. For others, it's at customer level.
      const isTenant = user.role?.toLowerCase() === "tenant";
      const userKycData = isTenant
        ? {
            requiresKyc: (user as any).requiresKyc || false,
            kycStatus: (user as any).kycStatus || "pending",
            kycVerificationId: (user as any).kycVerificationId,
            kycCompletedAt: (user as any).kycCompletedAt,
            kycFailureReason: (user as any).kycFailureReason,
            kycLastAttemptAt: (user as any).kycLastAttemptAt,
          }
        : {};

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          phone: user.phone,
          department: user.department,
          company: user.company,
          baseCurrency: user.baseCurrency || "USD",
          bio: user.bio,
          customerId: user.customerId,
          userType: derivedUserType,
          permissions: effectivePermissions,
          isOwner: isOwnerUser,
          teamMemberRole: teamMemberRole
            ? {
                id: teamMemberRole.id,
                name: teamMemberRole.name,
                description: teamMemberRole.description,
              }
            : null,
          // KYC fields for tenants
          ...userKycData,
        },
        customer: customer
          ? {
              id: customer.id,
              company: customer.company,
              owner: customer.owner,
              email: customer.email,
              phone: customer.phone,
              website: customer.website,
              taxId: customer.taxId,
              industry: customer.industry,
              companySize: customer.companySize,
              yearEstablished: customer.yearEstablished,
              licenseNumber: customer.licenseNumber,
              insuranceProvider: customer.insuranceProvider,
              insurancePolicy: customer.insurancePolicy,
              insuranceExpiration: customer.insuranceExpiration,
              // Address fields for owner profile autofill
              street: customer.street,
              city: customer.city,
              state: customer.state,
              postalCode: customer.postalCode,
              country: customer.country,
              // Alias for frontend code expecting zipCode
              zipCode: customer.postalCode,
              status: customer.status,
              billingCycle: customer.billingCycle,
              planId: customer.planId,
              planCategory: customer.planCategory,
              propertyLimit: customer.propertyLimit,
              projectLimit: (customer as any).projectLimit,
              unitLimit: (customer as any).unitLimit,
              userLimit: customer.userLimit,
              storageLimit: customer.storageLimit,
              storageUsedBytes: customer.storage_used
                ? Number(customer.storage_used)
                : 0,
              storageLimitBytes: customer.storage_limit
                ? Number(customer.storage_limit)
                : null,
              propertiesCount: customer.propertiesCount,
              unitsCount: customer.unitsCount,
              projectsCount: (customer as any).projectsCount,
              // Actual usage counts
              actualPropertiesCount: actualPropertiesCount,
              actualUnitsCount: actualUnitsCount,
              actualManagersCount: actualManagersCount,
              subscriptionStartDate: customer.subscriptionStartDate,
              trialEndsAt: customer.trialEndsAt,
              // KYC fields
              requiresKyc: (customer as any).requiresKyc,
              kycStatus: (customer as any).kycStatus,
              kycVerificationId: (customer as any).kycVerificationId,
              kycCompletedAt: (customer as any).kycCompletedAt,
              kycVerifiedBy: (customer as any).kycVerifiedBy,
              kycFailureReason: (customer as any).kycFailureReason,
              kycLastAttemptAt: (customer as any).kycLastAttemptAt,
              plan: plan
                ? {
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    category: plan.category,
                    monthlyPrice: plan.monthlyPrice,
                    annualPrice: plan.annualPrice,
                    currency: plan.currency,
                    propertyLimit: plan.propertyLimit,
                    projectLimit: (plan as any).projectLimit,
                    unitLimit: (plan as any).unitLimit,
                    userLimit: plan.userLimit,
                    storageLimit: plan.storageLimit,
                    features: plan.features,
                  }
                : null,
            }
          : null,
      });
    } catch (error: any) {
      console.error("Get account error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  }
);

// Owner/Manager self-service account update (no admin required)
router.put(
  "/account",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const tokenCustomerId = (req.user as any)?.customerId || null;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const customerId = tokenCustomerId || user.customerId;
      if (!customerId) {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      const {
        owner,
        phone,
        street,
        city,
        state,
        zipCode,
        postalCode,
        country,
        company,
        taxId,
        website,
        industry,
        companySize,
        yearEstablished,
        licenseNumber,
        insuranceProvider,
        insurancePolicy,
        insuranceExpiration,
      } = req.body || {};

      const customerData: any = {};
      if (typeof owner === "string") customerData.owner = owner;
      if (typeof phone === "string") customerData.phone = phone;
      if (typeof street === "string") customerData.street = street;
      if (typeof city === "string") customerData.city = city;
      if (typeof state === "string") customerData.state = state;
      const resolvedPostal = postalCode ?? zipCode;
      if (typeof resolvedPostal === "string")
        customerData.postalCode = resolvedPostal;
      if (typeof country === "string") customerData.country = country;
      if (typeof company === "string") customerData.company = company;
      if (typeof taxId === "string") customerData.taxId = taxId;
      if (typeof website === "string") customerData.website = website;
      if (typeof industry === "string") customerData.industry = industry;
      if (typeof companySize === "string")
        customerData.companySize = companySize;
      if (typeof yearEstablished === "string")
        customerData.yearEstablished = yearEstablished;
      if (typeof licenseNumber === "string")
        customerData.licenseNumber = licenseNumber;
      if (typeof insuranceProvider === "string")
        customerData.insuranceProvider = insuranceProvider;
      if (typeof insurancePolicy === "string")
        customerData.insurancePolicy = insurancePolicy;
      if (typeof insuranceExpiration === "string")
        customerData.insuranceExpiration = insuranceExpiration;

      const updatedCustomer = await prisma.customers.update({
        where: { id: customerId },
        data: customerData,
        include: { plans: true },
      });

      try {
        if (owner || phone) {
          await prisma.users.updateMany({
            where: { customerId, role: "owner" },
            data: {
              ...(owner && { name: owner }),
              ...(phone && { phone }),
            },
          });
        }
      } catch (e) {
        console.warn("Owner sync warn:", e);
      }

      try {
        emitToCustomer(customerId, "account:updated", {
          customer: updatedCustomer,
        });
      } catch {}

      return res.json({ success: true, customer: updatedCustomer });
    } catch (error: any) {
      console.error("Update account error:", error);
      return res.status(500).json({ error: "Failed to update account" });
    }
  }
);

// Change password for authenticated users
router.post(
  "/change-password",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: "Current password and new password are required" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "New password must be at least 6 characters" });
      }

      // Get current user
      const user = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password and track when it was changed
      await prisma.users.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordLastChanged: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log("✅ Password changed successfully for user:", user.email);

      return res.json({ message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Change password error:", error);
      return res.status(500).json({ error: "Failed to change password" });
    }
  }
);

/**
 * POST /api/auth/2fa/initialize
 * Generate a new TOTP secret for the authenticated user
 */
router.post(
  "/2fa/initialize",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const issuer = process.env.APP_NAME || "Contrezz";
      const secret = speakeasy.generateSecret({
        name: `${issuer} (${user.email})`,
        issuer,
      });

      await prisma.users.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false,
          updatedAt: new Date(),
        },
      });

      return res.json({
        secret: secret.base32,
        otpauthUrl: secret.otpauth_url,
      });
    } catch (error: any) {
      console.error("Initialize 2FA error:", error);
      return res
        .status(500)
        .json({ error: "Failed to initialize two-factor authentication" });
    }
  }
);

/**
 * POST /api/auth/2fa/verify
 * Verify TOTP setup and enable two-factor authentication
 */
router.post(
  "/2fa/verify",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { code } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!code) {
        return res.status(400).json({ error: "Verification code is required" });
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          twoFactorSecret: true,
        },
      });

      if (!user || !user.twoFactorSecret) {
        return res
          .status(400)
          .json({ error: "Two-factor authentication is not initialized" });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: code,
        window: 1,
      });

      if (!verified) {
        return res.status(401).json({ error: "Invalid verification code" });
      }

      await prisma.users.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          updatedAt: new Date(),
        },
      });

      return res.json({
        message: "Two-factor authentication enabled successfully",
      });
    } catch (error: any) {
      console.error("Verify 2FA error:", error);
      return res
        .status(500)
        .json({ error: "Failed to verify two-factor authentication" });
    }
  }
);

/**
 * POST /api/auth/2fa/disable
 * Disable two-factor authentication (requires password confirmation)
 */
router.post(
  "/2fa/disable",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { password } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!password) {
        return res
          .status(400)
          .json({ error: "Password confirmation is required" });
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      await prisma.users.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          updatedAt: new Date(),
        },
      });

      return res.json({ message: "Two-factor authentication disabled" });
    } catch (error: any) {
      console.error("Disable 2FA error:", error);
      return res
        .status(500)
        .json({ error: "Failed to disable two-factor authentication" });
    }
  }
);

/**
 * GET /api/auth/security-settings
 * Get user's security settings
 */
router.get(
  "/security-settings",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          sessionTimeout: true,
          loginAlerts: true,
          passwordLastChanged: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        twoFactorEnabled: user.twoFactorEnabled ?? false,
        sessionTimeout: user.sessionTimeout ?? 60,
        loginAlerts: user.loginAlerts ?? true,
        passwordLastChanged: user.passwordLastChanged ?? null,
      });
    } catch (error: any) {
      console.error("Get security settings error:", error);
      return res.status(500).json({ error: "Failed to get security settings" });
    }
  }
);

/**
 * PUT /api/auth/security-settings
 * Update user's security settings
 */
router.put(
  "/security-settings",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { sessionTimeout, loginAlerts } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validate inputs
      if (
        sessionTimeout !== undefined &&
        (sessionTimeout < 15 || sessionTimeout > 1440)
      ) {
        return res.status(400).json({
          error: "Session timeout must be between 15 and 1440 minutes",
        });
      }

      // Build update data
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (sessionTimeout !== undefined) {
        updateData.sessionTimeout = sessionTimeout;
      }

      if (loginAlerts !== undefined) {
        updateData.loginAlerts = loginAlerts;
      }

      // Update user
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: updateData,
        select: {
          twoFactorEnabled: true,
          sessionTimeout: true,
          loginAlerts: true,
          passwordLastChanged: true,
        },
      });

      console.log("✅ Security settings updated for user:", userId);

      return res.json({
        message: "Security settings updated successfully",
        settings: {
          twoFactorEnabled: updatedUser.twoFactorEnabled ?? false,
          sessionTimeout: updatedUser.sessionTimeout ?? 60,
          loginAlerts: updatedUser.loginAlerts ?? true,
          passwordLastChanged: updatedUser.passwordLastChanged ?? null,
        },
      });
    } catch (error: any) {
      console.error("Update security settings error:", error);
      return res
        .status(500)
        .json({ error: "Failed to update security settings" });
    }
  }
);

/**
 * POST /api/auth/export-data
 * Request data export for the user
 */
router.post(
  "/export-data",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      console.log("📤 Data export requested by user:", userEmail);

      // In a real implementation, this would:
      // 1. Queue a background job to collect all user data
      // 2. Generate a downloadable file (JSON/CSV)
      // 3. Send an email with the download link
      // For now, we'll just acknowledge the request

      // TODO: Implement actual data export functionality
      // - Collect user data from all tables
      // - Generate export file
      // - Send email with download link
      // - Clean up export file after 7 days

      return res.json({
        message:
          "Data export request received. You will receive an email when your data is ready for download.",
        status: "pending",
      });
    } catch (error: any) {
      console.error("Export data error:", error);
      return res.status(500).json({ error: "Failed to request data export" });
    }
  }
);

/**
 * POST /api/auth/delete-account
 * Request account deletion (requires confirmation)
 */
router.post(
  "/delete-account",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      const { confirmPassword, reason } = req.body;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!confirmPassword) {
        return res
          .status(400)
          .json({ error: "Password confirmation is required" });
      }

      // Get user
      const user = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        confirmPassword,
        user.password
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      console.log(
        "🗑️ Account deletion requested by user:",
        userEmail,
        "Reason:",
        reason
      );

      // In a real implementation, this would:
      // 1. Mark account for deletion (soft delete)
      // 2. Send confirmation email
      // 3. Queue background job to delete after grace period (e.g., 30 days)
      // 4. Anonymize or delete user data according to GDPR/data protection laws
      // For now, we'll just deactivate the account

      await prisma.users.update({
        where: { id: userId },
        data: {
          isActive: false,
          status: "deleted",
          updatedAt: new Date(),
        },
      });

      console.log("✅ Account marked for deletion:", userEmail);

      return res.json({
        message:
          "Your account has been deactivated. Contact support if you wish to reactivate it.",
        status: "deactivated",
      });
    } catch (error: any) {
      console.error("Delete account error:", error);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  }
);

// Get active sessions
router.get(
  "/sessions",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const currentToken = req.headers.authorization?.replace("Bearer ", "");

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Fetch active sessions from database
      const dbSessions = await prisma.sessions.findMany({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: { gt: new Date() } }, { expiresAt: null }],
        },
        orderBy: {
          lastActive: "desc",
        },
      });

      // Map sessions and mark current one
      const sessions = dbSessions.map((session) => ({
        id: session.id,
        device: session.device || "Unknown Device",
        browser: session.browser || "Unknown Browser",
        os: session.os || "Unknown OS",
        location: session.location || "Unknown Location",
        ipAddress: session.ipAddress || "Unknown IP",
        lastActive: session.lastActive.toISOString(),
        isCurrent: session.token === currentToken,
      }));

      return res.json({ sessions });
    } catch (error: any) {
      console.error("Get sessions error:", error);
      return res.status(500).json({ error: "Failed to fetch sessions" });
    }
  }
);

// Revoke a specific session
router.delete(
  "/sessions/:sessionId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verify the session belongs to the user and revoke it
      const session = await prisma.sessions.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Mark session as inactive
      await prisma.sessions.update({
        where: { id: sessionId },
        data: { isActive: false },
      });

      console.log(`🔒 Session revoked: ${sessionId} for user ${userId}`);

      return res.json({ message: "Session revoked successfully" });
    } catch (error: any) {
      console.error("Revoke session error:", error);
      return res.status(500).json({ error: "Failed to revoke session" });
    }
  }
);

// Revoke all other sessions (keep current)
router.post(
  "/sessions/revoke-all",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const currentToken = req.headers.authorization?.replace("Bearer ", "");

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Mark all sessions as inactive except the current one
      const result = await prisma.sessions.updateMany({
        where: {
          userId,
          token: { not: currentToken },
          isActive: true,
        },
        data: { isActive: false },
      });

      console.log(
        `🔒 ${result.count} other sessions revoked for user ${userId}`
      );

      return res.json({ message: "All other sessions revoked successfully" });
    } catch (error: any) {
      console.error("Revoke all sessions error:", error);
      return res.status(500).json({ error: "Failed to revoke sessions" });
    }
  }
);

export default router;
