import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';
import prisma from '../lib/db';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Mock data for development (INTERNAL ADMIN USERS ONLY)
const mockUsers = [
  {
    id: 'admin-1',
    name: 'Admin User',
    email: 'admin@propertyhub.com',
    role: 'admin',
    status: 'active',
    customerId: null, // Internal admin user, not associated with a customer
    customer: null,
    department: 'Administration',
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'admin-2',
    name: 'Support Staff',
    email: 'support@propertyhub.com',
    role: 'admin',
    status: 'active',
    customerId: null, // Internal admin user
    customer: null,
    department: 'Customer Support',
    lastLogin: new Date(),
    createdAt: new Date('2024-01-05')
  }
];

// Get all users
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, role, customerId } = req.query;

    // Try database first
    try {
      const where: any = {
        customerId: null // ONLY internal admin users (not associated with customers)
      };

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { company: { contains: search as string, mode: 'insensitive' } },
          { department: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (status) {
        where.status = status;
      }

      if (role) {
        where.role = role;
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      // Remove passwords from response
      const usersWithoutPassword = users.map(({ password, ...user }) => user);

      console.log('✅ Internal admin users fetched:', usersWithoutPassword.length);

      return res.json(usersWithoutPassword);
    } catch (dbError: any) {
      // Database not available, return mock data
      console.log('📝 Using mock internal admin users data');
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

// Create user (INTERNAL ADMIN USER ONLY - for User Management)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
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
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, role' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate temporary password if not sending invite
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-2).toUpperCase();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.user.create({
      data: {
        customerId: null, // INTERNAL ADMIN USER - not associated with any customer
        name,
        email,
        password: sendInvite ? null : hashedPassword,
        phone,
        role: role || 'admin', // Default to admin role for internal users
        department,
        company: company || 'PropertyHub Admin', // Internal admin company
        permissions,
        isActive: isActive !== undefined ? isActive : true,
        status: sendInvite ? 'pending' : 'active',
        invitedAt: sendInvite ? new Date() : null
      }
    });

    console.log('✅ Internal admin user created:', user.email);

    // Note: No activity log for internal users since they don't belong to a customer

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

// Update user (INTERNAL ADMIN USER ONLY)
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
      }
    });

    console.log('✅ Internal admin user updated:', user.email);

    // Note: No activity log for internal users since they don't belong to a customer

    const { password, ...userWithoutPassword } = user;

    return res.json(userWithoutPassword);

  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset password for internal user
router.post('/:id/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a new temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update user's password in the database
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword
      }
    });

    console.log('✅ Password reset for internal user:', user.email);

    // Return the temporary password (for admin to give to user)
    return res.json({
      message: 'Password reset successfully',
      tempPassword: tempPassword
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user (INTERNAL ADMIN USER ONLY)
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

    console.log('✅ Internal admin user deleted:', user.email);

    // Note: No activity log for internal users since they don't belong to a customer

    return res.json({ message: 'User deleted successfully' });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;


