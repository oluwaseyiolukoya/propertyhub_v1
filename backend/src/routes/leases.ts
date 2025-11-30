import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';
import { sendTenantInvitation } from '../lib/email';

const router = express.Router();

router.use(authMiddleware);

// Get all leases for user's properties
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, status, search } = req.query;
    const userId = req.user?.id;
    const role = req.user?.role;

    const where: any = {
      properties: {
        OR: [
          { ownerId: userId },
          { property_managers: { some: { managerId: userId, isActive: true } } }
        ]
      }
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.tenant = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ]
      };
    }

    const leases = await prisma.leases.findMany({
      where,
      include: {
        properties: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            currency: true
          }
        },
        units: {
          select: {
            id: true,
            unitNumber: true,
            type: true,
            bedrooms: true,
            bathrooms: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(leases);

  } catch (error: any) {
    console.error('Get leases error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({
      error: 'Failed to fetch leases',
      details: error.message
    });
  }
});

// Get single lease
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const lease = await prisma.leases.findFirst({
      where: {
        id,
        properties: {
          OR: [
            { ownerId: userId },
            { property_managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: {
        properties: true,
        units: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found or access denied' });
    }

    return res.json(lease);

  } catch (error: any) {
    console.error('Get lease error:', error);
    return res.status(500).json({ error: 'Failed to fetch lease' });
  }
});

// Create lease (with tenant)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    const {
      propertyId,
      unitId,
      // Tenant info
      tenantName,
      tenantEmail,
      tenantPhone,
      emergencyContactName,
      emergencyContactPhone,
      // Lease info
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      currency,
      terms,
      specialClauses,
      sendInvitation,
      isIndefinite,
      // Optional: allow client to provide a temp password; fallback to server-generated
      tempPassword: clientProvidedTempPassword,
      password: clientProvidedPassword
    } = req.body;

    console.log('📝 Creating lease with data:', {
      propertyId,
      unitId,
      tenantName,
      tenantEmail,
      startDate,
      endDate,
      monthlyRent,
      isIndefinite
    });

    // For indefinite leases, endDate is optional
    if (!propertyId || !unitId || !tenantName || !tenantEmail || !startDate || !monthlyRent) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If not indefinite, endDate is required
    if (!isIndefinite && !endDate) {
      console.log('❌ End date required for non-indefinite lease');
      return res.status(400).json({ error: 'End date is required for fixed-term leases' });
    }

    // Check property access
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        OR: [
          { ownerId: userId },
          { property_managers: { some: { managerId: userId, isActive: true } } }
        ]
      }
    });

    if (!property) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    // Check unit availability
    const unit = await prisma.units.findFirst({
      where: {
        id: unitId,
        propertyId,
        status: { in: ['vacant', 'occupied'] }
      }
    });

    if (!unit) {
      return res.status(400).json({ error: 'Unit not available' });
    }

    // Check for overlapping leases
    // For indefinite leases (no end date), check if there's any active lease starting from the new start date
    let overlappingLeaseQuery: any = {
      unitId,
      status: 'active'
    };

    if (isIndefinite) {
      // For indefinite lease, check if any active lease overlaps with start date or is indefinite
      overlappingLeaseQuery.OR = [
        { endDate: { gte: new Date(startDate) } }, // Active lease that ends after our start
        { endDate: { equals: null } } // Another indefinite lease (use equals for null check)
      ];
    } else if (endDate) {
      // For fixed-term lease, check for date range overlap
      overlappingLeaseQuery.OR = [
        {
          AND: [
            { startDate: { lte: new Date(startDate) } },
            { OR: [{ endDate: { gte: new Date(startDate) } }, { endDate: { equals: null } }] }
          ]
        },
        {
          AND: [
            { startDate: { lte: new Date(endDate) } },
            { OR: [{ endDate: { gte: new Date(endDate) } }, { endDate: { equals: null } }] }
          ]
        }
      ];
    }

    try {
      const overlappingLease = await prisma.leases.findFirst({
        where: overlappingLeaseQuery
      });

      if (overlappingLease) {
        return res.status(400).json({
          error: 'Unit already has an active lease for this period'
        });
      }
    } catch (queryError: any) {
      console.error('❌ Overlapping lease query error:', queryError);
      // If the query fails, skip the overlap check and proceed
      // This handles edge cases with null date comparisons
    }

    // Create or find tenant
    let tenant = await prisma.users.findFirst({
      where: {
        customerId,
        email: tenantEmail
      }
    });

    let tempPassword: string | null = null; // Store password to return in response
    let isNewTenant = false; // Track if we created a new tenant
    let shouldSendEmail = false; // Track if we should send welcome email

    if (!tenant) {
      isNewTenant = true;
      shouldSendEmail = true;
      // Create new tenant user
      const proposed = (clientProvidedTempPassword || clientProvidedPassword);
      // Basic validation for a provided password
      const isValidProvided = typeof proposed === 'string' && proposed.length >= 8;
      tempPassword = isValidProvided
        ? proposed
        : Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Set temp password expiry to 48 hours from now
      const tempPasswordExpiresAt = new Date();
      tempPasswordExpiresAt.setHours(tempPasswordExpiresAt.getHours() + 48);

      tenant = await prisma.users.create({
        data: {
          id: require('crypto').randomUUID(),
          customerId,
          name: tenantName,
          email: tenantEmail,
          password: hashedPassword, // Always set password, no invitation system for tenants
          phone: tenantPhone,
          role: 'tenant',
          status: 'active', // Always set to active so tenants can log in immediately
          isActive: true, // Explicitly set isActive to true
          is_temp_password: true, // Mark as temporary password
          temp_password_expires_at: tempPasswordExpiresAt, // Set expiry
          must_change_password: true, // Require password change on first login
          invitedAt: new Date(), // Track when tenant was invited
          // KYC requirements for tenants
          requiresKyc: true, // Tenants must complete KYC before accessing dashboard
          kycStatus: 'pending', // Initial KYC status
          updatedAt: new Date()
        }
      });

      console.log('✅ New tenant created with email:', tenantEmail);
      console.log('🔐 Generated password for tenant:', tempPassword);
    } else {
      console.log('ℹ️  Existing tenant found:', tenantEmail);

      // For existing tenants being assigned to a new lease,
      // we update their basic info but DO NOT reset their KYC status
      // KYC should only be deleted when the tenant is completely deleted from the system

      // Check if tenant needs a new password (e.g., if they don't have one or it's expired)
      const needsNewPassword = !tenant.password || tenant.is_temp_password;

      if (needsNewPassword) {
        const proposed = (clientProvidedTempPassword || clientProvidedPassword);
        const isValidProvided = typeof proposed === 'string' && proposed.length >= 8;
        tempPassword = isValidProvided
          ? proposed
          : Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Set temp password expiry to 48 hours from now
        const tempPasswordExpiresAt = new Date();
        tempPasswordExpiresAt.setHours(tempPasswordExpiresAt.getHours() + 48);

        // Update tenant with new password but preserve KYC status
        tenant = await prisma.users.update({
          where: { id: tenant.id },
          data: {
            name: tenantName, // Update name in case it changed
            phone: tenantPhone, // Update phone in case it changed
            password: hashedPassword,
            status: 'active',
            isActive: true,
            is_temp_password: true,
            temp_password_expires_at: tempPasswordExpiresAt,
            must_change_password: true,
            invitedAt: new Date(),
            // DO NOT reset KYC - preserve existing verification
            updatedAt: new Date()
          }
        });

        shouldSendEmail = true; // Send email to existing tenant with new credentials
        console.log('✅ Existing tenant updated with new credentials (KYC preserved):', tenantEmail);
        console.log('🔐 Generated new password for existing tenant:', tempPassword);
      } else {
        // Tenant already has a valid password, just update basic info
        tenant = await prisma.users.update({
          where: { id: tenant.id },
          data: {
            name: tenantName, // Update name in case it changed
            phone: tenantPhone, // Update phone in case it changed
            status: 'active',
            isActive: true,
            // DO NOT reset KYC - preserve existing verification
            updatedAt: new Date()
          }
        });

        console.log('✅ Existing tenant info updated (KYC and password preserved):', tenantEmail);
        // Don't send email if tenant already has credentials
        shouldSendEmail = false;
      }
    }

    // Generate lease number
    const leaseNumber = `LSE-${Date.now()}`;

    // Prepare lease data with optional endDate for indefinite leases
    const leaseData: any = {
      id: require('crypto').randomUUID(),
      propertyId,
      unitId,
      tenantId: tenant.id,
      leaseNumber,
      startDate: new Date(startDate),
      monthlyRent,
      securityDeposit: securityDeposit || 0,
      currency: currency || 'NGN',
      status: 'active',
      terms,
      specialClauses: {
        ...(specialClauses || {}),
        isIndefinite: !!isIndefinite
      },
      signedAt: new Date(),
      updatedAt: new Date()
    };

    // Only set endDate if not indefinite
    if (!isIndefinite && endDate) {
      leaseData.endDate = new Date(endDate);
    }

    console.log('📝 Creating lease with data:', JSON.stringify(leaseData, null, 2));

    // Create lease
    let lease;
    try {
      lease = await prisma.leases.create({
        data: leaseData,
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          properties: {
            select: {
              id: true,
              name: true
            }
          },
          units: {
            select: {
              id: true,
              unitNumber: true
            }
          }
        }
      });
    } catch (leaseCreateError: any) {
      console.error('❌ Lease creation error:', leaseCreateError);
      return res.status(500).json({
        error: 'Failed to create lease',
        details: leaseCreateError.message
      });
    }

    // Update unit status
    await prisma.units.update({
      where: { id: unitId },
      data: {
        status: 'occupied',
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId,
        userId,
        action: 'LEASE_CREATED',
        entity: 'Lease',
        entityId: lease.id,
        description: `Lease ${leaseNumber} created for ${tenantName}`
      }
    });

    // Always send invitation email when a lease is created (for both new and existing tenants)
    // This ensures tenants always receive their login credentials
    let emailSent = false;
    console.log('📧 Email check - shouldSendEmail:', shouldSendEmail, 'tempPassword exists:', !!tempPassword);
    if (shouldSendEmail && tempPassword) {
      console.log('📧 Preparing to send welcome email to new tenant:', tenantEmail);
      try {
        // Get user info (owner or manager) and customer company name for email
        const invitingUser = await prisma.users.findUnique({
          where: { id: userId },
          select: { name: true, role: true, customerId: true }
        });

        // Get the company name from the customer record
        let companyName: string | undefined;
        if (invitingUser?.customerId) {
          const customer = await prisma.customers.findUnique({
            where: { id: invitingUser.customerId },
            select: { company: true }
          });
          companyName = customer?.company || undefined;
        }

        emailSent = await sendTenantInvitation({
          tenantName,
          tenantEmail,
          tempPassword,
          propertyName: property.name,
          unitNumber: unit.unitNumber,
          leaseStartDate: startDate,
          companyName, // Property owner's company name
          ownerName: invitingUser?.role === 'owner' ? invitingUser.name : undefined,
          managerName: invitingUser?.role === 'manager' || invitingUser?.role === 'property_manager' ? invitingUser.name : undefined
        });

        if (emailSent) {
          console.log(`✅ Welcome email with login credentials sent to ${tenantEmail}`);
        } else {
          console.warn(`⚠️ Failed to send welcome email to ${tenantEmail}, but tenant was created successfully`);
        }
      } catch (emailError: any) {
        console.error('❌ Failed to send invitation email:', emailError);
        // Don't fail the lease creation if email fails
      }
    }

    return res.status(201).json({
      lease,
      tenant,
      emailSent, // Let frontend know if email was sent
      ...(tempPassword && { tempPassword }) // Return actual generated password if tenant was newly created
    });

  } catch (error: any) {
    console.error('Create lease error:', error);
    console.error('Error details:', error.message, error.stack);
    return res.status(500).json({
      error: 'Failed to create lease',
      details: error.message
    });
  }
});

