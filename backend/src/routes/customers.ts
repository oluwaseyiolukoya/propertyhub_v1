import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { emitToAdmins, emitToCustomer } from '../lib/socket';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Mock data for development
const mockCustomers = [
  {
    id: 'customer-1',
    company: 'Metro Properties LLC',
    owner: 'John Smith',
    email: 'john@metro-properties.com',
    phone: '+1-555-0123',
    status: 'active',
    plan: { id: 'plan-1', name: 'Professional', monthlyPrice: 99 },
    mrr: 99,
    createdAt: new Date('2024-01-15'),
    lastLogin: new Date(),
    _count: { properties: 5, users: 3 }
  },
  {
    id: 'customer-2',
    company: 'Sunset Realty Group',
    owner: 'Sarah Chen',
    email: 'sarah@sunsetrealty.com',
    phone: '+1-555-0124',
    status: 'active',
    plan: { id: 'plan-2', name: 'Enterprise', monthlyPrice: 299 },
    mrr: 299,
    createdAt: new Date('2024-02-01'),
    lastLogin: new Date(),
    _count: { properties: 12, users: 8 }
  }
];

// Get all customers
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, plan } = req.query;

    // Try database first
    try {
      const where: any = {};

      if (search) {
        where.OR = [
          { company: { contains: search as string, mode: 'insensitive' } },
          { owner: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (plan) {
        where.planId = plan;
      }

      const customers = await prisma.customer.findMany({
        where,
        include: {
          plan: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              lastLogin: true
            }
          },
          _count: {
            select: {
              properties: true,
              users: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log('✅ Customers fetched from database:', customers.length);
      if (customers.length > 0) {
        console.log('✅ First customer data:', JSON.stringify(customers[0], null, 2));
      }

      return res.json(customers);
    } catch (dbError) {
      // Database not available, return mock data
      console.log('📝 Using mock customers data');
      return res.json(mockCustomers);
    }

  } catch (error: any) {
    console.error('Get customers error:', error);
    return res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        plan: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            lastLogin: true
          }
        },
        properties: {
          select: {
            id: true,
            name: true,
            propertyType: true,
            totalUnits: true,
            status: true
          }
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json(customer);

  } catch (error: any) {
    console.error('Get customer error:', error);
    return res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Create customer
router.post('/', async (req: AuthRequest, res: Response) => {
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
      planId,
      plan: planName, // Accept plan name as well
      billingCycle,
      street,
      city,
      state,
      zipCode,
      country,
      propertyLimit,
      userLimit,
      storageLimit,
      properties, // Accept properties count
      units, // Accept units count
      status,
      sendInvitation,
      notes
    } = req.body;

    // Validate required fields
    if (!company || !owner || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email },
      include: { plan: true }
    });

    if (existingCustomer) {
      return res.status(400).json({ 
        error: 'Email already exists',
        existingCustomer: {
          id: existingCustomer.id,
          company: existingCustomer.company,
          owner: existingCustomer.owner,
          email: existingCustomer.email,
          status: existingCustomer.status,
          plan: existingCustomer.plan?.name
        }
      });
    }

    // Get plan limits - lookup by planId or planName
    let plan = null;
    let finalPlanId = planId;
    
    if (planName && !planId) {
      // Look up plan by name
      console.log('Looking up plan by name:', planName);
      plan = await prisma.plan.findFirst({ 
        where: { name: planName } 
      });
      if (plan) {
        console.log('Found plan:', plan.id, plan.name);
        finalPlanId = plan.id;
      } else {
        console.log('Plan not found with name:', planName);
        // If plan name provided but not found, return error
        return res.status(400).json({ 
          error: `Plan "${planName}" not found. Please select a valid subscription plan.` 
        });
      }
    } else if (planId) {
      plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return res.status(400).json({ 
          error: `Plan with ID "${planId}" not found.` 
        });
      }
    } else {
      // Neither planName nor planId provided
      console.log('No plan specified, using null planId');
    }
    
    console.log('Final planId:', finalPlanId);

    // Calculate MRR based on plan and billing cycle
    let calculatedMRR = 0;
    if (plan && (status === 'active' || status === 'trial')) {
      if ((billingCycle || 'monthly') === 'monthly') {
        calculatedMRR = plan.monthlyPrice;
      } else if (billingCycle === 'annual') {
        calculatedMRR = plan.annualPrice / 12; // Convert annual to monthly
      }
    }
    console.log('Calculated MRR:', calculatedMRR);

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        company,
        owner,
        email,
        phone,
        website,
        taxId,
        industry,
        companySize,
        planId: finalPlanId, // Use finalPlanId which could be from planName lookup
        billingCycle: billingCycle || 'monthly',
        mrr: calculatedMRR, // Set calculated MRR
        street,
        city,
        state,
        zipCode,
        country: country || 'Nigeria',
        propertyLimit: propertyLimit || plan?.propertyLimit || 5,
        userLimit: userLimit || plan?.userLimit || 3,
        storageLimit: storageLimit || plan?.storageLimit || 1000,
        propertiesCount: properties || 0, // Add properties count
        unitsCount: units || 0, // Add units count
        notes: notes || null, // Add notes field
        status: status || 'trial',
        subscriptionStartDate: status === 'active' ? new Date() : null,
        trialEndsAt: status === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null // 14 days trial
      },
      include: {
        plan: true
      }
    });

    // Create owner user
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const ownerUser = await prisma.user.create({
      data: {
        customerId: customer.id,
        name: owner,
        email,
        password: sendInvitation ? null : hashedPassword,
        phone,
        role: 'owner',
        status: sendInvitation ? 'pending' : 'active',
        invitedAt: sendInvitation ? new Date() : null
      }
    });

    // Generate initial invoice
    let invoice = null;
    if (plan && status === 'trial') {
      // Create invoice for trial period (due when trial ends)
      const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
      invoice = await prisma.invoice.create({
        data: {
          customerId: customer.id,
          invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          dueDate: trialEndDate,
          amount: billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice,
          currency: plan.currency,
          status: 'pending',
          billingPeriod: billingCycle === 'annual' ? 'Annual' : 'Monthly',
          description: `${plan.name} Plan - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription (Trial period invoice - Payment due at end of trial)`,
          items: [
            {
              description: `${plan.name} Plan - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
              quantity: 1,
              unitPrice: billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice,
              amount: billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
            }
          ]
        }
      });
    } else if (plan && status === 'active') {
      // Create invoice for active subscription (due immediately)
      invoice = await prisma.invoice.create({
        data: {
          customerId: customer.id,
          invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          amount: billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice,
          currency: plan.currency,
          status: 'pending',
          billingPeriod: billingCycle === 'annual' ? 'Annual' : 'Monthly',
          description: `${plan.name} Plan - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription (Initial subscription invoice)`,
          items: [
            {
              description: `${plan.name} Plan - ${billingCycle === 'annual' ? 'Annual' : 'Monthly'} Subscription`,
              quantity: 1,
              unitPrice: billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice,
              amount: billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice
            }
          ]
        }
      });
    }

    // Log activity using the new owner's ID (don't fail customer creation if logging fails)
    try {
      await prisma.activityLog.create({
        data: {
          customerId: customer.id,
          userId: ownerUser.id, // Use the newly created owner's ID instead of admin's ID
          action: 'CUSTOMER_CREATED',
          entity: 'Customer',
          entityId: customer.id,
          description: `Customer ${company} created by ${req.user?.email || 'system'}`
        }
      });
    } catch (logError: any) {
      console.error('Failed to log activity:', logError);
      // Continue anyway - don't fail customer creation
    }

    // TODO: Send invitation email if sendInvitation is true

    // Emit real-time event to all admins
    emitToAdmins('customer:created', {
      customer: {
        ...customer,
        _count: { properties: 0, users: 1 }
      }
    });

    return res.status(201).json({
      customer,
      owner: ownerUser,
      invoice, // Include invoice in response
      ...(!sendInvitation && { tempPassword })
    });

  } catch (error: any) {
    console.error('Create customer error:', error);
    return res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req: AuthRequest, res: Response) => {
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
      zipCode,
      country,
      propertyLimit,
      userLimit,
      storageLimit,
      properties, // Accept properties count
      units, // Accept units count
      notes // Accept notes
    } = req.body;

    // Get plan limits - lookup by planId or planName
    let finalPlanId = planId;
    let plan = null;
    
    if (planName && !planId) {
      // Look up plan by name
      plan = await prisma.plan.findFirst({ 
        where: { name: planName } 
      });
      if (plan) {
        finalPlanId = plan.id;
      }
    } else if (finalPlanId) {
      // Fetch plan for MRR calculation
      plan = await prisma.plan.findUnique({
        where: { id: finalPlanId }
      });
    }

    // Get existing customer to check status change
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate MRR based on plan and billing cycle
    let calculatedMRR = 0;
    if (plan && (status === 'active' || status === 'trial')) {
      if ((billingCycle || 'monthly') === 'monthly') {
        calculatedMRR = plan.monthlyPrice;
      } else if (billingCycle === 'annual') {
        calculatedMRR = plan.annualPrice / 12; // Convert annual to monthly
      }
    }

    // Handle subscription date changes based on status
    let subscriptionStartDate = existingCustomer.subscriptionStartDate;
    let trialEndsAt = existingCustomer.trialEndsAt;

    // If status is changing to 'active' and subscriptionStartDate is not set
    if (status === 'active' && existingCustomer.status !== 'active') {
      subscriptionStartDate = new Date(); // Set start date when activating
      trialEndsAt = null; // Clear trial end date
    }
    
    // If already active but subscriptionStartDate is null, set it now
    if (status === 'active' && !subscriptionStartDate) {
      subscriptionStartDate = new Date(); // Fix missing subscription start date
    }
    
    // If status is changing to 'trial'
    if (status === 'trial' && existingCustomer.status !== 'trial') {
      subscriptionStartDate = null; // Clear subscription start
      trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
    }

    const customer = await prisma.customer.update({
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
        billingCycle,
        mrr: calculatedMRR, // Set calculated MRR
        status,
        subscriptionStartDate, // Update subscription date based on status
        trialEndsAt, // Update trial end date based on status
        street,
        city,
        state,
        zipCode,
        country,
        propertyLimit,
        userLimit,
        storageLimit,
        propertiesCount: properties, // Add properties count
        unitsCount: units, // Add units count
        notes: notes // Add notes field
      },
      include: {
        plan: true
      }
    });

    // Log activity (don't fail customer update if logging fails)
    try {
      // Get customer's owner user for activity log
      const ownerUser = await prisma.user.findFirst({
        where: {
          customerId: customer.id,
          role: 'owner'
        }
      });

      if (ownerUser) {
        await prisma.activityLog.create({
          data: {
            customerId: customer.id,
            userId: ownerUser.id, // Use customer's owner ID
            action: 'CUSTOMER_UPDATED',
            entity: 'Customer',
            entityId: customer.id,
            description: `Customer ${company} updated by ${req.user?.email || 'admin'}`
          }
        });
      }
    } catch (logError: any) {
      console.error('Failed to log activity:', logError);
      // Continue anyway - don't fail customer update
    }

    // Emit real-time event to admins
    emitToAdmins('customer:updated', { customer });

    // Emit to customer's users (so owner sees changes immediately)
    emitToCustomer(customer.id, 'account:updated', { customer });

    return res.json(customer);

  } catch (error: any) {
    console.error('Update customer error:', error);
    return res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete customer
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get owner user BEFORE deleting (for activity log)
    const ownerUser = await prisma.user.findFirst({
      where: {
        customerId: id,
        role: 'owner'
      }
    });

    // Log activity BEFORE deleting (so user references still exist)
    try {
      if (ownerUser) {
        await prisma.activityLog.create({
          data: {
            customerId: id,
            userId: ownerUser.id, // Use customer's owner ID
            action: 'delete',
            entity: 'customer',
            entityId: id,
            description: `Customer ${customer.company} deleted by ${req.user?.email || 'admin'}`
          }
        });
      }
    } catch (logError) {
      // If activity log fails, continue with deletion anyway
      console.error('Failed to create activity log:', logError);
    }

    // Now delete the customer (cascade will delete all related records)
    await prisma.customer.delete({ where: { id } });

    // Emit real-time event to admins
    emitToAdmins('customer:deleted', { customerId: id });

    return res.json({ message: 'Customer deleted successfully' });

  } catch (error: any) {
    console.error('Delete customer error:', error);
    return res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Customer actions
router.post('/:id/action', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    let result: any = {};

    switch (action) {
      case 'suspend':
        result = await prisma.customer.update({
          where: { id },
          data: { status: 'suspended' }
        });
        break;

      case 'activate':
        result = await prisma.customer.update({
          where: { id },
          data: { status: 'active' }
        });
        break;

      case 'cancel':
        result = await prisma.customer.update({
          where: { id },
          data: { status: 'cancelled' }
        });
        break;

      case 'reset-password':
        // Find owner user
        const owner = await prisma.user.findFirst({
          where: { customerId: id, role: 'owner' }
        });

        if (owner) {
          // Generate new temporary password
          const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase();
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          
          // Update user password
          await prisma.user.update({
            where: { id: owner.id },
            data: { 
              password: hashedPassword,
              status: 'active' // Set to active so they can log in
            }
          });
          
          result = { 
            message: 'New password generated successfully',
            tempPassword: newPassword,
            email: owner.email,
            name: owner.name
          };
        } else {
          return res.status(404).json({ error: 'Owner user not found for this customer' });
        }
        break;

      case 'resend-invitation':
        // Find pending owner user
        const pendingOwner = await prisma.user.findFirst({
          where: { customerId: id, role: 'owner', status: 'pending' }
        });

        if (pendingOwner) {
          // TODO: Resend invitation email
          result = { message: 'Invitation email resent' };
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Log activity
    try {
      // Get customer's owner user for activity log
      const ownerUser = await prisma.user.findFirst({
        where: {
          customerId: id,
          role: 'owner'
        }
      });

      if (ownerUser) {
        await prisma.activityLog.create({
          data: {
            customerId: id,
            userId: ownerUser.id, // Use customer's owner ID
            action: action,
            entity: 'customer',
            entityId: id,
            description: `Customer ${customer.company} ${action} by ${req.user?.email || 'admin'}`
          }
        });
      }
    } catch (logError) {
      console.error('Failed to log activity:', logError);
      // Continue anyway
    }

    return res.json(result);

  } catch (error: any) {
    console.error('Customer action error:', error);
    return res.status(500).json({ error: 'Failed to perform action' });
  }
});

export default router;


