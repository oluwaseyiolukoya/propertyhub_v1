import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Mock data for development
const mockUsers = [
  {
    id: 'owner-1',
    name: 'John Smith',
    email: 'john@metro-properties.com',
    role: 'owner',
    status: 'active',
    customerId: 'customer-1',
    customer: { id: 'customer-1', company: 'Metro Properties LLC', status: 'active' },
    lastLogin: new Date(),
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'manager-1',
    name: 'Sarah Johnson',
    email: 'sarah@propertyhub.com',
    role: 'manager',
    status: 'active',
    customerId: 'customer-1',
    customer: { id: 'customer-1', company: 'Metro Properties LLC', status: 'active' },
    lastLogin: new Date(),
    createdAt: new Date('2024-01-20')
  }
];

// Get all users
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, role, customerId } = req.query;

    // Try database first
    try {
      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (role) {
        where.role = role;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      const users = await prisma.user.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              company: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Remove passwords from response
      const usersWithoutPassword = users.map(({ password, ...user }) => user);

      return res.json(usersWithoutPassword);
    } catch (dbError) {
      // Database not available, return mock data
      console.log('📝 Using mock users data');
      return res.json(mockUsers);
    }

  } catch (error: any) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        customer: true,
        properties: {
          select: {
            id: true,
            name: true,
            propertyType: true,
            status: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;

    return res.json(userWithoutPassword);

  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      customerId,
      name,
      email,
      phone,
      role,
      department,
      company,
      permissions,
      isActive,
      sendInvite
    } = req.body;

    // Validate required fields
    if (!customerId || !name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate temporary password if not sending invite
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        customerId,
        name,
        email,
        password: sendInvite ? null : hashedPassword,
        phone,
        role,
        department,
        company,
        permissions,
        isActive: isActive !== undefined ? isActive : true,
        status: sendInvite ? 'pending' : 'active',
        invitedAt: sendInvite ? new Date() : null
      },
      include: {
        customer: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId,
        userId: req.user?.id,
        action: 'create',
        entity: 'user',
        entityId: user.id,
        description: `User ${name} created by admin`
      }
    });

    // TODO: Send invitation email if sendInvite is true

    const { password, ...userWithoutPassword } = user;

    return res.status(201).json({
      ...userWithoutPassword,
      ...(!sendInvite && { tempPassword })
    });

  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      department,
      company,
      permissions,
      isActive,
      status
    } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        role,
        department,
        company,
        permissions,
        isActive,
        status
      },
      include: {
        customer: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId: user.customerId,
        userId: req.user?.id,
        action: 'update',
        entity: 'user',
        entityId: user.id,
        description: `User ${name} updated by admin`
      }
    });

    const { password, ...userWithoutPassword } = user;

    return res.json(userWithoutPassword);

  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        customerId: user.customerId,
        userId: req.user?.id,
        action: 'delete',
        entity: 'user',
        entityId: id,
        description: `User ${user.name} deleted by admin`
      }
    });

    return res.json({ message: 'User deleted successfully' });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;