// Update lease
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Check access
    const existingLease = await prisma.leases.findFirst({
      where: {
        id,
        properties: {
          OR: [
            { ownerId: userId },
            { property_managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: { properties: true }
    });

    if (!existingLease) {
      return res.status(404).json({ error: 'Lease not found or access denied' });
    }

    const {
      startDate,
      endDate,
      monthlyRent,
      securityDeposit,
      status,
      terms,
      specialClauses,
      terminationReason
    } = req.body;

    const lease = await prisma.leases.update({
      where: { id },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        monthlyRent,
        securityDeposit,
        status,
        terms,
        specialClauses,
        terminationReason,
        terminatedAt: status === 'terminated' ? new Date() : undefined,
        updatedAt: new Date()
      }
    });

    // If lease is terminated, update unit status
    if (status === 'terminated' || status === 'expired') {
      await prisma.units.update({
        where: { id: existingLease.unitId },
        data: {
          status: 'vacant',
          updatedAt: new Date()
        }
      });
    }

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: existingLease.properties.customerId,
        userId,
        action: 'LEASE_UPDATED',
        entity: 'Lease',
        entityId: lease.id,
        description: `Lease ${lease.leaseNumber} updated`
      }
    });

    return res.json(lease);

  } catch (error: any) {
    console.error('Update lease error:', error);
    return res.status(500).json({ error: 'Failed to update lease' });
  }
});

