import express, { Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireKycVerification } from "../middleware/kyc";
import prisma from "../lib/db";
import { emitToAdmins, emitToCustomer } from "../lib/socket";
import { sendEmail, getTransporter } from "../lib/email";
import PDFDocument from "pdfkit";
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from "../lib/currency";

const router = express.Router();

router.use(authMiddleware);
router.use(requireKycVerification);

// Helper function to format currency for PDF (Microsoft-style approach)
// Ensures proper symbol rendering with fallback to currency code
function formatCurrency(amount: number, currency: string = "NGN"): string {
  if (typeof amount !== "number" || isNaN(amount)) return "N/A";

  // Format number with thousand separators
  // For whole numbers, show no decimals; for decimals, show 2 places
  const isWholeNumber = amount % 1 === 0;
  const formattedAmount = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: isWholeNumber ? 0 : 2,
    maximumFractionDigits: isWholeNumber ? 0 : 2,
  });

  // Microsoft-style approach: Use currency code format for maximum PDF compatibility
  // This ensures consistent rendering across all PDF viewers and fonts
  // Format: "NGN 1,000,000" - universally supported and professional
  // Currency symbols (₦, €, £) may not render correctly in all PDF viewers/fonts
  // Using currency code is the Microsoft standard for PDF exports
  const currencyCode = currency.toUpperCase();

  return `${currencyCode} ${formattedAmount}`;
}

type ReportType = "financial" | "occupancy" | "maintenance" | "tenant" | "all";

interface GeneratedReportPayload {
  type: ReportType;
  generatedAt: string;
  filters: {
    propertyId: string;
    startDate: string | null;
    endDate: string | null;
  };
  data: any;
  propertyLabel?: string;
}

