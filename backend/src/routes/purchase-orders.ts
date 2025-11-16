import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import prisma from '../lib/db';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// Get Purchase Orders for a Project
// ============================================
router.get('/projects/:projectId/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;
    const customerId = (req as any).user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing user information' });
    }

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get purchase orders with vendor details
    const purchaseOrders = await prisma.purchase_orders.findMany({
      where: {
        projectId,
        customerId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        requester: {
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
        items: true,
        _count: {
          select: {
            invoices: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate stats
    const stats = {
      totalValue: purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0),
      approvedCount: purchaseOrders.filter(po => po.status === 'approved').length,
      pendingCount: purchaseOrders.filter(po => po.status === 'pending').length,
      totalCount: purchaseOrders.length,
    };

    res.json({
      data: purchaseOrders,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching purchase orders:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      meta: error?.meta,
    });
    res.status(500).json({
      error: 'Failed to fetch purchase orders',
      details: error?.message || 'Unknown error',
    });
  }
});

// ============================================
// Get Single Purchase Order
// ============================================
router.get('/purchase-orders/:poId', async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    const purchaseOrder = await prisma.purchase_orders.findFirst({
      where: {
        id: poId,
        customerId,
      },
      include: {
        vendor: true,
        requester: {
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
        items: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        invoices: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error: any) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// ============================================
// Create Purchase Order
// ============================================
router.post('/projects/:projectId/purchase-orders', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;
    const customerId = (req as any).user?.customerId;

    if (!userId || !customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing user information' });
    }

    // Verify project ownership
    const project = await prisma.developer_projects.findFirst({
      where: {
        id: projectId,
        customerId,
        developerId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const {
      vendorId,
      description,
      category,
      totalAmount,
      currency = 'NGN',
      status = 'pending',
      expiryDate,
      deliveryDate,
      terms,
      notes,
      items = [],
    } = req.body;

    // Validation
    if (!description || !category || !totalAmount) {
      return res.status(400).json({
        error: 'Missing required fields: description, category, totalAmount',
      });
    }

    // Generate unique PO number with retry logic to handle race conditions
    let poNumber: string;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      const year = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');

      // Get count for this project (more specific than year-based)
      const count = await prisma.purchase_orders.count({
        where: { projectId },
      });

      // Generate PO number: PO-YEAR-COUNT-TIMESTAMP-RANDOM
      poNumber = `PO-${year}-${String(count + 1).padStart(3, '0')}-${timestamp}${random}`;

      // Check if this PO number already exists
      const existing = await prisma.purchase_orders.findUnique({
        where: { poNumber },
      });

      if (!existing) {
        break; // Unique PO number found
      }

      attempts++;
      if (attempts >= maxAttempts) {
        return res.status(500).json({
          error: 'Failed to generate unique PO number after multiple attempts',
        });
      }
    }

    // Create purchase order with items in a transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      const po = await tx.purchase_orders.create({
        data: {
          projectId,
          customerId,
          vendorId,
          poNumber,
          description,
          category,
          totalAmount,
          currency,
          status,
          itemCount: items.length,
          requestedBy: userId,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          terms,
          notes,
        },
        include: {
          vendor: true,
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create line items if provided
      if (items.length > 0) {
        await tx.purchase_order_items.createMany({
          data: items.map((item: any) => ({
            purchaseOrderId: po.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            unit: item.unit,
            category: item.category,
            notes: item.notes,
          })),
        });
      }

      return po;
    });

    res.status(201).json(purchaseOrder);
  } catch (error: any) {
      console.error('Error creating purchase order:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      });
      res.status(500).json({
        error: 'Failed to create purchase order',
        details: error?.message || 'Unknown error',
      });
    }
  });

// ============================================
// Update Purchase Order
// ============================================
router.patch('/purchase-orders/:poId', async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify ownership
    const existing = await prisma.purchase_orders.findFirst({
      where: {
        id: poId,
        customerId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const {
      vendorId,
      description,
      category,
      totalAmount,
      status,
      expiryDate,
      deliveryDate,
      terms,
      notes,
      items = [],
    } = req.body;

    // Use transaction to update PO and items atomically
    const updatedPO = await prisma.$transaction(async (tx) => {
      // Update the purchase order
      const po = await tx.purchase_orders.update({
        where: { id: poId },
        data: {
          ...(vendorId !== undefined && { vendorId }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(totalAmount !== undefined && { totalAmount }),
          ...(status !== undefined && { status }),
          ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
          ...(deliveryDate !== undefined && { deliveryDate: deliveryDate ? new Date(deliveryDate) : null }),
          ...(terms !== undefined && { terms }),
          ...(notes !== undefined && { notes }),
          itemCount: items.length > 0 ? items.length : existing.itemCount,
        },
      });

      // If items are provided, update them
      if (items.length > 0) {
        // Delete existing items
        await tx.purchase_order_items.deleteMany({
          where: { purchaseOrderId: poId },
        });

        // Create new items
        await tx.purchase_order_items.createMany({
          data: items.map((item: any) => ({
            purchaseOrderId: poId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            unit: item.unit,
            category: item.category,
            notes: item.notes,
          })),
        });
      }

      // Fetch the complete updated PO with items
      return await tx.purchase_orders.findUnique({
        where: { id: poId },
        include: {
          vendor: true,
          requester: {
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
          items: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    res.json(updatedPO);
  } catch (error: any) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
});

// ============================================
// Approve Purchase Order
// ============================================
router.post('/purchase-orders/:poId/approve', async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;

    // Verify ownership
    const existing = await prisma.purchase_orders.findFirst({
      where: {
        id: poId,
        customerId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    if (existing.status === 'approved') {
      return res.status(400).json({ error: 'Purchase order is already approved' });
    }

    const updatedPO = await prisma.purchase_orders.update({
      where: { id: poId },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
      include: {
        vendor: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedPO);
  } catch (error: any) {
    console.error('Error approving purchase order:', error);
    res.status(500).json({ error: 'Failed to approve purchase order' });
  }
});

// ============================================
// Reject Purchase Order
// ============================================
router.post('/purchase-orders/:poId/reject', async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;
    const userId = (req as any).user.id;
    const customerId = (req as any).user.customerId;
    const { reason } = req.body;

    // Verify ownership
    const existing = await prisma.purchase_orders.findFirst({
      where: {
        id: poId,
        customerId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const updatedPO = await prisma.purchase_orders.update({
      where: { id: poId },
      data: {
        status: 'rejected',
        approvedBy: userId,
        approvedAt: new Date(),
        notes: reason ? `${existing.notes || ''}\nRejection reason: ${reason}` : existing.notes,
      },
      include: {
        vendor: true,
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedPO);
  } catch (error: any) {
    console.error('Error rejecting purchase order:', error);
    res.status(500).json({ error: 'Failed to reject purchase order' });
  }
});

// ============================================
// Delete Purchase Order
// ============================================
router.delete('/purchase-orders/:poId', async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;
    const customerId = (req as any).user.customerId;

    // Verify ownership
    const existing = await prisma.purchase_orders.findFirst({
      where: {
        id: poId,
        customerId,
      },
      include: {
        _count: {
          select: {
            invoices: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Check if there are linked invoices
    if (existing._count.invoices > 0) {
      return res.status(400).json({
        error: 'Cannot delete purchase order with linked invoices',
      });
    }

    // Delete purchase order (items will be cascade deleted)
    await prisma.purchase_orders.delete({
      where: { id: poId },
    });

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
});

// ============================================
// Get Invoices for a Purchase Order
// ============================================
router.get('/purchase-orders/:poId/invoices', async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;
    const customerId = (req as any).user.customerId;

    // Verify PO ownership
    const po = await prisma.purchase_orders.findFirst({
      where: {
        id: poId,
        customerId,
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const invoices = await prisma.project_invoices.findMany({
      where: {
        purchaseOrderId: poId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            email: true,
            phone: true,
          },
        },
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            totalAmount: true,
            status: true,
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: invoices });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// ============================================
// Add Line Items to Purchase Order
// ============================================
router.post('/purchase-orders/:poId/items', async (req: Request, res: Response) => {
  try {
    const { poId } = req.params;
    const customerId = (req as any).user.customerId;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Verify PO ownership
    const po = await prisma.purchase_orders.findFirst({
      where: {
        id: poId,
        customerId,
      },
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    // Create items
    const createdItems = await prisma.purchase_order_items.createMany({
      data: items.map((item: any) => ({
        purchaseOrderId: poId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
      })),
    });

    // Update PO item count and total amount
    const allItems = await prisma.purchase_order_items.findMany({
      where: { purchaseOrderId: poId },
    });

    const totalAmount = allItems.reduce((sum, item) => sum + item.totalPrice, 0);

    await prisma.purchase_orders.update({
      where: { id: poId },
      data: {
        itemCount: allItems.length,
        totalAmount,
      },
    });

    res.status(201).json({ message: 'Items added successfully', count: createdItems.count });
  } catch (error: any) {
    console.error('Error adding items:', error);
    res.status(500).json({ error: 'Failed to add items' });
  }
});

export default router;

