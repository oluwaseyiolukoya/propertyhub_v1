import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ============================================
// Get all vendors for a customer
// ============================================
router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing customer information' });
    }

    const { status, vendorType, search } = req.query;

    // Build where clause
    const where: any = {
      customerId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (vendorType && vendorType !== 'all') {
      where.vendorType = vendorType;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { contactPerson: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const vendors = await prisma.project_vendors.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(vendors);
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors', details: error?.message });
  }
});

// ============================================
// Get single vendor
// ============================================
router.get('/vendors/:vendorId', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const customerId = (req as any).user?.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing customer information' });
    }

    const vendor = await prisma.project_vendors.findFirst({
      where: {
        id: vendorId,
        customerId,
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error: any) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor', details: error?.message });
  }
});

// ============================================
// Create vendor
// ============================================
router.post('/vendors', async (req: Request, res: Response) => {
  try {
    const customerId = (req as any).user?.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing customer information' });
    }

    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      vendorType,
      specialization,
      rating,
      status = 'active',
      notes,
    } = req.body;

    // Validation
    if (!name || !vendorType) {
      return res.status(400).json({
        error: 'Missing required fields: name, vendorType',
      });
    }

    // Check for duplicate vendor name for this customer
    const existingVendor = await prisma.project_vendors.findFirst({
      where: {
        customerId,
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingVendor) {
      return res.status(400).json({
        error: 'A vendor with this name already exists',
      });
    }

    const vendor = await prisma.project_vendors.create({
      data: {
        customerId,
        name,
        contactPerson,
        email,
        phone,
        address,
        vendorType,
        specialization,
        rating: rating ? parseFloat(rating) : null,
        status,
        notes,
      },
    });

    res.status(201).json(vendor);
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor', details: error?.message });
  }
});

// ============================================
// Update vendor
// ============================================
router.patch('/vendors/:vendorId', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const customerId = (req as any).user?.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing customer information' });
    }

    // Verify vendor ownership
    const existingVendor = await prisma.project_vendors.findFirst({
      where: {
        id: vendorId,
        customerId,
      },
    });

    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const {
      name,
      contactPerson,
      email,
      phone,
      address,
      vendorType,
      specialization,
      rating,
      status,
      notes,
    } = req.body;

    // Check for duplicate name if name is being changed
    if (name && name !== existingVendor.name) {
      const duplicateVendor = await prisma.project_vendors.findFirst({
        where: {
          customerId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
          id: {
            not: vendorId,
          },
        },
      });

      if (duplicateVendor) {
        return res.status(400).json({
          error: 'A vendor with this name already exists',
        });
      }
    }

    const vendor = await prisma.project_vendors.update({
      where: {
        id: vendorId,
      },
      data: {
        ...(name && { name }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(vendorType && { vendorType }),
        ...(specialization !== undefined && { specialization }),
        ...(rating !== undefined && { rating: rating ? parseFloat(rating) : null }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(vendor);
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor', details: error?.message });
  }
});

// ============================================
// Delete vendor
// ============================================
router.delete('/vendors/:vendorId', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const customerId = (req as any).user?.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing customer information' });
    }

    // Verify vendor ownership
    const vendor = await prisma.project_vendors.findFirst({
      where: {
        id: vendorId,
        customerId,
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if vendor has associated purchase orders or invoices
    const poCount = await prisma.purchase_orders.count({
      where: { vendorId },
    });

    const invoiceCount = await prisma.project_invoices.count({
      where: { vendorId },
    });

    if (poCount > 0 || invoiceCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete vendor with existing purchase orders or invoices. Consider marking as inactive instead.',
        details: {
          purchaseOrders: poCount,
          invoices: invoiceCount,
        },
      });
    }

    await prisma.project_vendors.delete({
      where: {
        id: vendorId,
      },
    });

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor', details: error?.message });
  }
});

// ============================================
// Get vendor statistics
// ============================================
router.get('/vendors/:vendorId/stats', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const customerId = (req as any).user?.customerId;

    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized: Missing customer information' });
    }

    // Verify vendor ownership
    const vendor = await prisma.project_vendors.findFirst({
      where: {
        id: vendorId,
        customerId,
      },
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get purchase orders stats
    const purchaseOrders = await prisma.purchase_orders.findMany({
      where: { vendorId },
      select: {
        totalAmount: true,
        status: true,
        currency: true,
      },
    });

    const totalPOs = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
    const approvedPOs = purchaseOrders.filter((po) => po.status === 'approved').length;
    const pendingPOs = purchaseOrders.filter((po) => po.status === 'pending').length;

    // Get invoices stats
    const invoices = await prisma.project_invoices.findMany({
      where: { vendorId },
      select: {
        amount: true,
        status: true,
      },
    });

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
    const pendingInvoices = invoices.filter((inv) => inv.status === 'pending').length;

    res.json({
      vendor,
      stats: {
        purchaseOrders: {
          total: totalPOs,
          approved: approvedPOs,
          pending: pendingPOs,
          totalValue,
        },
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendor stats:', error);
    res.status(500).json({ error: 'Failed to fetch vendor stats', details: error?.message });
  }
});

export default router;