// Terminate lease
router.post('/:id/terminate', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    const lease = await prisma.leases.findFirst({
      where: {
        id,
        properties: {
          OR: [
            { ownerId: userId },
            { property_managers: { some: { managerId: userId, isActive: true } } }
          ]
        }
      },
      include: { properties: true }
    });

    if (!lease) {
      return res.status(404).json({ error: 'Lease not found or access denied' });
    }

    const updatedLease = await prisma.leases.update({
      where: { id },
      data: {
        status: 'terminated',
        terminatedAt: new Date(),
        terminationReason: reason,
        updatedAt: new Date()
      }
    });

    // Update unit status
    await prisma.units.update({
      where: { id: lease.unitId },
      data: {
        status: 'vacant',
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity_logs.create({
      data: {
        id: require('crypto').randomUUID(),
        customerId: lease.properties.customerId,
        userId,
        action: 'LEASE_TERMINATED',
        entity: 'Lease',
        entityId: lease.id,
        description: `Lease ${lease.leaseNumber} terminated`
      }
    });

    return res.json(updatedLease);

  } catch (error: any) {
    console.error('Terminate lease error:', error);
    return res.status(500).json({ error: 'Failed to terminate lease' });
  }
});

// Get tenants
router.get('/tenants/list', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status } = req.query;
    const userId = req.user?.id;
    const customerId = req.user?.customerId;

    const where: any = {
      customerId,
      role: 'tenant'
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const tenants = await prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        tenantLeases: {
          where: { status: 'active' },
          include: {
            property: {
              select: {
                id: true,
                name: true
              }
            },
            unit: {
              select: {
                id: true,
                unitNumber: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(tenants);

  } catch (error: any) {
    console.error('Get tenants error:', error);
    return res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

export default router;


