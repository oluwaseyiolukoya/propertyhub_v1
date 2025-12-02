import express, { Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import prisma from "../lib/db";
import { randomUUID } from "crypto";

const router = express.Router();

router.use(authMiddleware);

// Get expense statistics (must be before /:id route)
router.get("/stats/overview", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { propertyId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Normalize role
    const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    const isOwner =
      normalizedRole === "owner" || normalizedRole === "propertyowner";
    const isManager =
      normalizedRole === "manager" || normalizedRole === "propertymanager";

    if (!isOwner && !isManager) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Build where clause
    const whereClause: any = {};

    // Filter by property ownership/management
    if (isOwner) {
      const properties = await prisma.properties.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const propertyIds = properties.map((p) => p.id);
      whereClause.propertyId = { in: propertyIds };
    } else if (isManager) {
      const assignments = await prisma.property_managers.findMany({
        where: { managerId: userId, isActive: true },
        select: { propertyId: true },
      });
      const propertyIds = assignments.map((a) => a.propertyId);
      whereClause.propertyId = { in: propertyIds };
    }

    if (propertyId && typeof propertyId === "string") {
      whereClause.propertyId = propertyId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    // Get total expenses
    const totalExpenses = await prisma.expenses.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get expenses by category
    const expensesByCategory = await prisma.expenses.groupBy({
      by: ["category"],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          amount: "desc",
        },
      },
    });

    // Get expenses by status
    const expensesByStatus = await prisma.expenses.groupBy({
      by: ["status"],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get expenses by property (for owners)
    let expensesByProperty = [];
    if (isOwner) {
      const properties = await prisma.properties.findMany({
        where: { ownerId: userId },
        select: { id: true, name: true, currency: true },
      });

      const propertyExpenses = await prisma.expenses.groupBy({
        by: ["propertyId"],
        where: {
          ...whereClause,
          propertyId: { in: properties.map((p) => p.id) },
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      expensesByProperty = propertyExpenses.map((exp) => {
        const property = properties.find((p) => p.id === exp.propertyId);
        return {
          propertyId: exp.propertyId,
          propertyName: property?.name || "Unknown",
          currency: property?.currency || "NGN",
          totalAmount: exp._sum.amount || 0,
          count: exp._count,
        };
      });
    }

    return res.json({
      totalAmount: totalExpenses._sum.amount || 0,
      totalCount: totalExpenses._count,
      byCategory: expensesByCategory,
      byStatus: expensesByStatus,
      byProperty: expensesByProperty,
    });
  } catch (error: any) {
    console.error("Get expense stats error:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch expense statistics" });
  }
});

// Get all expenses
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { propertyId, category, status, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Normalize role
    const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    const isOwner =
      normalizedRole === "owner" || normalizedRole === "propertyowner";
    const isManager =
      normalizedRole === "manager" || normalizedRole === "propertymanager";

    if (!isOwner && !isManager) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Build where clause
    const whereClause: any = {};

    // Filter by property ownership/management
    if (isOwner) {
      const properties = await prisma.properties.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      const propertyIds = properties.map((p) => p.id);
      whereClause.propertyId = { in: propertyIds };
    } else if (isManager) {
      const assignments = await prisma.property_managers.findMany({
        where: { managerId: userId, isActive: true },
        select: { propertyId: true },
      });
      const propertyIds = assignments.map((a) => a.propertyId);
      whereClause.propertyId = { in: propertyIds };

      // Managers can only see:
      // 1. Expenses they created themselves OR
      // 2. Expenses marked as visible to managers
      whereClause.OR = [{ recordedBy: userId }, { visibleToManager: true }];
    }

    // Apply filters
    if (propertyId && typeof propertyId === "string") {
      whereClause.propertyId = propertyId;
    }

    if (category && typeof category === "string") {
      whereClause.category = category;
    }

    if (status && typeof status === "string") {
      whereClause.status = status;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const expenses = await prisma.expenses.findMany({
      where: whereClause,
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        units: {
          select: {
            id: true,
            unitNumber: true,
          },
        },
        users_expenses_recordedByTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_expenses_approvedByTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Map Prisma relations to API-friendly shape expected by frontend
    const mappedExpenses = expenses.map((expense: any) => ({
      id: expense.id,
      propertyId: expense.propertyId,
      unitId: expense.unitId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      dueDate: expense.dueDate,
      status: expense.status,
      paidDate: expense.paidDate,
      paymentMethod: expense.paymentMethod,
      recordedBy: expense.recordedBy,
      recordedByRole: expense.recordedByRole,
      receipt: expense.receipt,
      notes: expense.notes,
      requiresApproval: expense.requiresApproval,
      approvedBy: expense.approvedBy,
      approvedAt: expense.approvedAt,
      visibleToManager: expense.visibleToManager,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      // Normalized relation names
      property: expense.properties
        ? {
            id: expense.properties.id,
            name: expense.properties.name,
            currency: expense.properties.currency || "NGN",
          }
        : undefined,
      unit: expense.units
        ? {
            id: expense.units.id,
            unitNumber: expense.units.unitNumber,
          }
        : undefined,
      recorder: expense.users_expenses_recordedByTousers
        ? {
            id: expense.users_expenses_recordedByTousers.id,
            name: expense.users_expenses_recordedByTousers.name,
            email: expense.users_expenses_recordedByTousers.email,
          }
        : undefined,
      approver: expense.users_expenses_approvedByTousers
        ? {
            id: expense.users_expenses_approvedByTousers.id,
            name: expense.users_expenses_approvedByTousers.name,
            email: expense.users_expenses_approvedByTousers.email,
          }
        : undefined,
    }));

    return res.json({ data: mappedExpenses });
  } catch (error: any) {
    console.error("Get expenses error:", error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Get single expense
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const expense = await prisma.expenses.findUnique({
      where: { id },
      include: {
        properties: true,
        units: true,
        users_expenses_recordedByTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_expenses_approvedByTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Check access
    const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    const isOwner =
      normalizedRole === "owner" || normalizedRole === "propertyowner";
    const isManager =
      normalizedRole === "manager" || normalizedRole === "propertymanager";

    if (isOwner) {
      const property = await prisma.properties.findUnique({
        where: { id: expense.propertyId },
      });
      if (property?.ownerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (isManager) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: expense.propertyId,
          managerId: userId,
          isActive: true,
        },
      });
      if (!assignment) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Normalize to API shape consistent with list endpoint
    const mappedExpense: any = {
      id: expense.id,
      propertyId: expense.propertyId,
      unitId: expense.unitId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      dueDate: expense.dueDate,
      status: expense.status,
      paidDate: expense.paidDate,
      paymentMethod: expense.paymentMethod,
      recordedBy: expense.recordedBy,
      recordedByRole: expense.recordedByRole,
      receipt: expense.receipt,
      notes: expense.notes,
      requiresApproval: expense.requiresApproval,
      approvedBy: expense.approvedBy,
      approvedAt: expense.approvedAt,
      visibleToManager: expense.visibleToManager,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      property: expense.properties
        ? {
            id: expense.properties.id,
            name: expense.properties.name,
            currency: expense.properties.currency || "NGN",
          }
        : undefined,
      unit: expense.units
        ? {
            id: expense.units.id,
            unitNumber: expense.units.unitNumber,
          }
        : undefined,
      recorder: expense.users_expenses_recordedByTousers
        ? {
            id: expense.users_expenses_recordedByTousers.id,
            name: expense.users_expenses_recordedByTousers.name,
            email: expense.users_expenses_recordedByTousers.email,
          }
        : undefined,
      approver: expense.users_expenses_approvedByTousers
        ? {
            id: expense.users_expenses_approvedByTousers.id,
            name: expense.users_expenses_approvedByTousers.name,
            email: expense.users_expenses_approvedByTousers.email,
          }
        : undefined,
    };

    return res.json({ data: mappedExpense });
  } catch (error: any) {
    console.error("Get expense error:", error);
    return res.status(500).json({ error: "Failed to fetch expense" });
  }
});

// Create expense
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const {
      propertyId,
      unitId,
      category,
      description,
      amount,
      currency,
      date,
      dueDate,
      status,
      paymentMethod,
      receipt,
      notes,
      visibleToManager,
    } = req.body;

    if (!userId || !propertyId || !category || !description || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Normalize role
    const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    const isOwner =
      normalizedRole === "owner" || normalizedRole === "propertyowner";
    const isManager =
      normalizedRole === "manager" || normalizedRole === "propertymanager";

    if (!isOwner && !isManager) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check property access
    if (isOwner) {
      const property = await prisma.properties.findUnique({
        where: { id: propertyId },
      });
      if (property?.ownerId !== userId) {
        return res
          .status(403)
          .json({ error: "Access denied to this property" });
      }
    } else if (isManager) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId,
          managerId: userId,
          isActive: true,
        },
      });
      if (!assignment) {
        return res
          .status(403)
          .json({ error: "Access denied to this property" });
      }
    }

    // Create expense
    const expense = await prisma.expenses.create({
      data: {
        id: randomUUID(),
        propertyId,
        unitId: unitId || null,
        category,
        description,
        amount: parseFloat(amount),
        currency: currency || "NGN",
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || "pending",
        paymentMethod: paymentMethod || null,
        recordedBy: userId,
        recordedByRole: role || "owner",
        receipt: receipt || null,
        notes: notes || null,
        requiresApproval: isManager, // Managers need approval
        visibleToManager:
          visibleToManager !== undefined ? visibleToManager : false, // Default false (hidden from managers)
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        units: {
          select: {
            id: true,
            unitNumber: true,
          },
        },
        users_expenses_recordedByTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({ data: expense });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return res.status(500).json({ error: "Failed to create expense" });
  }
});

// Update expense
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;
    const {
      category,
      description,
      amount,
      currency,
      date,
      dueDate,
      status,
      paidDate,
      paymentMethod,
      receipt,
      notes,
      visibleToManager,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if expense exists and user has access
    const expense = await prisma.expenses.findUnique({
      where: { id },
      include: { properties: true },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Normalize role
    const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    const isOwner =
      normalizedRole === "owner" || normalizedRole === "propertyowner";
    const isManager =
      normalizedRole === "manager" || normalizedRole === "propertymanager";

    // Check access
    if (isOwner) {
      if (expense.properties.ownerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (isManager) {
      const assignment = await prisma.property_managers.findFirst({
        where: {
          propertyId: expense.propertyId,
          managerId: userId,
          isActive: true,
        },
      });
      if (!assignment || expense.recordedBy !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Update expense
    const updatedExpense = await prisma.expenses.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(description && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(currency && { currency }),
        ...(date && { date: new Date(date) }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(status && { status }),
        ...(paidDate !== undefined && {
          paidDate: paidDate ? new Date(paidDate) : null,
        }),
        ...(paymentMethod !== undefined && { paymentMethod }),
        ...(receipt !== undefined && { receipt }),
        ...(notes !== undefined && { notes }),
        ...(visibleToManager !== undefined && { visibleToManager }),
        updatedAt: new Date(),
      },
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
        units: {
          select: {
            id: true,
            unitNumber: true,
          },
        },
        users_expenses_recordedByTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        users_expenses_approvedByTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json({ data: updatedExpense });
  } catch (error: any) {
    console.error("❌ Update expense error:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return res.status(500).json({
      error: "Failed to update expense",
      details: error?.message,
    });
  }
});

// Delete expense
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if expense exists and user has access
    const expense = await prisma.expenses.findUnique({
      where: { id },
      include: { properties: true },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Normalize role
    const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    const isOwner =
      normalizedRole === "owner" || normalizedRole === "propertyowner";

    // Only owners can delete expenses
    if (!isOwner || expense.properties.ownerId !== userId) {
      return res
        .status(403)
        .json({ error: "Only property owners can delete expenses" });
    }

    await prisma.expenses.delete({
      where: { id },
    });

    return res.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("Delete expense error:", error);
    return res.status(500).json({ error: "Failed to delete expense" });
  }
});

// Approve expense (owner only)
router.post("/:id/approve", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Normalize role
    const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");
    const isOwner =
      normalizedRole === "owner" || normalizedRole === "propertyowner";

    if (!isOwner) {
      return res
        .status(403)
        .json({ error: "Only owners can approve expenses" });
    }

    // Check if expense exists
    const expense = await prisma.expenses.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    if (expense.properties.ownerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (!expense.requiresApproval) {
      return res
        .status(400)
        .json({ error: "This expense does not require approval" });
    }

    // Approve expense
    const updatedExpense = await prisma.expenses.update({
      where: { id },
      data: {
        requiresApproval: false,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.json({ data: updatedExpense });
  } catch (error: any) {
    console.error("Approve expense error:", error);
    return res.status(500).json({ error: "Failed to approve expense" });
  }
});

export default router;