// Get manager analytics data
router.get("/manager/analytics", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const roleRaw = req.user?.role || "";
    const role = roleRaw.toLowerCase();
    const isOwner = ["owner", "property_owner", "property owner"].includes(
      role
    );
    const isManager = [
      "manager",
      "property_manager",
      "property manager",
    ].includes(role);

    if (!isManager && !isOwner) {
      return res.status(403).json({ error: "Access denied" });
    }

    console.log(
      "📊 Fetching manager analytics for user:",
      userId,
      "role:",
      role
    );

    // Get properties accessible to the manager/owner
    const where: any = {};
    if (isOwner) {
      where.ownerId = userId;
    } else if (isManager) {
      where.property_managers = {
        some: {
          managerId: userId,
          isActive: true,
        },
      };
    }

    const properties = await prisma.properties.findMany({
      where,
      select: {
        id: true,
        name: true,
        currency: true,
      },
    });

    const propertyIds = properties.map((p) => p.id);
    console.log(`📍 Found ${properties.length} properties for analytics`);

    if (propertyIds.length === 0) {
      return res.json({
        averageRent: 0,
        tenantRetention: 0,
        avgDaysVacant: 0,
        unitDistribution: [],
        revenueByProperty: [],
      });
    }

    // 1. Calculate Average Rent across all units
    const allUnits = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds },
      },
      select: {
        monthlyRent: true,
        bedrooms: true,
        status: true,
        propertyId: true,
      },
    });

    const averageRent =
      allUnits.length > 0
        ? allUnits.reduce((sum, unit) => sum + unit.monthlyRent, 0) /
          allUnits.length
        : 0;

    console.log(
      `💰 Average rent calculated: ${averageRent} from ${allUnits.length} units`
    );

    // 2. Calculate Tenant Retention Rate
    // Retention = (number of lease renewals / total leases that ended) * 100
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const endedLeases = await prisma.leases.findMany({
      where: {
        propertyId: { in: propertyIds },
        endDate: {
          gte: oneYearAgo,
          lte: new Date(),
        },
      },
      select: {
        tenantId: true,
        unitId: true,
        endDate: true,
      },
    });

    // Count how many tenants renewed (stayed in the same or different unit)
    let renewedCount = 0;
    for (const lease of endedLeases) {
      // Check if tenant has a new lease after this one ended
      const renewalLease = await prisma.leases.findFirst({
        where: {
          tenantId: lease.tenantId,
          propertyId: { in: propertyIds },
          startDate: {
            gte: lease.endDate,
            lte: new Date(lease.endDate.getTime() + 60 * 24 * 60 * 60 * 1000), // Within 60 days
          },
        },
      });
      if (renewalLease) renewedCount++;
    }

    const tenantRetention =
      endedLeases.length > 0
        ? Math.round((renewedCount / endedLeases.length) * 100)
        : 0;

    console.log(
      `👥 Tenant retention: ${tenantRetention}% (${renewedCount} renewals out of ${endedLeases.length} ended leases)`
    );

    // 3. Calculate Average Days Vacant
    // Get all terminated leases and find the time between termination and next lease
    const terminatedLeases = await prisma.leases.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "terminated",
        endDate: {
          gte: oneYearAgo,
        },
      },
      select: {
        unitId: true,
        endDate: true,
      },
      orderBy: {
        endDate: "asc",
      },
    });

    let totalVacantDays = 0;
    let vacancyCount = 0;

    for (const terminatedLease of terminatedLeases) {
      // Find the next lease for this unit
      const nextLease = await prisma.leases.findFirst({
        where: {
          unitId: terminatedLease.unitId,
          startDate: {
            gt: terminatedLease.endDate,
          },
        },
        orderBy: {
          startDate: "asc",
        },
      });

      if (nextLease) {
        const vacantDays = Math.ceil(
          (nextLease.startDate.getTime() - terminatedLease.endDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalVacantDays += vacantDays;
        vacancyCount++;
      }
    }

    // Also include currently vacant units
    const currentlyVacantUnits = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "vacant",
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    // For currently vacant units, calculate days since last lease ended
    for (const unit of currentlyVacantUnits) {
      const lastLease = await prisma.leases.findFirst({
        where: {
          unitId: unit.id,
        },
        orderBy: {
          endDate: "desc",
        },
      });

      if (lastLease && lastLease.endDate) {
        const vacantDays = Math.ceil(
          (new Date().getTime() - lastLease.endDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalVacantDays += vacantDays;
        vacancyCount++;
      }
    }

    const avgDaysVacant =
      vacancyCount > 0 ? Math.round(totalVacantDays / vacancyCount) : 0;

    console.log(
      `📅 Average days vacant: ${avgDaysVacant} days (from ${vacancyCount} vacancy periods)`
    );

    // 4. Unit Distribution by Bedroom Count
    const bedroomCounts: { [key: string]: number } = {};
    allUnits.forEach((unit) => {
      const bedrooms = unit.bedrooms?.toString() || "Studio";
      bedroomCounts[bedrooms] = (bedroomCounts[bedrooms] || 0) + 1;
    });

    const unitDistribution = Object.entries(bedroomCounts)
      .map(([bedrooms, count]) => ({
        bedrooms,
        count,
        percentage:
          allUnits.length > 0 ? Math.round((count / allUnits.length) * 100) : 0,
      }))
      .sort((a, b) => {
        // Sort by bedroom count (Studio first, then numeric)
        if (a.bedrooms === "Studio") return -1;
        if (b.bedrooms === "Studio") return 1;
        return parseInt(a.bedrooms) - parseInt(b.bedrooms);
      });

    console.log(`🏘️ Unit distribution:`, unitDistribution);

    // 5. Revenue by Property
    const revenueByProperty = await Promise.all(
      properties.map(async (property) => {
        const occupiedUnitsForProperty = await prisma.units.findMany({
          where: {
            propertyId: property.id,
            status: "occupied",
          },
          select: {
            monthlyRent: true,
            features: true,
          },
        });

        // Calculate revenue considering billing cycle (annual vs monthly)
        const revenue = occupiedUnitsForProperty.reduce((sum, unit) => {
          let unitFeatures = unit.features;
          if (typeof unitFeatures === "string") {
            try {
              unitFeatures = JSON.parse(unitFeatures);
            } catch {
              unitFeatures = {};
            }
          }

          const rentFrequency =
            (unitFeatures as any)?.nigeria?.rentFrequency ||
            (unitFeatures as any)?.rentFrequency ||
            "monthly";

          const monthlyRent = unit.monthlyRent || 0;

          if (rentFrequency === "annual" || rentFrequency === "yearly") {
            return sum + monthlyRent / 12;
          }
          return sum + monthlyRent;
        }, 0);

        return {
          id: property.id,
          name: property.name,
          revenue,
          currency: property.currency || "USD",
        };
      })
    );

    const totalRevenue = revenueByProperty.reduce(
      (sum, p) => sum + p.revenue,
      0
    );

    console.log(`✅ Analytics data compiled successfully`);

    return res.json({
      averageRent: Math.round(averageRent),
      tenantRetention,
      avgDaysVacant,
      unitDistribution,
      revenueByProperty: revenueByProperty.map((p) => ({
        ...p,
        percentage:
          totalRevenue > 0 ? Math.round((p.revenue / totalRevenue) * 100) : 0,
      })),
    });
  } catch (error: any) {
    console.error("❌ Error fetching manager analytics:", error);
    return res.status(500).json({
      error: "Failed to fetch analytics",
      details: error.message,
    });
  }
});

// Get manager dashboard overview
router.get("/manager/overview", async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const userId = req.user?.id;
    const roleRaw = req.user?.role || "";
    const role = roleRaw.toLowerCase();
    const isOwner = ["owner", "property_owner", "property owner"].includes(
      role
    );
    const isManager = [
      "manager",
      "property_manager",
      "property manager",
    ].includes(role);

    if (!isManager && !isOwner) {
      return res.status(403).json({ error: "Access denied" });
    }

    const where: any = {};

    if (isOwner) {
      where.ownerId = userId;
    } else if (isManager) {
      where.property_managers = {
        some: {
          managerId: userId,
          isActive: true,
        },
      };
    }

    if (propertyId) {
      where.id = propertyId;
    }

    // Get properties
    const properties = await prisma.properties.findMany({
      where,
      include: {
        _count: {
          select: {
            units: true,
            leases: true,
          },
        },
      },
    });

    const propertyIds = properties.map((p) => p.id);

    // Get total units and occupancy
    const [totalUnits, occupiedUnits, vacantUnits] = await Promise.all([
      prisma.units.count({ where: { propertyId: { in: propertyIds } } }),
      prisma.units.count({
        where: { propertyId: { in: propertyIds }, status: "occupied" },
      }),
      prisma.units.count({
        where: { propertyId: { in: propertyIds }, status: "vacant" },
      }),
    ]);

    const occupancyRate =
      totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    // Get active leases
    const activeLeases = await prisma.leases.count({
      where: {
        propertyId: { in: propertyIds },
        status: "active",
      },
    });

    // Get expiring leases (next 30 days)
    const expiringLeases = await prisma.leases.count({
      where: {
        propertyId: { in: propertyIds },
        status: "active",
        endDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    });

    // Calculate monthly revenue from occupied units - considering billing cycle (annual vs monthly)
    const occupiedUnitsWithRent = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "occupied",
      },
      select: {
        monthlyRent: true,
        features: true,
      },
    });

    const monthlyRevenue = occupiedUnitsWithRent.reduce((sum, unit) => {
      let unitFeatures = unit.features;
      if (typeof unitFeatures === "string") {
        try {
          unitFeatures = JSON.parse(unitFeatures);
        } catch {
          unitFeatures = {};
        }
      }

      const rentFrequency =
        (unitFeatures as any)?.nigeria?.rentFrequency ||
        (unitFeatures as any)?.rentFrequency ||
        "monthly";

      const monthlyRent = unit.monthlyRent || 0;

      if (rentFrequency === "annual" || rentFrequency === "yearly") {
        return sum + monthlyRent / 12;
      }
      return sum + monthlyRent;
    }, 0);

    // Get maintenance tickets (support_tickets doesn't have propertyId, so we'll use 0 for now)
    // TODO: Create a dedicated maintenance_requests table with propertyId field
    const openMaintenance = 0;
    const urgentMaintenance = 0;
    const scheduledMaintenanceCount = 0;

    // Group revenue by currency for multi-currency support
    const revenueWithCurrency = await prisma.units.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: "occupied",
      },
      select: {
        monthlyRent: true,
        properties: {
          select: {
            currency: true,
          },
        },
      },
    });

    // Get manager's base currency (default to USD)
    const manager = await prisma.users.findUnique({
      where: { id: userId },
      select: { baseCurrency: true },
    });
    const managerBaseCurrency = manager?.baseCurrency || "USD";

    // Calculate revenue per currency
    const revenueByCurrency: Record<string, number> = {};
    revenueWithCurrency.forEach((unit) => {
      const currency = unit.properties.currency || managerBaseCurrency;
      if (!revenueByCurrency[currency]) {
        revenueByCurrency[currency] = 0;
      }
      revenueByCurrency[currency] += unit.monthlyRent;
    });

    // Get the primary currency (most common or first one, fallback to manager's base currency)
    const currencies = Object.keys(revenueByCurrency);
    const primaryCurrency =
      currencies.length > 0 ? currencies[0] : managerBaseCurrency;

    console.log("💰 Manager Dashboard Revenue:", {
      managerId: userId,
      managerBaseCurrency,
      monthlyRevenue,
      revenueByCurrency,
      currencies,
      primaryCurrency,
      hasMultipleCurrencies: currencies.length > 1,
    });

    // Expense data (managers see only their own expenses + visible owner expenses)
    const expenseWhere: any = {
      propertyId: { in: propertyIds },
      OR: [{ recordedBy: userId }, { visibleToManager: true }],
    };

    const [totalExpenses, pendingExpenses, paidExpenses] = await Promise.all([
      prisma.expenses.aggregate({
        where: expenseWhere,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expenses.aggregate({
        where: { ...expenseWhere, status: "pending" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expenses.aggregate({
        where: { ...expenseWhere, status: "paid" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return res.json({
      properties: {
        total: properties.length,
        properties: properties.map((p) => ({
          id: p.id,
          name: p.name,
          currency: p.currency || managerBaseCurrency, // Include currency for each property (defaults to manager's base currency)
          totalUnits: p._count.units,
          activeLeases: p._count.leases,
        })),
      },
      units: {
        total: totalUnits,
        occupied: occupiedUnits,
        vacant: vacantUnits,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
      },
      leases: {
        active: activeLeases,
        expiringSoon: expiringLeases,
      },
      revenue: {
        currentMonth: Math.round(monthlyRevenue),
        byCurrency: revenueByCurrency, // Revenue broken down by currency
        primaryCurrency: primaryCurrency, // The main currency to display
        hasMultipleCurrencies: currencies.length > 1, // Flag if manager has properties in multiple currencies
      },
      expenses: {
        total: totalExpenses._sum.amount || 0,
        totalCount: totalExpenses._count || 0,
        pending: pendingExpenses._sum.amount || 0,
        pendingCount: pendingExpenses._count || 0,
        paid: paidExpenses._sum.amount || 0,
        paidCount: paidExpenses._count || 0,
      },
      maintenance: {
        open: openMaintenance,
        urgent: urgentMaintenance,
      },
      upcomingTasks: {
        leaseRenewals: expiringLeases,
        scheduledMaintenance: scheduledMaintenanceCount,
      },
    });
  } catch (error: any) {
    console.error("❌ Get manager dashboard overview error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return res.status(500).json({
      error: "Failed to fetch dashboard overview",
      details: error.message,
    });
  }
});

// Get property performance metrics
router.get(
  "/manager/property-performance",
  async (req: AuthRequest, res: Response) => {
    try {
      const { propertyId, period = "30" } = req.query;
      const userId = req.user?.id;
      const roleRaw = req.user?.role || "";
      const role = roleRaw.toLowerCase();
      const isOwner = ["owner", "property_owner", "property owner"].includes(
        role
      );
      const isManager = [
        "manager",
        "property_manager",
        "property manager",
      ].includes(role);

      if (!isManager && !isOwner) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!propertyId) {
        return res.status(400).json({ error: "Property ID is required" });
      }

      // Verify access
      const property = await prisma.property.findFirst({
        where: {
          id: propertyId as string,
          OR: [
            { ownerId: userId },
            {
              managers: {
                some: {
                  managerId: userId,
                  isActive: true,
                },
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              units: true,
              leases: true,
            },
          },
        },
      });

      if (!property) {
        return res
          .status(404)
          .json({ error: "Property not found or access denied" });
      }

      const daysAgo = parseInt(period as string);
      const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      // Get revenue over time
      const payments = await prisma.payment.findMany({
        where: {
          lease: { propertyId: propertyId as string },
          status: "completed",
          paymentDate: { gte: startDate },
        },
        select: {
          amount: true,
          paymentDate: true,
        },
        orderBy: { paymentDate: "asc" },
      });

      // Get maintenance requests over time
      const maintenanceRequests = await prisma.maintenanceRequest.findMany({
        where: {
          propertyId: propertyId as string,
          createdAt: { gte: startDate },
        },
        select: {
          status: true,
          priority: true,
          createdAt: true,
        },
      });

      // Get occupancy trend
      const units = await prisma.unit.findMany({
        where: { propertyId: propertyId as string },
        select: {
          status: true,
        },
      });

      const occupied = units.filter((u) => u.status === "occupied").length;
      const occupancyRate =
        units.length > 0 ? (occupied / units.length) * 100 : 0;

      return res.json({
        property: {
          id: property.id,
          name: property.name,
          totalUnits: property._count.units,
          activeLeases: property._count.leases,
        },
        revenue: {
          total: payments.reduce((sum, p) => sum + p.amount, 0),
          payments: payments.map((p) => ({
            amount: p.amount,
            date: p.paymentDate,
          })),
        },
        maintenance: {
          total: maintenanceRequests.length,
          byStatus: {
            open: maintenanceRequests.filter((m) => m.status === "open").length,
            inProgress: maintenanceRequests.filter(
              (m) => m.status === "in_progress"
            ).length,
            completed: maintenanceRequests.filter(
              (m) => m.status === "completed"
            ).length,
          },
          byPriority: {
            urgent: maintenanceRequests.filter((m) => m.priority === "urgent")
              .length,
            high: maintenanceRequests.filter((m) => m.priority === "high")
              .length,
            medium: maintenanceRequests.filter((m) => m.priority === "medium")
              .length,
            low: maintenanceRequests.filter((m) => m.priority === "low").length,
          },
        },
        occupancy: {
          rate: Math.round(occupancyRate * 10) / 10,
          occupied,
          total: units.length,
          vacant: units.length - occupied,
        },
      });
    } catch (error: any) {
      console.error("Get property performance error:", error);
      return res
        .status(500)
        .json({ error: "Failed to fetch property performance" });
    }
  }
);

// Get owner dashboard overview
router.get("/owner/overview", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const roleRaw = req.user?.role || "";
    const role = roleRaw.toLowerCase();
    const isOwner = ["owner", "property_owner", "property owner"].includes(
      role
    );

    if (!isOwner) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Try database first
    try {
      // Get all properties
      const properties = await prisma.properties.findMany({
        where: { ownerId: userId },
        include: {
          _count: {
            select: {
              units: true,
              leases: true,
            },
          },
        },
      });

      const propertyIds = properties.map((p) => p.id);

      // Portfolio value (not modeled) → 0 for now
      const portfolioValue = 0;

      // Total units and occupancy
      const [totalUnits, occupiedUnitsCount] = await Promise.all([
        prisma.units.count({ where: { propertyId: { in: propertyIds } } }),
        prisma.units.count({
          where: { propertyId: { in: propertyIds }, status: "occupied" },
        }),
      ]);

      const occupancyRate =
        totalUnits > 0 ? (occupiedUnitsCount / totalUnits) * 100 : 0;

      // Monthly revenue from occupied units - considering billing cycle (annual vs monthly)
      const occupiedUnitsData = await prisma.units.findMany({
        where: { propertyId: { in: propertyIds }, status: "occupied" },
        select: {
          monthlyRent: true,
          features: true,
        },
      });

      let monthlyIncome = 0;
      for (const unit of occupiedUnitsData) {
        let unitFeatures = unit.features;
        if (typeof unitFeatures === "string") {
          try {
            unitFeatures = JSON.parse(unitFeatures);
          } catch {
            unitFeatures = {};
          }
        }

        // Get rent frequency from unit features
        const rentFrequency =
          (unitFeatures as any)?.nigeria?.rentFrequency ||
          (unitFeatures as any)?.rentFrequency ||
          "monthly";

        const monthlyRent = unit.monthlyRent || 0;

        if (rentFrequency === "annual" || rentFrequency === "yearly") {
          // Convert annual rent to monthly equivalent
          monthlyIncome += monthlyRent / 12;
        } else {
          // Monthly rent - use as is
          monthlyIncome += monthlyRent;
        }
      }

      // Active managers via property_managers
      const activeManagers = await prisma.property_managers.count({
        where: { propertyId: { in: propertyIds }, isActive: true },
      });

      // Pending maintenance not modeled → 0
      const pendingMaintenance = 0;

      // Expiring leases (next 60 days)
      const expiringLeases = await prisma.leases.count({
        where: {
          propertyId: { in: propertyIds },
          status: "active",
          endDate: {
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      });

      // Expense data
      const [totalExpenses, pendingExpenses, paidExpenses] = await Promise.all([
        prisma.expenses.aggregate({
          where: { propertyId: { in: propertyIds } },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.expenses.aggregate({
          where: { propertyId: { in: propertyIds }, status: "pending" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.expenses.aggregate({
          where: { propertyId: { in: propertyIds }, status: "paid" },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      return res.json({
        portfolio: {
          totalProperties: properties.length,
          totalValue: portfolioValue,
          totalUnits,
          occupiedUnits: occupiedUnitsCount,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
        },
        revenue: {
          currentMonth: monthlyIncome,
        },
        expenses: {
          total: totalExpenses._sum.amount || 0,
          totalCount: totalExpenses._count || 0,
          pending: pendingExpenses._sum.amount || 0,
          pendingCount: pendingExpenses._count || 0,
          paid: paidExpenses._sum.amount || 0,
          paidCount: paidExpenses._count || 0,
        },
        collection: await (async () => {
          // Calculate collection rate considering billing cycle (annual vs monthly)
          const [occupiedUnitsData, allUnitsData] = await Promise.all([
            prisma.units.findMany({
              where: { propertyId: { in: propertyIds }, status: "occupied" },
              select: { monthlyRent: true, features: true },
            }),
            prisma.units.findMany({
              where: { propertyId: { in: propertyIds } },
              select: { monthlyRent: true, features: true },
            }),
          ]);

          // Helper function to calculate monthly equivalent
          const getMonthlyEquivalent = (unit: any): number => {
            let unitFeatures = unit.features;
            if (typeof unitFeatures === "string") {
              try {
                unitFeatures = JSON.parse(unitFeatures);
              } catch {
                unitFeatures = {};
              }
            }

            const rentFrequency =
              (unitFeatures as any)?.nigeria?.rentFrequency ||
              (unitFeatures as any)?.rentFrequency ||
              "monthly";

            const monthlyRent = unit.monthlyRent || 0;

            if (rentFrequency === "annual" || rentFrequency === "yearly") {
              return monthlyRent / 12;
            }
            return monthlyRent;
          };

          const collectedAmt = occupiedUnitsData.reduce(
            (sum, unit) => sum + getMonthlyEquivalent(unit),
            0
          );
          const expectedAmt = allUnitsData.reduce(
            (sum, unit) => sum + getMonthlyEquivalent(unit),
            0
          );
          const rate = expectedAmt > 0 ? (collectedAmt / expectedAmt) * 100 : 0;
          return {
            collected: collectedAmt,
            expected: expectedAmt,
            rate: Math.round(rate * 10) / 10,
          };
        })(),
        operations: {
          activeManagers,
          pendingMaintenance,
          expiringLeases,
        },
        properties: properties.map((p) => ({
          id: p.id,
          name: p.name,
          value: 0,
          units: p._count.units,
          activeLeases: p._count.leases,
        })),
      });
    } catch (dbError) {
      // Database not available
      return res
        .status(500)
        .json({ error: "Failed to fetch dashboard overview" });
    }
  } catch (error: any) {
    console.error("Get owner dashboard overview error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch dashboard overview" });
  }
});

// Get paginated activity logs for manager
router.get("/manager/activities", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    console.log("📋 Fetching manager activities:", {
      userId,
      role,
      page,
      limit,
    });

    // Ensure user is a manager
    if (role !== "manager" && role !== "property_manager") {
      return res.status(403).json({ error: "Manager access required" });
    }

    // Get manager's assigned properties
    const assignments = await prisma.property_managers.findMany({
      where: {
        managerId: userId,
        isActive: true,
      },
      select: {
        propertyId: true,
      },
    });

    const propertyIds = assignments.map((a) => a.propertyId);

    if (propertyIds.length === 0) {
      return res.json({
        activities: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

    // Get property-related activity entityIds (units and leases)
    const units = await prisma.units.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true },
    });
    const unitIds = units.map((u) => u.id);

    const leases = await prisma.leases.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true },
    });
    const leaseIds = leases.map((l) => l.id);

    // Combine all relevant entity IDs
    const relevantEntityIds = [...propertyIds, ...unitIds, ...leaseIds];

    // Get total count
    const totalCount = await prisma.activity_logs.count({
      where: {
        entityId: { in: relevantEntityIds },
      },
    });

    // Get paginated activities
    const activities = await prisma.activity_logs.findMany({
      where: {
        entityId: { in: relevantEntityIds },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        description: true,
        createdAt: true,
        entityId: true,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    console.log("✅ Fetched activities:", {
      count: activities.length,
      total: totalCount,
      page,
      totalPages,
      hasMore,
    });

    return res.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        description: a.description,
        createdAt: a.createdAt,
        entityId: a.entityId,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to fetch manager activities:", error);
    return res.status(500).json({
      error: "Failed to fetch activities",
      details: error.message,
    });
  }
});

// Get paginated activity logs for owner
router.get("/owner/activities", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const roleRaw = req.user?.role || "";
    const role = roleRaw.toLowerCase();
    const isOwner = ["owner", "property_owner", "property owner"].includes(
      role
    );
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    console.log("📋 Fetching owner activities:", { userId, role, page, limit });

    // Ensure user is an owner
    if (!isOwner) {
      return res.status(403).json({ error: "Owner access required" });
    }

    // Get owner's properties
    const properties = await prisma.properties.findMany({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    const propertyIds = properties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return res.json({
        activities: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      });
    }

    // Get property-related activity entityIds (units and leases)
    const units = await prisma.units.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true },
    });
    const unitIds = units.map((u) => u.id);

    const leases = await prisma.leases.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { id: true },
    });
    const leaseIds = leases.map((l) => l.id);

    // Combine all relevant entity IDs
    const relevantEntityIds = [...propertyIds, ...unitIds, ...leaseIds];

    // Get total count
    const totalCount = await prisma.activity_logs.count({
      where: {
        entityId: { in: relevantEntityIds },
      },
    });

    // Get paginated activities
    const activities = await prisma.activity_logs.findMany({
      where: {
        entityId: { in: relevantEntityIds },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        description: true,
        createdAt: true,
        entityId: true,
      },
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    console.log("✅ Fetched activities:", {
      count: activities.length,
      total: totalCount,
      page,
      totalPages,
      hasMore,
    });

    return res.json({
      activities: activities.map((a) => ({
        id: a.id,
        action: a.action,
        entity: a.entity,
        description: a.description,
        createdAt: a.createdAt,
        entityId: a.entityId,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore,
      },
    });
  } catch (error: any) {
    console.error("❌ Failed to fetch owner activities:", error);
    return res.status(500).json({
      error: "Failed to fetch activities",
      details: error.message,
    });
  }
});

// Send a scheduled report via email (Owner/Manager)
router.post(
  "/reports/scheduled/send",
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, report, subject } = req.body as {
        email?: string;
        subject?: string;
        report?: GeneratedReportPayload;
      };

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Recipient email is required" });
      }

      if (!report || typeof report !== "object") {
        return res.status(400).json({ error: "Report payload is required" });
      }

      if (!report.type || !report.generatedAt || !report.filters) {
        return res
          .status(400)
          .json({ error: "Report payload is missing required fields" });
      }

      const reportLabelMap: Record<ReportType, string> = {
        financial: "Financial",
        occupancy: "Occupancy",
        maintenance: "Maintenance",
        tenant: "Tenant",
        all: "Portfolio",
      };

      const reportLabel = reportLabelMap[report.type] || "Portfolio";
      const propertyLabel =
        report.propertyLabel ||
        (report.filters.propertyId === "all"
          ? "All properties"
          : "Selected property");
      const generatedAt = new Date(report.generatedAt).toLocaleString();

      const subjectLine =
        subject || `Scheduled ${reportLabel} Report - ${propertyLabel}`;

      const dateRange =
        report.filters.startDate || report.filters.endDate
          ? `${report.filters.startDate || "—"} → ${
              report.filters.endDate || "—"
            }`
          : "Not specified";

      // Get report icon based on type
      const reportIcons: Record<ReportType, string> = {
        financial: "💰",
        occupancy: "📊",
        maintenance: "🔧",
        tenant: "👥",
        all: "📈",
      };
      const reportIcon = reportIcons[report.type] || "📄";

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportLabel} Report - ${propertyLabel}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
    .content { background-color: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .report-info { background-color: #f8f9fa; border-left: 4px solid #7C3AED; padding: 20px; margin: 0 0 30px; border-radius: 4px; }
    .button { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white !important; padding: 14px 35px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    .button:hover { opacity: 0.9; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background-color: #f9fafb; border-radius: 0 0 10px 10px; }
    .badge { display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${reportIcon} ${reportLabel} Report</h1>
      <p>Property Analytics & Insights</p>
    </div>
    <div class="content">
      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
        Your requested <strong>${reportLabel}</strong> report has been generated and is ready for review.
      </p>

      <div class="report-info">
        <h2 style="color: #7C3AED; margin: 0 0 15px; font-size: 18px; font-weight: 600;">📋 Report Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 40%;">Report Type:</td>
            <td style="padding: 8px 0;"><span class="badge">${reportLabel}</span></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Property:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${propertyLabel}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Date Range:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${dateRange}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666666; font-size: 14px;">Generated:</td>
            <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 500;">${generatedAt}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0369a1;"><strong>📎 PDF Attached:</strong><br>
        Your complete report is attached to this email as a PDF document with detailed analytics and visualizations.</p>
      </div>

      <center>
        <a href="${
          process.env.FRONTEND_URL || "https://app.contrezz.com"
        }" class="button">📊 View in Dashboard</a>
      </center>

      <p style="margin-top: 30px; color: #333333; font-size: 14px;">
        If you have any questions about this report, please contact support.
      </p>

      <p style="color: #333333;">Best regards,<br>
      <strong>Contrezz Platform Team</strong><br>
      Property Management System</p>
    </div>
    <div class="footer">
      <p>This email was sent from Contrezz Property Management Platform.</p>
      <p>You requested this report from your dashboard.</p>
      <p style="margin-top: 10px;">
        <a href="${
          process.env.FRONTEND_URL || "https://app.contrezz.com"
        }" style="color: #7C3AED; text-decoration: none;">Access Your Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();

      const text = `
${reportIcon} ${reportLabel} Report - ${propertyLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your requested ${reportLabel} report has been generated and is ready for review.

📋 REPORT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report Type:    ${reportLabel}
Property:       ${propertyLabel}
Date Range:     ${dateRange}
Generated:      ${generatedAt}

💡 ACCESS FULL REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Log in to your dashboard to download the complete PDF version with detailed
analytics and visualizations.

Dashboard: ${process.env.FRONTEND_URL || "https://app.contrezz.com"}

If you have any questions about this report, please contact support.

Best regards,
Contrezz Platform Team
Property Management System

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This email was sent from Contrezz Property Management Platform.
You requested this report from your dashboard.
    `.trim();

      // Generate PDF with professional formatting
      const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        // Microsoft approach: Simple PDFDocument initialization
        // Auto-pagination is disabled when using explicit coordinates with lineBreak: false
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          autoFirstPage: true,  // Ensure only one page is created initially
          bufferPages: false,   // Don't buffer pages - write directly
          info: {
            Title: `${reportLabel} Report - ${propertyLabel}`,
            Author: 'Contrezz Property Management',
            Subject: 'Property Management Report',
            Creator: 'Contrezz Platform'
          }
        });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Set default font
        doc.font('Helvetica');

        // Helper function to draw a horizontal line
        const drawLine = (y: number, width: number = 515) => {
          doc.moveTo(40, y).lineTo(40 + width, y).strokeColor('#E5E7EB').lineWidth(1).stroke();
        };

        // Helper function to draw a colored box
        const drawColoredBox = (x: number, y: number, width: number, height: number, color: string) => {
          doc.rect(x, y, width, height).fillColor(color).fill();
        };

        // Helper function to add section header
        // Word Processing Approach: Absolute positioning, no width parameter
        const addSectionHeader = (text: string, y: number) => {
          doc.fontSize(16)
             .fillColor('#1F2937')
             .font('Helvetica-Bold')
             .text(text, 40, y, { lineBreak: false });
          drawLine(y + 25);
          return y + 35;
        };

        // Helper function to add key-value pair
        // Word Processing Approach: Absolute positioning, no width parameter
        const addKeyValue = (key: string, value: string, y: number, indent: number = 0) => {
          const x = 40 + indent;
          doc.fontSize(10)
             .fillColor('#6B7280')
             .font('Helvetica')
             .text(key + ':', x, y, { lineBreak: false });
          doc.fontSize(10)
             .fillColor('#111827')
             .font('Helvetica-Bold')
             .text(value, x + 160, y, { lineBreak: false });
          return y + 18;
        };

        // Professional Header with gradient effect (simulated with colored box)
        const headerHeight = 80;
        doc.rect(0, 0, 595, headerHeight)
           .fillColor('#7C3AED')
           .fill();

        // White text on purple background - Professional header without emoji
        // Word Processing Approach: Absolute positioning, no width/align parameters
        doc.fontSize(28)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold')
           .text(`${reportLabel} Report`, 40, 25, { lineBreak: false });

        doc.fontSize(12)
           .fillColor('#E9D5FF')
           .font('Helvetica')
           .text(propertyLabel, 40, 55, { lineBreak: false });

        // Add a subtle accent line below the property label
        doc.moveTo(40, 70)
           .lineTo(555, 70)
           .strokeColor('#A78BFA')
           .lineWidth(1)
           .stroke();

        let currentY = headerHeight + 30;

        // Microsoft approach: Manual page control with lineBreak: false on all text
        // This prevents PDFKit from auto-creating pages

        // Helper function to draw a table
        const drawTable = (headers: string[], rows: string[][], startY: number, colWidths: number[]) => {
          const rowHeight = 25;
          const headerHeight = 30;
          let y = startY;

          // Draw header background
          doc.rect(40, y, 515, headerHeight)
             .fillColor('#F3F4F6')
             .fill();

          // Draw header text
          // Word Processing Approach: Absolute positioning, no width parameter
          let x = 40;
          doc.fontSize(10)
             .fillColor('#1F2937')
             .font('Helvetica-Bold');
          headers.forEach((header, i) => {
            // Add left padding for Amount column header to match data alignment
            const isAmountColumn = header?.toLowerCase() === 'amount';
            const leftPadding = isAmountColumn ? 10 : 0;
            doc.text(header, x + leftPadding, y + 8, { lineBreak: false });
            x += colWidths[i];
          });

          // Draw header border
          doc.rect(40, y, 515, headerHeight)
             .strokeColor('#D1D5DB')
             .lineWidth(1)
             .stroke();

          y += headerHeight;

          // Draw rows
          rows.forEach((row, rowIndex) => {
            const bgColor = rowIndex % 2 === 0 ? '#FFFFFF' : '#F9FAFB';
            doc.rect(40, y, 515, rowHeight)
               .fillColor(bgColor)
               .fill();

            x = 40;
            doc.fontSize(9)
               .fillColor('#111827')
               .font('Helvetica');
            row.forEach((cell, i) => {
              // Add left padding for Amount column
              // Word Processing Approach: Absolute positioning, no width parameter
              const isAmountColumn = headers[i]?.toLowerCase() === 'amount';
              const leftPadding = isAmountColumn ? 10 : 0;
              doc.text(cell, x + leftPadding, y + 7, { lineBreak: false });
              x += colWidths[i];
            });

            doc.rect(40, y, 515, rowHeight)
               .strokeColor('#E5E7EB')
               .lineWidth(0.5)
               .stroke();

            y += rowHeight;
          });

          return y + 10;
        };

        // Helper function to add a metric card
        const addMetricCard = (label: string, value: string, x: number, y: number, width: number = 160) => {
          const cardHeight = 60;

          // Card background
          doc.rect(x, y, width, cardHeight)
             .fillColor('#FFFFFF')
             .fill();

          // Card border
          doc.rect(x, y, width, cardHeight)
             .strokeColor('#E5E7EB')
             .lineWidth(1)
             .stroke();

          // Top accent bar
          doc.rect(x, y, width, 4)
             .fillColor('#7C3AED')
             .fill();

          // Label
          // Word Processing Approach: Absolute positioning, no width parameter
          doc.fontSize(9)
             .fillColor('#6B7280')
             .font('Helvetica')
             .text(label, x + 10, y + 12, { lineBreak: false });

          // Value
          doc.fontSize(18)
             .fillColor('#111827')
             .font('Helvetica-Bold')
             .text(value, x + 10, y + 28, { lineBreak: false });
        };

        let pageNumber = 1;

        // Helper function to add footer to current page
        // Word Processing Approach: Use absolute positioning, no width parameter
        // This prevents PDFKit from calculating text flow and creating pages
        const addFooter = () => {
          const pageHeight = 842; // A4 height in points
          const footerY = pageHeight - 60;
          const pageWidth = 595; // A4 width in points
          const centerX = pageWidth / 2;
          const rightX = pageWidth - 40; // Right margin

          // Footer line
          drawLine(footerY, 515);

          // Word Processing Rule: Calculate text width manually, position absolutely
          // This prevents PDFKit from doing any internal calculations
          doc.fontSize(9)
             .fillColor('#6B7280')
             .font('Helvetica');
          const footerText = "Generated by Contrezz Property Management Platform";
          const footerTextWidth = doc.widthOfString(footerText);
          doc.text(footerText, centerX - footerTextWidth / 2, footerY + 10, { lineBreak: false });

          doc.fontSize(8)
             .fillColor('#9CA3AF');
          const urlText = `${process.env.FRONTEND_URL || "https://app.contrezz.com"}`;
          const urlTextWidth = doc.widthOfString(urlText);
          doc.text(urlText, centerX - urlTextWidth / 2, footerY + 25, { lineBreak: false });

          // Page number - right aligned
          const pageText = `Page ${pageNumber}`;
          const pageTextWidth = doc.widthOfString(pageText);
          doc.text(pageText, rightX - pageTextWidth, footerY + 25, { lineBreak: false });
        };

        // Microsoft approach: Simple page break check for very large content only
        // With lineBreak: false on all text, PDFKit won't auto-create pages
        const checkPageBreak = (requiredHeight: number) => {
          const pageHeight = 842; // A4 height in points
          const footerHeight = 80;
          const topMargin = 40;
          const maxY = pageHeight - footerHeight;

          // Only create new page for VERY large content (tables with many rows)
          if (requiredHeight > 400 && currentY + requiredHeight > maxY) {
            addFooter();
            doc.addPage();
            pageNumber++;
            currentY = topMargin;
          }
        };

        // Report Details Section with professional formatting
        // Microsoft approach: Don't check page break for small sections
        currentY = addSectionHeader("Report Information", currentY);

        // Details in a styled box
        const detailsBoxY = currentY;
        doc.rect(40, detailsBoxY, 515, 80)
           .fillColor('#F9FAFB')
           .fill()
           .strokeColor('#E5E7EB')
           .lineWidth(1)
           .stroke();

        currentY = addKeyValue("Report Type", reportLabel, detailsBoxY + 15);
        currentY = addKeyValue("Property", propertyLabel, currentY);
        currentY = addKeyValue("Date Range", dateRange, currentY);
        currentY = addKeyValue("Generated", generatedAt, currentY);

        currentY += 20;

        // Report Data Section
        if (report.data) {
          // Add report data based on type
          if (report.type === "financial" && report.data.portfolio) {
            const portfolio = report.data.portfolio;
            // Get currency from portfolio data (set by frontend based on property selection)
            const reportCurrency = portfolio.currency || "NGN";

            // Key Metrics Section
            // Microsoft: Don't force page break for small sections
            currentY = addSectionHeader("Key Performance Metrics", currentY);

            const metricsStartY = currentY;
            const cardWidth = 120;
            const cardSpacing = 10;
            let cardX = 40;

            // Metric cards in a row (4 cards)
            addMetricCard("Total Properties", String(portfolio.totalProperties || 0), cardX, metricsStartY, cardWidth);
            cardX += cardWidth + cardSpacing;
            addMetricCard("Total Units", String(portfolio.totalUnits || 0), cardX, metricsStartY, cardWidth);
            cardX += cardWidth + cardSpacing;
            addMetricCard("Occupied", String(portfolio.occupiedUnits || 0), cardX, metricsStartY, cardWidth);
            cardX += cardWidth + cardSpacing;
            addMetricCard("Occupancy", `${(portfolio.occupancyRate || 0).toFixed(1)}%`, cardX, metricsStartY, cardWidth);

            currentY = metricsStartY + 80;

            // Financial Summary Section
            // Microsoft: Don't force page break for small tables
            currentY = addSectionHeader("Financial Summary", currentY);

            const financialTableHeaders = ["Metric", "Amount"];
            const financialRows = [
              ["Total Revenue", formatCurrency(portfolio.totalRevenue || 0, reportCurrency)],
              ["Total Expenses", formatCurrency(portfolio.totalExpenses || 0, reportCurrency)],
              ["Net Operating Income", formatCurrency(portfolio.netOperatingIncome || 0, reportCurrency)],
            ];
            currentY = drawTable(financialTableHeaders, financialRows, currentY, [300, 215]);

            // Expense Categories Section
            if (report.data.expenses?.categories?.length > 0) {
              // Microsoft: Only check page break for large tables
              const tableHeight = 50 + (report.data.expenses.categories.length * 25);
              if (tableHeight > 300) {
                checkPageBreak(tableHeight);
              }
              currentY = addSectionHeader("Expense Breakdown by Category", currentY);

              const expenseHeaders = ["Category", "Amount", "Items"];
              const expenseRows = report.data.expenses.categories.map((cat: any) => [
                cat.label || cat.category,
                formatCurrency(cat.amount, cat.currency || reportCurrency),
                String(cat.count || 0)
              ]);
              currentY = drawTable(expenseHeaders, expenseRows, currentY, [250, 150, 115]);
            }
          } else if (report.type === "occupancy" && report.data.summary) {
            const summary = report.data.summary;

            // Occupancy Overview Section
            // Microsoft: Don't force page break
            currentY = addSectionHeader("Occupancy Overview", currentY);

            const occupancyHeaders = ["Metric", "Value"];
            const occupancyRows = [
              ["Total Properties", String(summary.totalProperties || 0)],
              ["Total Units", String(summary.totalUnits || 0)],
              ["Occupied Units", String(summary.occupiedUnits || 0)],
              ["Vacant Units", String(summary.vacantUnits || 0)],
              ["Occupancy Rate", `${(summary.occupancyRate || 0).toFixed(1)}%`],
            ];
            currentY = drawTable(occupancyHeaders, occupancyRows, currentY, [300, 215]);

            // Property Breakdown Section
            if (report.data.propertyBreakdown?.length > 0) {
              // Microsoft: Only check for very large tables
              const tableHeight = 50 + (report.data.propertyBreakdown.length * 25);
              if (tableHeight > 300) {
                checkPageBreak(tableHeight);
              }
              currentY = addSectionHeader("Property Breakdown", currentY);

              const propertyHeaders = ["Property", "Occupied", "Total", "Occupancy Rate", "Revenue"];
              const propertyRows = report.data.propertyBreakdown.map((prop: any) => [
                prop.name || "Unknown",
                String(prop.occupiedUnits || 0),
                String(prop.totalUnits || 0),
                `${(prop.occupancyRate || 0).toFixed(1)}%`,
                formatCurrency(prop.monthlyRevenue || 0, prop.currency || "NGN")
              ]);
              currentY = drawTable(propertyHeaders, propertyRows, currentY, [180, 80, 80, 100, 75]);
            }
          } else if (report.type === "maintenance" && report.data.summary) {
            const summary = report.data.summary;
            // Get currency from summary data (set by frontend based on property selection)
            const maintenanceCurrency = summary.currency || "NGN";

            // Maintenance Overview Section
            // Microsoft: Don't force page break
            currentY = addSectionHeader("Maintenance Overview", currentY);

            const maintenanceHeaders = ["Metric", "Value"];
            const maintenanceRows = [
              ["Total Requests", String(summary.totalRequests || 0)],
              ["Completed", String(summary.completed || 0)],
              ["Open Requests", String(summary.open || 0)],
              ["High Priority", String(summary.highPriority || 0)],
              ["Average Cost", formatCurrency(summary.averageCost || 0, maintenanceCurrency)],
            ];
            currentY = drawTable(maintenanceHeaders, maintenanceRows, currentY, [300, 215]);

            // High Priority Requests Section
            if (report.data.highPriorityRequests?.length > 0) {
              // Microsoft: Only check for very large tables
              const tableHeight = 50 + (report.data.highPriorityRequests.length * 25);
              if (tableHeight > 300) {
                checkPageBreak(tableHeight);
              }
              currentY = addSectionHeader("High Priority Requests", currentY);

              const requestHeaders = ["Request", "Status", "Priority"];
              const requestRows = report.data.highPriorityRequests
                .slice(0, 10)
                .map((req: any) => [
                  (req.title || req.description || "Request").substring(0, 40),
                  req.status || "Pending",
                  (req.priority || "Medium").toUpperCase()
                ]);
              currentY = drawTable(requestHeaders, requestRows, currentY, [300, 100, 115]);
            }
          } else if (report.type === "tenant") {
            // Tenant Overview Section
            // Microsoft: Don't force page break
            currentY = addSectionHeader("Tenant Overview", currentY);

            const tenantHeaders = ["Metric", "Value"];
            const tenantRows = [
              ["Total Tenants", String(report.data.totalTenants || 0)],
              ["Leases Expiring Soon (30 days)", String(report.data.expiringSoon || 0)],
            ];
            currentY = drawTable(tenantHeaders, tenantRows, currentY, [300, 215]);

            // Tenant List Section
            if (report.data.tenants?.length > 0) {
              // Microsoft: Only check for very large tables
              const tableHeight = 50 + (Math.min(report.data.tenants.length, 15) * 25);
              if (tableHeight > 300) {
                checkPageBreak(tableHeight);
              }
              currentY = addSectionHeader("Tenant List", currentY);

              const tenantListHeaders = ["Tenant Name", "Unit", "Status", "Lease End"];
              const tenantListRows = report.data.tenants.slice(0, 15).map((tenant: any) => [
                tenant.tenantName || "Unknown",
                tenant.unitNumber || "N/A",
                tenant.status || "Active",
                tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString() : "N/A"
              ]);
              currentY = drawTable(tenantListHeaders, tenantListRows, currentY, [200, 80, 100, 135]);
            }
          } else if (report.type === "all") {
            // Complete Portfolio Overview
            // Microsoft: Don't force page break
            currentY = addSectionHeader("Complete Portfolio Overview", currentY);

            const portfolioData: string[][] = [];

            if (report.data.financial?.portfolio) {
              const portfolio = report.data.financial.portfolio;
              const portfolioCurrency = portfolio.currency || "NGN";
              portfolioData.push(["Total Properties", String(portfolio.totalProperties || 0)]);
              portfolioData.push(["Total Units", String(portfolio.totalUnits || 0)]);
              portfolioData.push(["Total Revenue", formatCurrency(portfolio.totalRevenue || 0, portfolioCurrency)]);
              portfolioData.push(["Net Operating Income", formatCurrency(portfolio.netOperatingIncome || 0, portfolioCurrency)]);
            }

            if (report.data.occupancy?.summary) {
              portfolioData.push(["Occupancy Rate", `${(report.data.occupancy.summary.occupancyRate || 0).toFixed(1)}%`]);
            }

            if (report.data.maintenance?.summary) {
              portfolioData.push(["Open Maintenance Requests", String(report.data.maintenance.summary.open || 0)]);
            }

            if (report.data.tenant) {
              portfolioData.push(["Total Tenants", String(report.data.tenant.totalTenants || 0)]);
            }

            if (portfolioData.length > 0) {
              currentY = drawTable(["Metric", "Value"], portfolioData, currentY, [300, 215]);
            }
          } else {
            currentY = addSectionHeader("Report Summary", currentY);
            doc.fontSize(11)
               .fillColor('#6B7280')
               .font('Helvetica')
               .text("Report data included. View detailed analysis in your dashboard.", 40, currentY, { lineBreak: false });
            currentY += 30;
          }
        }

        // Word Processing Approach: Check content boundaries before adding footer
        // This prevents blank pages by ensuring footer is only on pages with content
        const pageHeight = 842; // A4 height in points
        const footerY = pageHeight - 60; // Footer starts at Y=782
        const footerEndY = footerY + 40; // Footer ends at Y=822 (within page 842)
        const topMargin = 40;

        // Get current page information
        const pageRange = doc.bufferedPageRange();
        const totalPages = pageRange ? pageRange.count : 1;

        // Word Processing Rule: Only add footer if content exists on the page
        // Check if currentY is within valid content area (above footer)
        if (currentY > topMargin && currentY < footerY) {
          // Content exists on current page - add footer
          addFooter();
        } else if (currentY <= topMargin && totalPages > 1) {
          // Current page appears empty (cursor at top) and we have multiple pages
          // Go back to previous page to add footer there
          doc.switchToPage(pageRange.start + totalPages - 2);
          addFooter();
        } else if (currentY >= footerY) {
          // Content extends into footer area - this shouldn't happen, but handle it
          // Move content up or create new page
          if (totalPages > 1) {
            // Go to previous page
            doc.switchToPage(pageRange.start + totalPages - 2);
            addFooter();
          } else {
            // Only one page, add footer anyway (content might be overlapping)
            addFooter();
          }
        } else {
          // Single page with content - add footer
          addFooter();
        }

        // Word Processing Rule: Finalize document properly
        // Word Processing Approach: Finalize document properly
        // Reset any internal cursor state to prevent blank page creation
        const finalPageRange = doc.bufferedPageRange();
        if (finalPageRange && finalPageRange.count > 0) {
          // Switch to the last page to ensure we're on a valid page
          doc.switchToPage(finalPageRange.start + finalPageRange.count - 1);
        }

        // End document - this should not create new pages if we've positioned everything correctly
        doc.end();
      });

      // Send email with PDF attachment
      try {
        // Get email config with properly formatted sender name
        const { getEmailConfig } = await import("../lib/email");
        const emailConfig = getEmailConfig();
        const transporter = getTransporter();

        await transporter.sendMail({
          from: emailConfig.from, // Already formatted as "Sender Name" <email@example.com>
          to: email.trim(),
          subject: subjectLine,
          html,
          text,
          attachments: [
            {
              filename: `${reportLabel}_Report_${
                new Date().toISOString().split("T")[0]
              }.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });

        return res.json({
          success: true,
          message: "Report email sent with PDF attachment",
        });
      } catch (emailError: any) {
        console.error("Failed to send email with attachment:", emailError);
        return res.status(500).json({ error: "Failed to send report email" });
      }
    } catch (error: any) {
      console.error("Failed to send scheduled report email:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;

// Owner: Cancel subscription (best-practice: owner-scoped endpoint)
router.post(
  "/owner/subscription/cancel",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const roleRaw = req.user?.role || "";
      const role = roleRaw.toLowerCase();
      const isOwner = ["owner", "property_owner", "property owner"].includes(
        role
      );

      if (!isOwner) {
        return res.status(403).json({ error: "Access denied. Owner only." });
      }

      // Resolve owner's customerId
      const user = await prisma.user.findUnique({
        where: { id: userId || "" },
      });
      if (!user || !user.customerId) {
        return res
          .status(404)
          .json({ error: "Owner account not linked to a customer" });
      }

      // Update customer status to cancelled
      const customer = await prisma.customer.update({
        where: { id: user.customerId },
        data: { status: "cancelled" },
      });

      // Emit realtime updates
      try {
        emitToAdmins("customer:updated", { customer });
      } catch {}
      try {
        emitToCustomer(customer.id, "account:updated", { customer });
      } catch {}

      return res.json({ message: "Subscription cancelled", customer });
    } catch (error: any) {
      console.error("Owner cancel subscription error:", error);
      return res.status(500).json({ error: "Failed to cancel subscription" });
    }
  }
);
